import {
  DEFAULT_FILTERS,
  INITIAL_APP_STATE,
  INITIAL_CUSTOM_TAGS,
} from '../constants/initialData';
import {
  ActiveView,
  AppState,
  CURRENT_SCHEMA_VERSION,
  Idea,
  IdeaCategory,
  IdeaEnergyLevel,
  IdeaStage,
  IdeaTemplateType,
} from '../types/domain';
import { normalizeIceScore } from '../utils/metrics';

const VALID_STAGES = new Set<IdeaStage>([
  'spark',
  'exploring',
  'validating',
  'building',
  'launched',
  'archived',
]);

const VALID_CATEGORIES = new Set<IdeaCategory>([
  'product',
  'business',
  'content',
  'tech',
  'personal',
]);

const VALID_ENERGIES = new Set<IdeaEnergyLevel>(['low', 'medium', 'high']);

const VALID_VIEWS = new Set<ActiveView>(['board', 'matrix', 'analytics']);

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Detecta claves de Prototype Pollution en un texto JSON crudo o en un árbol de objetos.
 */
export function hasPrototypePollutionJson(rawJson: string): boolean {
  const regex = /"(?:__proto__|constructor|prototype)"\s*:/;
  return regex.test(rawJson);
}

export function hasDangerousKeys(obj: unknown, visited = new WeakSet<object>()): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (visited.has(obj as object)) return true; // Referencia circular también es peligrosa
  visited.add(obj as object);

  const ownKeys = Object.getOwnPropertyNames(obj);
  for (const key of ownKeys) {
    if (DANGEROUS_KEYS.has(key)) return true;
    const val = (obj as Record<string, unknown>)[key];
    if (val && typeof val === 'object' && hasDangerousKeys(val, visited)) {
      return true;
    }
  }
  return false;
}

function normalizeIdea(raw: unknown, index: number): Idea | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  if (typeof record.title !== 'string' || !record.title.trim()) {
    return null;
  }

  const now = new Date().toISOString();
  const stage: IdeaStage = VALID_STAGES.has(record.stage as IdeaStage)
    ? (record.stage as IdeaStage)
    : 'spark';

  const category: IdeaCategory = VALID_CATEGORIES.has(
    record.category as IdeaCategory
  )
    ? (record.category as IdeaCategory)
    : 'product';

  const energy: IdeaEnergyLevel = VALID_ENERGIES.has(
    record.energy as IdeaEnergyLevel
  )
    ? (record.energy as IdeaEnergyLevel)
    : 'medium';

  const rawSteps = Array.isArray(record.validationSteps)
    ? record.validationSteps
    : [];
  const validationSteps = rawSteps
    .filter((s) => s && typeof s === 'object' && typeof (s as Record<string, unknown>).text === 'string')
    .map((s, idx) => {
      const stepObj = s as Record<string, unknown>;
      return {
        id:
          typeof stepObj.id === 'string' && stepObj.id.trim()
            ? stepObj.id
            : `step-mig-${index}-${idx}`,
        text: String(stepObj.text).trim(),
        completed: Boolean(stepObj.completed),
      };
    })
    .filter((s) => s.text.length > 0);

  const rawRefs = Array.isArray(record.references) ? record.references : [];
  const references = rawRefs
    .filter(
      (r) =>
        r &&
        typeof r === 'object' &&
        typeof (r as Record<string, unknown>).title === 'string' &&
        typeof (r as Record<string, unknown>).url === 'string'
    )
    .map((r, idx) => {
      const refObj = r as Record<string, unknown>;
      return {
        id:
          typeof refObj.id === 'string' && refObj.id.trim()
            ? refObj.id
            : `ref-mig-${index}-${idx}`,
        title: String(refObj.title).trim(),
        url: String(refObj.url).trim(),
      };
    });

  const rawBlocks = Array.isArray(record.canvasBlocks)
    ? record.canvasBlocks
    : [];
  const canvasBlocks = rawBlocks
    .filter(
      (b) =>
        b &&
        typeof b === 'object' &&
        typeof (b as Record<string, unknown>).label === 'string'
    )
    .map((b, idx) => {
      const blkObj = b as Record<string, unknown>;
      return {
        id:
          typeof blkObj.id === 'string' && blkObj.id.trim()
            ? blkObj.id
            : `blk-mig-${index}-${idx}`,
        label: String(blkObj.label).trim(),
        content: typeof blkObj.content === 'string' ? blkObj.content : '',
      };
    });

  const rawTags = Array.isArray(record.tags) ? record.tags : [];
  const tags = Array.from(
    new Set(
      rawTags
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );

  const rawRoadmap = Array.isArray(record.roadmap) ? record.roadmap : [];
  const roadmap = rawRoadmap
    .filter((r) => r && typeof r === 'object')
    .map((r, idx) => {
      const rObj = r as Record<string, unknown>;
      return {
        id:
          typeof rObj.id === 'string' && rObj.id.trim()
            ? rObj.id
            : `phase-mig-${index}-${idx}`,
        phase:
          typeof rObj.phase === 'string' && rObj.phase.trim()
            ? rObj.phase.trim()
            : `Fase ${idx + 1}`,
        duration:
          typeof rObj.duration === 'string' ? rObj.duration.trim() : '',
        objective:
          typeof rObj.objective === 'string' ? rObj.objective.trim() : '',
        deliverables: Array.isArray(rObj.deliverables)
          ? rObj.deliverables.map((d) => String(d).trim()).filter(Boolean)
          : [],
        tasks: Array.isArray(rObj.tasks)
          ? rObj.tasks.map((t) => String(t).trim()).filter(Boolean)
          : [],
      };
    });

  let position: { x: number; y: number } | undefined;
  if (record.position && typeof record.position === 'object') {
    const posObj = record.position as Record<string, unknown>;
    if (
      typeof posObj.x === 'number' &&
      Number.isFinite(posObj.x) &&
      typeof posObj.y === 'number' &&
      Number.isFinite(posObj.y)
    ) {
      position = { x: posObj.x, y: posObj.y };
    }
  }

  return {
    id:
      typeof record.id === 'string' && record.id.trim()
        ? record.id
        : `idea-mig-${index}-${Date.now()}`,
    title: record.title.trim(),
    summary: typeof record.summary === 'string' ? record.summary.trim() : '',
    problem: typeof record.problem === 'string' ? record.problem.trim() : '',
    hypothesis:
      typeof record.hypothesis === 'string' ? record.hypothesis.trim() : '',
    category,
    stage,
    energy,
    ice: normalizeIceScore(record.ice as Record<string, number> | undefined),
    tags,
    validationSteps,
    references,
    canvasBlocks,
    roadmap,
    ...(position ? { position } : {}),
    templateUsed: (record.templateUsed as IdeaTemplateType) || 'blank',
    isPinned: Boolean(record.isPinned),
    reviewDate:
      typeof record.reviewDate === 'string' ? record.reviewDate : null,
    createdAt:
      typeof record.createdAt === 'string' && record.createdAt
        ? record.createdAt
        : now,
    updatedAt:
      typeof record.updatedAt === 'string' && record.updatedAt
        ? record.updatedAt
        : now,
  };
}

/**
 * Valida y migra un objeto de estado crudo hacia CURRENT_SCHEMA_VERSION.
 * Retorna null si la estructura no corresponde a un estado válido o seguro.
 */
export function validateAndMigrateState(raw: unknown): AppState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  if (hasDangerousKeys(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;

  if (!Array.isArray(record.ideas)) {
    return null;
  }

  const migratedIdeas: Idea[] = [];
  for (let i = 0; i < record.ideas.length; i++) {
    const normalized = normalizeIdea(record.ideas[i], i);
    if (!normalized) {
      return null; // Si un elemento del array de ideas es inválido/corrupto, rechazar importación/estado
    }
    migratedIdeas.push(normalized);
  }

  const activeView: ActiveView = VALID_VIEWS.has(record.activeView as ActiveView)
    ? (record.activeView as ActiveView)
    : 'board';

  const rawCustomTags = Array.isArray(record.customTags)
    ? record.customTags.filter((t): t is string => typeof t === 'string')
    : INITIAL_CUSTOM_TAGS;

  return {
    version: CURRENT_SCHEMA_VERSION,
    ideas: migratedIdeas,
    activeView,
    selectedIdeaId:
      typeof record.selectedIdeaId === 'string' ? record.selectedIdeaId : null,
    filters: {
      ...DEFAULT_FILTERS,
      ...(record.filters && typeof record.filters === 'object'
        ? (record.filters as Partial<typeof DEFAULT_FILTERS>)
        : {}),
    },
    customTags: Array.from(new Set([...INITIAL_CUSTOM_TAGS, ...rawCustomTags])),
    soundEnabled:
      typeof record.soundEnabled === 'boolean'
        ? record.soundEnabled
        : INITIAL_APP_STATE.soundEnabled,
    lastUpdated:
      typeof record.lastUpdated === 'string'
        ? record.lastUpdated
        : new Date().toISOString(),
  };
}
