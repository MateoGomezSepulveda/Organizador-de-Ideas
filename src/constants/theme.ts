import {
  IdeaCategory,
  IdeaEnergyLevel,
  IdeaStage,
  IdeaTemplateType,
  IdeaBlock,
} from '../types/domain';

export interface StageMetadata {
  id: IdeaStage;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  borderClass: string;
  accentColor: string;
}

export const IDEA_STAGES: StageMetadata[] = [
  {
    id: 'spark',
    label: 'Chispa / Inbox',
    shortLabel: 'Chispa',
    description: 'Ideas frescas recién capturadas listas para ser destiladas.',
    badgeClass:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70',
    borderClass: 'border-t-amber-500',
    accentColor: '#F59E0B',
  },
  {
    id: 'exploring',
    label: 'En Exploración',
    shortLabel: 'Exploración',
    description: 'Investigando el problema, mercado e inspiración inicial.',
    badgeClass:
      'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70',
    borderClass: 'border-t-sky-500',
    accentColor: '#0EA5E9',
  },
  {
    id: 'validating',
    label: 'En Validación',
    shortLabel: 'Validación',
    description: 'Ejecutando experimentos y pruebas de hipótesis reales.',
    badgeClass:
      'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/70',
    borderClass: 'border-t-violet-500',
    accentColor: '#8B5CF6',
  },
  {
    id: 'building',
    label: 'En Construcción',
    shortLabel: 'Construcción',
    description: 'Desarrollando prototipo, MVP o primer entregable tangible.',
    badgeClass:
      'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/70',
    borderClass: 'border-t-teal-500',
    accentColor: '#0D9488',
  },
  {
    id: 'launched',
    label: 'Lanzada / Activa',
    shortLabel: 'Lanzada',
    description: 'Idea materializada y generando impacto medible.',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70',
    borderClass: 'border-t-emerald-500',
    accentColor: '#10B981',
  },
  {
    id: 'archived',
    label: 'Archivada / Pausa',
    shortLabel: 'Archivada',
    description: 'En congelador estratégico o descartada tras validación.',
    badgeClass:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    borderClass: 'border-t-slate-400',
    accentColor: '#64748B',
  },
];

export const STAGE_MAP: Record<IdeaStage, StageMetadata> = IDEA_STAGES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<IdeaStage, StageMetadata>
);

export interface CategoryMetadata {
  id: IdeaCategory;
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const IDEA_CATEGORIES: CategoryMetadata[] = [
  {
    id: 'product',
    label: 'Producto / SaaS',
    badgeClass:
      'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    dotClass: 'bg-teal-500',
  },
  {
    id: 'business',
    label: 'Negocio & Monetización',
    badgeClass:
      'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    dotClass: 'bg-indigo-500',
  },
  {
    id: 'tech',
    label: 'Tecnología / IA',
    badgeClass:
      'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    dotClass: 'bg-cyan-500',
  },
  {
    id: 'content',
    label: 'Contenido & Media',
    badgeClass:
      'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    dotClass: 'bg-orange-500',
  },
  {
    id: 'personal',
    label: 'Vida & Sistemas',
    badgeClass:
      'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    dotClass: 'bg-rose-500',
  },
];

export const CATEGORY_MAP: Record<IdeaCategory, CategoryMetadata> =
  IDEA_CATEGORIES.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<IdeaCategory, CategoryMetadata>);

export const ENERGY_LABELS: Record<
  IdeaEnergyLevel,
  { label: string; badgeClass: string }
> = {
  low: {
    label: 'Energía Baja (Rápida)',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  },
  medium: {
    label: 'Energía Media',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  },
  high: {
    label: 'Energía Alta (Deep Work)',
    badgeClass:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
  },
};

export interface TemplateBlueprint {
  id: IdeaTemplateType;
  name: string;
  description: string;
  defaultBlocks: Omit<IdeaBlock, 'id'>[];
  defaultSteps: string[];
}

export const IDEA_TEMPLATES: Record<IdeaTemplateType, TemplateBlueprint> = {
  blank: {
    id: 'blank',
    name: 'Nota Libre',
    description: 'Estructura limpia para capturar una chispa sin fricción.',
    defaultBlocks: [
      { label: 'Contexto e Inspiración', content: '' },
    ],
    defaultSteps: ['Definir el problema principal en una frase'],
  },
  lean_canvas: {
    id: 'lean_canvas',
    name: 'Lean Canvas Express',
    description: 'Marco táctico para productos digitales, micro-SaaS y modelos de negocio.',
    defaultBlocks: [
      {
        label: 'Propuesta de Valor Única',
        content: '¿Por qué esta solución es 10x mejor o más simple que las alternativas actuales?',
      },
      {
        label: 'Segmento de Early Adopters',
        content: '¿Quién sufre este problema con mayor urgencia hoy mismo?',
      },
      {
        label: 'Modelo de Ingresos / Sostenibilidad',
        content: 'Suscripción recurrente, pago único, freemium o uso interno.',
      },
      {
        label: 'Ventaja Competitiva / Foso',
        content: 'Distribución, datos propietarios, UX superior o automatización.',
      },
    ],
    defaultSteps: [
      'Entrevistar a 5 usuarios potenciales sobre cómo resuelven el problema hoy',
      'Crear landing page o mockup interactivo en menos de 48h',
      'Conseguir las primeras 3 reservas o confirmaciones de uso',
    ],
  },
  experiment: {
    id: 'experiment',
    name: 'Ficha de Experimento Científico',
    description: 'Valida una hipótesis de alto riesgo con criterios claros de éxito o descarte.',
    defaultBlocks: [
      {
        label: 'Creencia Clave',
        content: 'Creemos que si implementamos [X] para [audiencia Y]...',
      },
      {
        label: 'Métrica de Éxito (Umbral)',
        content: 'Sabremos que tuvimos éxito si al menos el 25% realiza la acción esperada.',
      },
      {
        label: 'Costo y Tiempo Acotado (Timebox)',
        content: 'Máximo 5 horas de inversión durante esta semana.',
      },
    ],
    defaultSteps: [
      'Definir métrica cuantitativa de validación',
      'Ejecutar prueba controlada durante 7 días',
      'Analizar resultados y decidir: Construir, Pivotar o Archivar',
    ],
  },
  pitch: {
    id: 'pitch',
    name: 'Guion / Pitch de Contenido',
    description: 'Ideal para artículos técnicos, videos, charlas o lanzamientos.',
    defaultBlocks: [
      {
        label: 'Gancho Principal (Hook)',
        content: 'La paradoja o pregunta contraintuitiva que atrapa la atención en 5 segundos.',
      },
      {
        label: 'Transformación / Takeaway',
        content: '¿Qué sabrá o podrá hacer la audiencia al terminar de consumir esta pieza?',
      },
      {
        label: 'Llamado a la Acción (CTA)',
        content: 'Probar herramienta, compartir experiencia o descargar plantilla.',
      },
    ],
    defaultSteps: [
      'Validar interés del título con 3 variantes',
      'Estructurar puntos clave y ejemplos visuales',
      'Publicar y medir retención / feedback',
    ],
  },
};
