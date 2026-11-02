import {
  IceScore,
  Idea,
  IdeaCategory,
  IdeaFilterState,
  IdeaKpiMetrics,
  IdeaStage,
} from '../types/domain';
import { getTodayIsoDate, isDateOverdue } from './dateUtils';

export function clampIceComponent(value: unknown, fallback = 5): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(10, Math.max(1, Math.round(num)));
}

export function normalizeIceScore(partial?: Partial<IceScore>): IceScore {
  return {
    impact: clampIceComponent(partial?.impact, 5),
    confidence: clampIceComponent(partial?.confidence, 5),
    ease: clampIceComponent(partial?.ease, 5),
  };
}

/**
 * Calcula el puntaje ICE compuesto en escala 1.0 a 10.0 con 1 decimal.
 */
export function calculateIceScore(ice: IceScore): number {
  const normalized = normalizeIceScore(ice);
  const raw = (normalized.impact + normalized.confidence + normalized.ease) / 3;
  return Math.round(raw * 10) / 10;
}

export function isQuickWin(idea: Idea): boolean {
  if (idea.stage === 'archived') return false;
  return idea.ice.impact >= 7 && idea.ice.ease >= 7;
}

export type IceQuadrant =
  | 'quick_win'
  | 'strategic_bet'
  | 'fill_in'
  | 'reconsider';

export function classifyIdeaQuadrant(idea: Idea): IceQuadrant {
  const highImpact = idea.ice.impact >= 6;
  const highEase = idea.ice.ease >= 6;
  if (highImpact && highEase) return 'quick_win';
  if (highImpact && !highEase) return 'strategic_bet';
  if (!highImpact && highEase) return 'fill_in';
  return 'reconsider';
}

export function getIdeaValidationProgress(idea: Idea): {
  completed: number;
  total: number;
  percentage: number;
} {
  const steps = Array.isArray(idea.validationSteps) ? idea.validationSteps : [];
  const total = steps.length;
  if (total === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  const completed = steps.filter((s) => s.completed).length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

export function filterAndSortIdeas(
  ideas: Idea[],
  filters: IdeaFilterState
): Idea[] {
  const query = (filters.searchQuery || '').trim().toLowerCase();

  const filtered = ideas.filter((idea) => {
    if (filters.category !== 'all' && idea.category !== filters.category) {
      return false;
    }
    if (filters.stage !== 'all' && idea.stage !== filters.stage) {
      return false;
    }
    if (filters.onlyPinned && !idea.isPinned) {
      return false;
    }
    if (filters.tag !== 'all' && !idea.tags.includes(filters.tag)) {
      return false;
    }
    const score = calculateIceScore(idea.ice);
    if (filters.minIceScore > 0 && score < filters.minIceScore) {
      return false;
    }
    if (query.length > 0) {
      const inTitle = idea.title.toLowerCase().includes(query);
      const inSummary = idea.summary.toLowerCase().includes(query);
      const inProblem = idea.problem.toLowerCase().includes(query);
      const inHypothesis = idea.hypothesis.toLowerCase().includes(query);
      const inTags = idea.tags.some((t) => t.toLowerCase().includes(query));
      if (!inTitle && !inSummary && !inProblem && !inHypothesis && !inTags) {
        return false;
      }
    }
    return true;
  });

  if (filters.sortBy === 'manual') {
    return filtered;
  }

  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'ice_desc': {
        const diff = calculateIceScore(b.ice) - calculateIceScore(a.ice);
        if (diff !== 0) return diff;
        return b.updatedAt.localeCompare(a.updatedAt);
      }
      case 'updated_desc':
        return b.updatedAt.localeCompare(a.updatedAt);
      case 'created_desc':
        return b.createdAt.localeCompare(a.createdAt);
      case 'title_asc':
        return a.title.localeCompare(b.title, 'es');
      default:
        return 0;
    }
  });
}

export function calculateIdeaMetrics(
  ideas: Idea[],
  referenceDateStr: string = getTodayIsoDate()
): IdeaKpiMetrics {
  const byStage: Record<IdeaStage, number> = {
    spark: 0,
    exploring: 0,
    validating: 0,
    building: 0,
    launched: 0,
    archived: 0,
  };

  const byCategory: Record<IdeaCategory, number> = {
    product: 0,
    business: 0,
    content: 0,
    tech: 0,
    personal: 0,
  };

  let totalIceSum = 0;
  let nonArchivedCount = 0;
  let highPotentialCount = 0;
  let quickWinsCount = 0;
  let pinnedIdeas = 0;
  let totalValidationSteps = 0;
  let completedValidationSteps = 0;
  let overdueReviewsCount = 0;

  const trimmedRefDate = referenceDateStr.trim();

  for (const idea of ideas) {
    if (byStage[idea.stage] !== undefined) {
      byStage[idea.stage] += 1;
    }
    if (byCategory[idea.category] !== undefined) {
      byCategory[idea.category] += 1;
    }
    if (idea.isPinned) {
      pinnedIdeas += 1;
    }

    const score =
      Math.round(
        ((idea.ice.impact + idea.ice.confidence + idea.ice.ease) / 3) * 10
      ) / 10;

    if (idea.stage !== 'archived') {
      totalIceSum += score;
      nonArchivedCount += 1;

      if (score >= 7.5) {
        highPotentialCount += 1;
      }
      if (idea.ice.impact >= 7 && idea.ice.ease >= 7) {
        quickWinsCount += 1;
      }
      if (
        idea.stage !== 'launched' &&
        idea.reviewDate &&
        idea.reviewDate < trimmedRefDate &&
        isDateOverdue(idea.reviewDate, trimmedRefDate)
      ) {
        overdueReviewsCount += 1;
      }
    }

    for (const step of idea.validationSteps) {
      totalValidationSteps += 1;
      if (step.completed) {
        completedValidationSteps += 1;
      }
    }
  }

  const totalIdeas = ideas.length;
  const launchedIdeas = byStage.launched;
  const archivedIdeas = byStage.archived;
  const activeIdeas =
    byStage.spark + byStage.exploring + byStage.validating + byStage.building;

  const averageIceScore =
    nonArchivedCount > 0
      ? Math.round((totalIceSum / nonArchivedCount) * 10) / 10
      : 0;

  const validationCompletionRate =
    totalValidationSteps > 0
      ? Math.round((completedValidationSteps / totalValidationSteps) * 100)
      : 0;

  const conversionRateToLaunch =
    totalIdeas > 0 ? Math.round((launchedIdeas / totalIdeas) * 100) : 0;

  return {
    totalIdeas,
    activeIdeas,
    launchedIdeas,
    archivedIdeas,
    pinnedIdeas,
    averageIceScore,
    highPotentialCount,
    quickWinsCount,
    validationCompletionRate,
    conversionRateToLaunch,
    overdueReviewsCount,
    byStage,
    byCategory,
  };
}

export function exportIdeaToMarkdown(idea: Idea): string {
  const score = calculateIceScore(idea.ice);
  const progress = getIdeaValidationProgress(idea);

  const lines: string[] = [
    `# ${idea.title}`,
    '',
    `> **Etapa:** ${idea.stage.toUpperCase()} | **Categoría:** ${idea.category.toUpperCase()} | **Puntaje ICE:** ${score}/10 (Impacto: ${idea.ice.impact}, Confianza: ${idea.ice.confidence}, Facilidad: ${idea.ice.ease})`,
    '',
    '## Resumen Ejecutivo',
    idea.summary || '_Sin resumen definido._',
    '',
    '## Problema a Resolver',
    idea.problem || '_Sin problema documentado._',
    '',
    '## Hipótesis de Validación',
    idea.hypothesis || '_Sin hipótesis documentada._',
    '',
  ];

  if (idea.canvasBlocks.length > 0) {
    lines.push('## Bloques Estratégicos (Canvas)');
    for (const block of idea.canvasBlocks) {
      lines.push(`### ${block.label}`);
      lines.push(block.content || '_Vacío_');
      lines.push('');
    }
  }

  lines.push(
    `## Experimentos de Validación (${progress.completed}/${progress.total} - ${progress.percentage}%)`
  );
  if (idea.validationSteps.length === 0) {
    lines.push('- _No hay experimentos registrados._');
  } else {
    for (const step of idea.validationSteps) {
      lines.push(`- [${step.completed ? 'x' : ' '}] ${step.text}`);
    }
  }
  lines.push('');

  if (idea.references.length > 0) {
    lines.push('## Enlaces y Referencias');
    for (const ref of idea.references) {
      lines.push(`- [${ref.title}](${ref.url})`);
    }
    lines.push('');
  }

  if (idea.tags.length > 0) {
    lines.push(`**Etiquetas:** ${idea.tags.map((t) => `#${t}`).join(' ')}`);
  }

  return lines.join('\n');
}
