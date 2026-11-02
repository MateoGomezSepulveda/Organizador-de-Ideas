import { IdeaCategory, RoadmapPhase } from '../types/domain';

export interface AiIdeaSuggestion {
  improvedSummary: string;
  problem: string;
  hypothesis: string;
  suggestedCategory: IdeaCategory;
  suggestedSteps: string[];
  agentAdvice: string;
  roadmap: RoadmapPhase[];
}

type AiProvider = 'gemini' | 'openai' | 'groq' | 'xai';

function getConfiguredAiKey(): { apiKey: string; provider: AiProvider } | null {
  const env = import.meta.env;
  const rawKey = (
    env.VITE_AI_API_KEY ||
    env.VITE_GEMINI_API_KEY ||
    env.VITE_OPENAI_API_KEY ||
    env.VITE_GROQ_API_KEY ||
    env.VITE_XAI_API_KEY ||
    ''
  ).trim();

  if (!rawKey) return null;

  if (env.VITE_GROQ_API_KEY || rawKey.startsWith('gsk_')) {
    return { apiKey: rawKey, provider: 'groq' };
  }
  if (env.VITE_XAI_API_KEY || rawKey.startsWith('xai-')) {
    return { apiKey: rawKey, provider: 'xai' };
  }
  if (env.VITE_OPENAI_API_KEY || rawKey.startsWith('sk-')) {
    return { apiKey: rawKey, provider: 'openai' };
  }
  return { apiKey: rawKey, provider: 'gemini' };
}

export function isAiAgentConfigured(): boolean {
  return getConfiguredAiKey() !== null;
}

interface GeminiModelOption {
  name: string;
  /** Activa thinkingConfig.thinkingLevel = 'high' (razonamiento profundo). */
  deepThinking: boolean;
}

/**
 * Cadena de modelos verificada contra la API (nov-2026):
 * - Los modelos Pro (gemini-3.1-pro, gemini-pro-latest) tienen cuota 0 en el plan gratuito (429),
 *   por eso solo se usan si se configuran explícitamente con VITE_AI_MODEL (requiere facturación).
 * - gemini-2.5-* ya devuelve 404.
 * - gemini-3.5-flash con thinkingLevel 'high' es el mejor equilibrio calidad/disponibilidad.
 */
const DEFAULT_GEMINI_MODELS: GeminiModelOption[] = [
  { name: 'gemini-3.5-flash', deepThinking: true },
  { name: 'gemini-3.7-flash', deepThinking: true },
  { name: 'gemini-flash-latest', deepThinking: false },
  { name: 'gemini-3.5-flash-lite', deepThinking: false },
];

function getGeminiModelChain(): GeminiModelOption[] {
  const preferred = (import.meta.env.VITE_AI_MODEL || '').trim();
  const chain = preferred
    ? [
        { name: preferred, deepThinking: true },
        ...DEFAULT_GEMINI_MODELS.filter((m) => m.name !== preferred),
      ]
    : [...DEFAULT_GEMINI_MODELS];
  // Omitir modelos que en esta sesión ya respondieron 404 o cuota 0
  return chain.filter((m) => !unavailableModels.has(m.name));
}

/** Modelos descartados durante la sesión (no existen o sin cuota en el plan actual). */
const unavailableModels = new Set<string>();

/** Errores temporales que vale la pena reintentar en el mismo modelo. */
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);
const MAX_RETRIES_PER_MODEL = 2;
const GEMINI_TIMEOUT_MS = 90000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeGeminiFailure(status: number): string {
  if (status === 0) return 'sin respuesta/tiempo agotado';
  if (status === 404) return 'no disponible';
  if (status === 429) return 'cuota agotada';
  if (status === 503) return 'saturado';
  if (status === 400) return 'petición rechazada';
  if (status === 401 || status === 403) return 'API Key sin permiso';
  return `error ${status}`;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 60000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function extractGeminiText(data: unknown): string {
  type GeminiPart = { text?: string; thought?: boolean };
  const parts: GeminiPart[] =
    (data as { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> })
      ?.candidates?.[0]?.content?.parts || [];
  const nonThoughtText = parts
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('\n')
    .trim();
  return nonThoughtText || parts?.[0]?.text || '';
}

async function callGeminiWithFallback(
  apiKey: string,
  prompt: string,
  expectJson = false
): Promise<string> {
  const failures: string[] = [];
  const chain = getGeminiModelChain();

  for (const model of chain) {
    let useThinking = model.deepThinking;
    let lastStatus = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.name}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`;
        const response = await fetchWithTimeout(
          url,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                ...(expectJson ? { responseMimeType: 'application/json' } : {}),
                ...(useThinking
                  ? { thinkingConfig: { thinkingLevel: 'high' } }
                  : {}),
              },
            }),
          },
          GEMINI_TIMEOUT_MS
        );

        if (response.ok) {
          const text = extractGeminiText(await response.json());
          if (text) return text;
          lastStatus = 0;
          break; // Respuesta vacía: pasar al siguiente modelo
        }

        lastStatus = response.status;
        const errText = await response.text();

        // 400 con thinkingConfig: el modelo no soporta razonamiento extendido -> reintentar sin él
        if (response.status === 400 && useThinking) {
          useThinking = false;
          continue;
        }

        // 404 o cuota 0 del plan gratuito: descartar el modelo durante la sesión
        if (
          response.status === 404 ||
          (response.status === 429 && /limit:\s*0/.test(errText))
        ) {
          unavailableModels.add(model.name);
          break;
        }

        // Saturación temporal (503, 500...): esperar con backoff y reintentar el mismo modelo
        if (
          RETRYABLE_STATUSES.has(response.status) &&
          attempt < MAX_RETRIES_PER_MODEL
        ) {
          await sleep(1500 * 2 ** attempt);
          continue;
        }

        break; // Otros errores (429 por minuto, 401, 403...): siguiente modelo
      } catch {
        // Timeout o error de red: no reintentar el mismo modelo (ya esperamos demasiado)
        lastStatus = 0;
        break;
      }
    }

    failures.push(`${model.name}: ${describeGeminiFailure(lastStatus)}`);
  }

  throw new Error(
    `Los modelos de IA están ocupados en este momento. Espera unos segundos y vuelve a intentarlo. (Detalle: ${
      failures.join(' · ') || 'no hay modelos disponibles para tu API Key'
    })`
  );
}

async function callLlmApi(prompt: string, expectJson = false): Promise<string> {
  const config = getConfiguredAiKey();
  if (!config) {
    throw new Error(
      'Falta tu API Key de IA: agrega VITE_AI_API_KEY=tu_clave en tu archivo .env y reinicia el servidor (npm run dev).'
    );
  }

  const { apiKey, provider } = config;

  if (provider === 'gemini') {
    return callGeminiWithFallback(apiKey, prompt, expectJson);
  }

  const endpoint =
    provider === 'groq'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : provider === 'xai'
      ? 'https://api.x.ai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

  // Modelos de máxima capacidad para cada proveedor
  const model =
    provider === 'groq'
      ? 'llama-3.3-70b-versatile'
      : provider === 'xai'
      ? 'grok-2-latest'
      : 'gpt-4o';

  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        ...(expectJson && provider === 'openai'
          ? { response_format: { type: 'json_object' } }
          : {}),
        messages: [
          {
            role: 'system',
            content:
              'Eres un Consultor Senior de Producto, Arquitectura de Negocios e Innovación Estratégica. Diseñas análisis profundos y Roadmaps ejecutivos de nivel profesional en español.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    },
    60000
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `Error del Agente IA (${provider.toUpperCase()} ${response.status}): verifica tu VITE_AI_API_KEY en el archivo .env. ${errText.slice(0, 140)}`
    );
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || 'Sin respuesta del agente.';
}

function extractJsonBlock(rawText: string): Record<string, unknown> | null {
  try {
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

const VALID_CATEGORIES = new Set<IdeaCategory>([
  'product',
  'business',
  'content',
  'tech',
  'personal',
]);

function buildFallbackRoadmap(title: string): RoadmapPhase[] {
  return [
    {
      id: `phase-1-${Date.now()}`,
      phase: 'Fase 1: Investigación, Definición y Arquitectura',
      duration: 'Semanas 1 - 2',
      objective: `Definir el alcance estratégico, público objetivo y requerimientos clave para "${title}".`,
      deliverables: [
        'Documento de alcance y propuesta de valor diferenciada',
        'Mapa de requerimientos funcionales y técnicos',
      ],
      tasks: [
        'Investigar soluciones existentes e identificar oportunidades de mejora',
        'Definir el perfil exacto del usuario o beneficiario principal',
        'Establecer los indicadores clave de éxito (KPIs)',
      ],
    },
    {
      id: `phase-2-${Date.now()}`,
      phase: 'Fase 2: Diseño y Construcción del Prototipo / MVP',
      duration: 'Semanas 3 - 4',
      objective:
        'Construir la primera versión funcional enfocada en resolver el problema principal.',
      deliverables: [
        'Prototipo funcional o Producto Mínimo Viable (MVP)',
        'Flujo principal operativo de principio a fin',
      ],
      tasks: [
        'Diseñar la estructura y experiencia de usuario',
        'Desarrollar los componentes o procesos esenciales del núcleo',
        'Realizar pruebas internas de funcionamiento',
      ],
    },
    {
      id: `phase-3-${Date.now()}`,
      phase: 'Fase 3: Validación Piloto y Optimización',
      duration: 'Semanas 5 - 6',
      objective:
        'Validar la solución en un entorno real y ajustar según retroalimentación.',
      deliverables: [
        'Reporte de validación y métricas de uso real',
        'Versión optimizada tras corrección de fricciones',
      ],
      tasks: [
        'Ejecutar prueba piloto con primeros usuarios reales',
        'Medir tiempos, conversión o satisfacción',
        'Iterar sobre los puntos críticos detectados',
      ],
    },
    {
      id: `phase-4-${Date.now()}`,
      phase: 'Fase 4: Lanzamiento Oficial y Escalamiento',
      duration: 'Semana 7 en adelante',
      objective:
        'Desplegar la versión definitiva y sistematizar su crecimiento continuo.',
      deliverables: [
        'Lanzamiento en producción completo',
        'Plan de crecimiento y mejora continua',
      ],
      tasks: [
        'Publicar y comunicar el lanzamiento oficial',
        'Automatizar procesos repetitivos y monitoreo',
        'Planificar la siguiente iteración de funcionalidades',
      ],
    },
  ];
}

/**
 * Analiza profundamente una idea y genera una propuesta de valor robusta,
 * problema, hipótesis, pasos de acción y un Roadmap completo por fases.
 */
export async function generateIdeaHelpWithAi(
  title: string,
  currentNotes = ''
): Promise<AiIdeaSuggestion> {
  const prompt = `
Actúa como un Director de Producto, Arquitecto de Soluciones y Consultor Estratégico Senior.
El usuario quiere desarrollar a profundidad la siguiente idea:
- Título de la Idea: "${title}"
- Contexto / Notas actuales: "${currentNotes || 'Ninguna todavía'}"

Piensa paso a paso y diseña una propuesta profunda, realista, ambiciosa y sumamente detallada, acompañada de una Hoja de Ruta (Roadmap) ejecutiva completa de principio a fin.

Devuelve ÚNICAMENTE un objeto JSON válido (sin texto adicional fuera del JSON) con esta estructura exacta:
{
  "improvedSummary": "Desarrollo profundo de la idea en 3 a 4 párrafos bien estructurados (separados por saltos de línea \\n\\n): 1) Visión y Propuesta de Valor única, 2) Cómo funciona exactamente y qué la hace diferente, 3) Público objetivo e impacto esperado, 4) Modelo de implementación o sostenibilidad.",
  "problem": "Descripción profunda y específica del problema o necesidad real que resuelve esta idea y por qué las alternativas actuales no son suficientes.",
  "hypothesis": "Hipótesis de validación medible (Ej. Creemos que al implementar X para el segmento Y lograremos alcanzar Z métrica en N semanas).",
  "suggestedCategory": "product | business | content | tech | personal",
  "agentAdvice": "Consejo estratégico experto (arquitectura, diferenciación, riesgos clave a evitar y ventaja competitiva).",
  "suggestedSteps": [
    "Paso accionable detallado 1",
    "Paso accionable detallado 2",
    "Paso accionable detallado 3",
    "Paso accionable detallado 4",
    "Paso accionable detallado 5",
    "Paso accionable detallado 6"
  ],
  "roadmap": [
    {
      "phase": "Fase 1: Investigación, Estrategia y Cimientos",
      "duration": "Semanas 1 - 2",
      "objective": "Objetivo concreto y medible de esta fase.",
      "deliverables": [
        "Entregable tangible 1 de la Fase 1",
        "Entregable tangible 2 de la Fase 1"
      ],
      "tasks": [
        "Tarea detallada 1 a realizar en esta fase",
        "Tarea detallada 2 a realizar en esta fase",
        "Tarea detallada 3 a realizar en esta fase"
      ]
    },
    {
      "phase": "Fase 2: Diseño y Construcción del MVP / Núcleo",
      "duration": "Semanas 3 - 5",
      "objective": "Objetivo concreto y medible de la Fase 2.",
      "deliverables": [
        "Entregable tangible 1 de la Fase 2",
        "Entregable tangible 2 de la Fase 2"
      ],
      "tasks": [
        "Tarea detallada 1",
        "Tarea detallada 2",
        "Tarea detallada 3"
      ]
    },
    {
      "phase": "Fase 3: Pruebas Piloto, Validación y Refinamiento",
      "duration": "Semanas 6 - 7",
      "objective": "Objetivo concreto y medible de la Fase 3.",
      "deliverables": [
        "Entregable tangible 1 de la Fase 3",
        "Entregable tangible 2 de la Fase 3"
      ],
      "tasks": [
        "Tarea detallada 1",
        "Tarea detallada 2",
        "Tarea detallada 3"
      ]
    },
    {
      "phase": "Fase 4: Lanzamiento, Consolidación y Escalamiento",
      "duration": "Semana 8 en adelante",
      "objective": "Objetivo concreto y medible de la Fase 4.",
      "deliverables": [
        "Entregable tangible 1 de la Fase 4",
        "Entregable tangible 2 de la Fase 4"
      ],
      "tasks": [
        "Tarea detallada 1",
        "Tarea detallada 2",
        "Tarea detallada 3"
      ]
    }
  ]
}
`.trim();

  const rawResponse = await callLlmApi(prompt, true);
  const parsed = extractJsonBlock(rawResponse);

  if (!parsed) {
    return {
      improvedSummary: rawResponse.trim().slice(0, 3000),
      problem: `Necesidad de estructurar y ejecutar "${title}" con un plan claro.`,
      hypothesis: `Al ejecutar el roadmap por fases lograremos validar "${title}" en las primeras 4 semanas.`,
      suggestedCategory: 'product',
      agentAdvice: 'Idea analizada en profundidad por tu Agente de IA.',
      suggestedSteps: [
        'Definir el alcance y propuesta de valor central',
        'Construir el primer prototipo o versión mínima viable (MVP)',
        'Validar con usuarios reales y medir resultados',
      ],
      roadmap: buildFallbackRoadmap(title),
    };
  }

  const rawCat = String(
    parsed.suggestedCategory || 'product'
  ).toLowerCase() as IdeaCategory;
  const suggestedCategory: IdeaCategory = VALID_CATEGORIES.has(rawCat)
    ? rawCat
    : 'product';

  const rawSteps = Array.isArray(parsed.suggestedSteps)
    ? parsed.suggestedSteps
    : [];
  const suggestedSteps = rawSteps
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 10);

  const rawRoadmap = Array.isArray(parsed.roadmap) ? parsed.roadmap : [];
  const roadmap: RoadmapPhase[] =
    rawRoadmap.length > 0
      ? rawRoadmap.map((item: unknown, idx: number) => {
          const obj = (item && typeof item === 'object' ? item : {}) as Record<
            string,
            unknown
          >;
          return {
            id: `phase-${Date.now()}-${idx}`,
            phase:
              typeof obj.phase === 'string' && obj.phase.trim()
                ? obj.phase.trim()
                : `Fase ${idx + 1}`,
            duration:
              typeof obj.duration === 'string' && obj.duration.trim()
                ? obj.duration.trim()
                : `Etapa ${idx + 1}`,
            objective:
              typeof obj.objective === 'string' && obj.objective.trim()
                ? obj.objective.trim()
                : 'Ejecutar los entregables clave de esta etapa.',
            deliverables: Array.isArray(obj.deliverables)
              ? obj.deliverables.map((d) => String(d).trim()).filter(Boolean)
              : [],
            tasks: Array.isArray(obj.tasks)
              ? obj.tasks.map((t) => String(t).trim()).filter(Boolean)
              : [],
          };
        })
      : buildFallbackRoadmap(title);

  return {
    improvedSummary:
      typeof parsed.improvedSummary === 'string' &&
      parsed.improvedSummary.trim()
        ? parsed.improvedSummary.trim()
        : currentNotes,
    problem:
      typeof parsed.problem === 'string' && parsed.problem.trim()
        ? parsed.problem.trim()
        : '',
    hypothesis:
      typeof parsed.hypothesis === 'string' && parsed.hypothesis.trim()
        ? parsed.hypothesis.trim()
        : '',
    suggestedCategory,
    agentAdvice:
      typeof parsed.agentAdvice === 'string' && parsed.agentAdvice.trim()
        ? parsed.agentAdvice.trim()
        : 'Enfócate en completar los entregables de la Fase 1 antes de escalar.',
    suggestedSteps:
      suggestedSteps.length > 0
        ? suggestedSteps
        : [
            'Definir el primer entregable funcional',
            'Validar la propuesta con primeros usuarios',
          ],
    roadmap,
  };
}

/**
 * Permite hacerle cualquier consulta libre y profunda al Agente de IA sobre una idea específica.
 */
export async function askAiAgentAboutIdea(
  title: string,
  notes: string,
  userQuestion: string
): Promise<string> {
  const prompt = `
Estás asesorando estratégicamente al usuario con su idea en su organizador personal:
- Idea: "${title}"
- Notas actuales de la idea: "${notes || 'Sin notas aún'}"

Pregunta o solicitud del usuario:
"${userQuestion}"

Responde en español de forma estructurada, profunda, práctica y accionable (máximo 250 palabras).
`.trim();

  const reply = await callLlmApi(prompt, false);
  return reply.trim();
}
