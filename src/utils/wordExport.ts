import { CATEGORY_MAP } from '../constants/theme';
import { Idea, RoadmapPhase } from '../types/domain';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getDefaultRoadmapIfEmpty(idea: Idea): RoadmapPhase[] {
  if (idea.roadmap && idea.roadmap.length > 0) {
    return idea.roadmap;
  }
  return [
    {
      id: 'default-1',
      phase: 'Fase 1: Definición y Planificación Estratégica',
      duration: 'Semanas 1 - 2',
      objective: `Estructurar las bases y el alcance principal de "${idea.title}".`,
      deliverables: ['Alcance definido', 'Lista de recursos necesarios'],
      tasks:
        idea.validationSteps.length > 0
          ? idea.validationSteps.map((s) => s.text)
          : ['Definir objetivos principales', 'Validar factibilidad inicial'],
    },
  ];
}

export function generateIdeaWordDocumentHtml(idea: Idea): string {
  const categoryLabel = CATEGORY_MAP[idea.category]?.label || idea.category;
  const stageLabel =
    idea.stage === 'launched'
      ? 'Completada'
      : idea.stage === 'spark'
      ? 'Por Explorar'
      : 'En Desarrollo';

  const phases = getDefaultRoadmapIfEmpty(idea);
  const formattedDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const summaryParagraphs = (idea.summary || 'Sin descripción registrada.')
    .split(/\n+/)
    .filter(Boolean)
    .map((p) => `<p class="body-text">${escapeHtml(p)}</p>`)
    .join('');

  const phasesHtml = phases
    .map(
      (phase, idx) => `
      <div class="phase-card">
        <table class="phase-table" width="100%" cellpadding="8" cellspacing="0">
          <thead>
            <tr>
              <th class="phase-header" colspan="2">
                <span class="phase-badge">FASE ${idx + 1} — </span>
                ${escapeHtml(phase.phase)}
                <span class="phase-duration">(${escapeHtml(phase.duration)})</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td width="25%" class="cell-label"><strong>Objetivo Principal</strong></td>
              <td width="75%" class="cell-content">${escapeHtml(phase.objective)}</td>
            </tr>
            <tr>
              <td width="25%" class="cell-label"><strong>Entregables Clave</strong></td>
              <td width="75%" class="cell-content">
                <ul>
                  ${phase.deliverables
                    .map((d) => `<li>${escapeHtml(d)}</li>`)
                    .join('')}
                </ul>
              </td>
            </tr>
            <tr>
              <td width="25%" class="cell-label"><strong>Actividades / Tareas</strong></td>
              <td width="75%" class="cell-content">
                <ol>
                  ${phase.tasks
                    .map((t) => `<li>${escapeHtml(t)}</li>`)
                    .join('')}
                </ol>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `
    )
    .join('<br/>');

  const checklistHtml =
    idea.validationSteps.length > 0
      ? `
      <h2>4. Checklist de Ejecución y Pasos Accionables</h2>
      <table class="phase-table" width="100%" cellpadding="6" cellspacing="0">
        <thead>
          <tr>
            <th width="18%" class="table-subhead">Estado</th>
            <th width="82%" class="table-subhead">Paso / Tarea de Validación</th>
          </tr>
        </thead>
        <tbody>
          ${idea.validationSteps
            .map(
              (step) => `
            <tr>
              <td class="cell-content" style="text-align:center;">
                ${step.completed ? '&#9745; Completado' : '&#9744; Pendiente'}
              </td>
              <td class="cell-content">${escapeHtml(step.text)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `
      : '';

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>Roadmap - ${escapeHtml(idea.title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: 21cm 29.7cm;
      margin: 2.2cm 2cm 2.2cm 2cm;
    }
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      font-size: 11pt;
    }
    .doc-banner {
      border-bottom: 3px solid #0d9488;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .doc-kicker {
      color: #0d9488;
      font-size: 9.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    h1 {
      font-size: 22pt;
      color: #0f172a;
      margin: 6px 0 10px 0;
    }
    h2 {
      font-size: 14pt;
      color: #0f766e;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-top: 22px;
      margin-bottom: 10px;
    }
    .meta-table {
      border: 1px solid #cbd5e1;
      background-color: #f8fafc;
      margin-bottom: 18px;
    }
    .meta-cell {
      font-size: 10pt;
      color: #334155;
      border: 1px solid #e2e8f0;
    }
    .body-text {
      margin: 0 0 10px 0;
      text-align: justify;
    }
    .phase-table {
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      margin-bottom: 14px;
    }
    .phase-header {
      background-color: #0d9488;
      color: #ffffff;
      text-align: left;
      font-size: 12pt;
      padding: 8px 12px;
    }
    .table-subhead {
      background-color: #f1f5f9;
      color: #0f172a;
      text-align: left;
      font-size: 10.5pt;
      border: 1px solid #cbd5e1;
    }
    .phase-duration {
      font-weight: normal;
      font-size: 10pt;
      color: #ccfbf1;
      margin-left: 8px;
    }
    .cell-label {
      background-color: #f0fdfa;
      color: #134e4a;
      border: 1px solid #cbd5e1;
      vertical-align: top;
      font-size: 10.5pt;
    }
    .cell-content {
      background-color: #ffffff;
      color: #1e293b;
      border: 1px solid #cbd5e1;
      vertical-align: top;
      font-size: 10.5pt;
    }
    ul, ol {
      margin: 4px 0 4px 18px;
      padding: 0;
    }
    li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="doc-banner">
    <div class="doc-kicker">ROADMAP ESTRATÉGICO Y PLAN DE EJECUCIÓN — IDEAVAULT IA</div>
    <h1>${escapeHtml(idea.title)}</h1>
  </div>

  <table class="meta-table" width="100%" cellpadding="8" cellspacing="0">
    <tr>
      <td class="meta-cell" width="33%"><strong>Categoría:</strong> ${escapeHtml(categoryLabel)}</td>
      <td class="meta-cell" width="33%"><strong>Estado Actual:</strong> ${escapeHtml(stageLabel)}</td>
      <td class="meta-cell" width="34%"><strong>Fecha de Generación:</strong> ${escapeHtml(formattedDate)}</td>
    </tr>
  </table>

  <h2>1. Desarrollo Profundo de la Idea y Propuesta de Valor</h2>
  ${summaryParagraphs}

  ${
    idea.problem || idea.hypothesis
      ? `
    <h2>2. Definición del Problema e Hipótesis Estratégica</h2>
    <table class="phase-table" width="100%" cellpadding="8" cellspacing="0">
      ${
        idea.problem
          ? `<tr>
              <td width="25%" class="cell-label"><strong>Problema a Resolver</strong></td>
              <td width="75%" class="cell-content">${escapeHtml(idea.problem)}</td>
            </tr>`
          : ''
      }
      ${
        idea.hypothesis
          ? `<tr>
              <td width="25%" class="cell-label"><strong>Hipótesis de Éxito</strong></td>
              <td width="75%" class="cell-content">${escapeHtml(idea.hypothesis)}</td>
            </tr>`
          : ''
      }
    </table>
  `
      : ''
  }

  <h2>3. Hoja de Ruta Completa (Roadmap por Fases)</h2>
  ${phasesHtml}

  ${checklistHtml}
</body>
</html>`;
}

export function downloadIdeaRoadmapAsWord(idea: Idea): void {
  const htmlContent = generateIdeaWordDocumentHtml(idea);
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });

  const safeFileName =
    idea.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50) || 'idea';

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Roadmap-${safeFileName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
