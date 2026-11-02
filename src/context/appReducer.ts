import {
  DEFAULT_FILTERS,
  INITIAL_APP_STATE,
} from '../constants/initialData';
import { IDEA_TEMPLATES } from '../constants/theme';
import {
  AppAction,
  AppState,
  Idea,
  IdeaBlock,
  ValidationStep,
} from '../types/domain';
import { normalizeIceScore } from '../utils/metrics';

function createUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeText(text: string | undefined, maxLength = 2000): string {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
}

/**
 * Preserva espacios y saltos de línea mientras el usuario escribe en vivo en inputs/textareas.
 */
function sanitizeLiveText(text: string | undefined, maxLength = 2000): string {
  if (typeof text !== 'string') return '';
  return text.slice(0, maxLength);
}

export function appReducer(state: AppState, action: AppAction): AppState {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'ADD_IDEA': {
      const rawTitle = sanitizeText(action.payload.title, 200);
      if (!rawTitle) {
        return state;
      }

      const templateKey = action.payload.templateUsed ?? 'blank';
      const template = IDEA_TEMPLATES[templateKey] ?? IDEA_TEMPLATES.blank;

      const defaultBlocks: IdeaBlock[] =
        action.payload.canvasBlocks ??
        template.defaultBlocks.map((b, idx) => ({
          id: createUniqueId(`blk-${idx}`),
          label: b.label,
          content: b.content,
        }));

      const defaultSteps: ValidationStep[] =
        action.payload.validationSteps ??
        template.defaultSteps.map((text, idx) => ({
          id: createUniqueId(`step-${idx}`),
          text,
          completed: false,
        }));

      const cleanTags = Array.from(
        new Set(
          (action.payload.tags ?? [])
            .map((t) => sanitizeText(t, 40))
            .filter(Boolean)
        )
      );

      const newIdea: Idea = {
        id: action.payload.id || createUniqueId('idea'),
        title: rawTitle,
        summary: sanitizeText(action.payload.summary, 4000),
        problem: sanitizeText(action.payload.problem, 2000),
        hypothesis: sanitizeText(action.payload.hypothesis, 2000),
        category: action.payload.category ?? 'product',
        stage: action.payload.stage ?? 'spark',
        energy: action.payload.energy ?? 'medium',
        ice: normalizeIceScore(action.payload.ice),
        tags: cleanTags,
        validationSteps: defaultSteps,
        references: action.payload.references ?? [],
        canvasBlocks: defaultBlocks,
        roadmap: action.payload.roadmap ?? [],
        position: action.payload.position,
        templateUsed: templateKey,
        isPinned: Boolean(action.payload.isPinned),
        reviewDate: action.payload.reviewDate ?? null,
        createdAt: now,
        updatedAt: now,
      };

      const updatedCustomTags = Array.from(
        new Set([...state.customTags, ...cleanTags])
      );

      return {
        ...state,
        ideas: [newIdea, ...state.ideas],
        customTags: updatedCustomTags,
        lastUpdated: now,
      };
    }

    case 'UPDATE_IDEA': {
      const { id, updates } = action.payload;
      let changed = false;

      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== id) return idea;

        const nextTitle =
          updates.title !== undefined
            ? sanitizeLiveText(updates.title, 200)
            : idea.title;
        if (updates.title !== undefined && nextTitle.length === 0) {
          // Permitir borrar o editar sin comer espacios; solo ignorar si no es string
        }

        changed = true;
        return {
          ...idea,
          ...updates,
          title: nextTitle,
          summary:
            updates.summary !== undefined
              ? sanitizeLiveText(updates.summary, 4000)
              : idea.summary,
          problem:
            updates.problem !== undefined
              ? sanitizeLiveText(updates.problem, 2000)
              : idea.problem,
          hypothesis:
            updates.hypothesis !== undefined
              ? sanitizeLiveText(updates.hypothesis, 2000)
              : idea.hypothesis,
          ice:
            updates.ice !== undefined
              ? normalizeIceScore({ ...idea.ice, ...updates.ice })
              : idea.ice,
          tags:
            updates.tags !== undefined
              ? Array.from(
                  new Set(
                    updates.tags
                      .map((t) => sanitizeText(t, 40))
                      .filter(Boolean)
                  )
                )
              : idea.tags,
          updatedAt: now,
        };
      });

      if (!changed) return state;

      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'DELETE_IDEA': {
      const { id } = action.payload;
      const filtered = state.ideas.filter((idea) => idea.id !== id);
      if (filtered.length === state.ideas.length) return state;

      return {
        ...state,
        ideas: filtered,
        selectedIdeaId:
          state.selectedIdeaId === id ? null : state.selectedIdeaId,
        lastUpdated: now,
      };
    }

    case 'MOVE_IDEA_STAGE': {
      const { id, stage } = action.payload;
      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== id || idea.stage === stage) return idea;
        changed = true;
        return {
          ...idea,
          stage,
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'TOGGLE_PIN_IDEA': {
      const { id } = action.payload;
      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== id) return idea;
        changed = true;
        return {
          ...idea,
          isPinned: !idea.isPinned,
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'UPDATE_ICE_SCORE': {
      const { id, ice } = action.payload;
      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== id) return idea;
        changed = true;
        return {
          ...idea,
          ice: normalizeIceScore({ ...idea.ice, ...ice }),
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'ADD_VALIDATION_STEP': {
      const { ideaId, text, stepId } = action.payload;
      const cleanText = sanitizeText(text, 300);
      if (!cleanText) return state;

      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea;
        changed = true;
        const newStep: ValidationStep = {
          id: stepId || createUniqueId('step'),
          text: cleanText,
          completed: false,
        };
        return {
          ...idea,
          validationSteps: [...idea.validationSteps, newStep],
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'TOGGLE_VALIDATION_STEP': {
      const { ideaId, stepId } = action.payload;
      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea;
        const nextSteps = idea.validationSteps.map((step) => {
          if (step.id !== stepId) return step;
          changed = true;
          return { ...step, completed: !step.completed };
        });
        if (!changed) return idea;
        return {
          ...idea,
          validationSteps: nextSteps,
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'DELETE_VALIDATION_STEP': {
      const { ideaId, stepId } = action.payload;
      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea;
        const nextSteps = idea.validationSteps.filter((s) => s.id !== stepId);
        if (nextSteps.length === idea.validationSteps.length) return idea;
        changed = true;
        return {
          ...idea,
          validationSteps: nextSteps,
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'ADD_REFERENCE': {
      const { ideaId, title, url, refId } = action.payload;
      const cleanTitle = sanitizeText(title, 140);
      const cleanUrl = sanitizeText(url, 500);
      if (!cleanTitle || !cleanUrl) return state;

      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea;
        changed = true;
        return {
          ...idea,
          references: [
            ...idea.references,
            {
              id: refId || createUniqueId('ref'),
              title: cleanTitle,
              url: cleanUrl,
            },
          ],
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'DELETE_REFERENCE': {
      const { ideaId, refId } = action.payload;
      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea;
        const nextRefs = idea.references.filter((r) => r.id !== refId);
        if (nextRefs.length === idea.references.length) return idea;
        changed = true;
        return {
          ...idea,
          references: nextRefs,
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'ADD_CANVAS_BLOCK': {
      const { ideaId, label, content, blockId } = action.payload;
      const cleanLabel = sanitizeText(label, 100);
      if (!cleanLabel) return state;

      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea;
        changed = true;
        return {
          ...idea,
          canvasBlocks: [
            ...idea.canvasBlocks,
            {
              id: blockId || createUniqueId('blk'),
              label: cleanLabel,
              content: sanitizeText(content, 2000),
            },
          ],
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'UPDATE_CANVAS_BLOCK': {
      const { ideaId, blockId, label, content } = action.payload;
      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea;
        const nextBlocks = idea.canvasBlocks.map((b) => {
          if (b.id !== blockId) return b;
          const nextLabel =
            label !== undefined ? sanitizeText(label, 100) : b.label;
          if (!nextLabel) return b;
          changed = true;
          return {
            ...b,
            label: nextLabel,
            content:
              content !== undefined ? sanitizeText(content, 2000) : b.content,
          };
        });
        if (!changed) return idea;
        return {
          ...idea,
          canvasBlocks: nextBlocks,
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'DELETE_CANVAS_BLOCK': {
      const { ideaId, blockId } = action.payload;
      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea;
        const nextBlocks = idea.canvasBlocks.filter((b) => b.id !== blockId);
        if (nextBlocks.length === idea.canvasBlocks.length) return idea;
        changed = true;
        return {
          ...idea,
          canvasBlocks: nextBlocks,
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'APPLY_TEMPLATE_TO_IDEA': {
      const { ideaId, template } = action.payload;
      const blueprint = IDEA_TEMPLATES[template];
      if (!blueprint) return state;

      let changed = false;
      const nextIdeas = state.ideas.map((idea) => {
        if (idea.id !== ideaId) return idea;
        changed = true;
        const templatedBlocks: IdeaBlock[] = blueprint.defaultBlocks.map(
          (b, idx) => ({
            id: createUniqueId(`blk-tpl-${idx}`),
            label: b.label,
            content: b.content,
          })
        );
        const existingStepTexts = new Set(
          idea.validationSteps.map((s) => s.text.toLowerCase())
        );
        const additionalSteps: ValidationStep[] = blueprint.defaultSteps
          .filter((t) => !existingStepTexts.has(t.toLowerCase()))
          .map((t, idx) => ({
            id: createUniqueId(`step-tpl-${idx}`),
            text: t,
            completed: false,
          }));

        return {
          ...idea,
          templateUsed: template,
          canvasBlocks: templatedBlocks,
          validationSteps: [...idea.validationSteps, ...additionalSteps],
          updatedAt: now,
        };
      });

      if (!changed) return state;
      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    case 'ADD_CUSTOM_TAG': {
      const cleanTag = sanitizeText(action.payload.tag, 40);
      if (!cleanTag || state.customTags.includes(cleanTag)) {
        return state;
      }
      return {
        ...state,
        customTags: [...state.customTags, cleanTag],
        lastUpdated: now,
      };
    }

    case 'SET_ACTIVE_VIEW': {
      if (state.activeView === action.payload.view) return state;
      return {
        ...state,
        activeView: action.payload.view,
      };
    }

    case 'SELECT_IDEA': {
      if (state.selectedIdeaId === action.payload.id) return state;
      return {
        ...state,
        selectedIdeaId: action.payload.id,
      };
    }

    case 'SET_FILTERS': {
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
    }

    case 'RESET_FILTERS': {
      return {
        ...state,
        filters: { ...DEFAULT_FILTERS },
      };
    }

    case 'TOGGLE_SOUND': {
      return {
        ...state,
        soundEnabled: !state.soundEnabled,
        lastUpdated: now,
      };
    }

    case 'HYDRATE_STATE': {
      return {
        ...action.payload,
      };
    }

    case 'RESET_TO_SEED': {
      return {
        ...INITIAL_APP_STATE,
        lastUpdated: now,
      };
    }

    case 'REORDER_IDEAS': {
      const { sourceId, targetId } = action.payload;
      if (sourceId === targetId) return state;

      const sourceIndex = state.ideas.findIndex((i) => i.id === sourceId);
      const targetIndex = state.ideas.findIndex((i) => i.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return state;

      const nextIdeas = [...state.ideas];
      const [movedIdea] = nextIdeas.splice(sourceIndex, 1);
      nextIdeas.splice(targetIndex, 0, movedIdea);

      return {
        ...state,
        ideas: nextIdeas,
        filters: {
          ...state.filters,
          sortBy: 'manual',
        },
        lastUpdated: now,
      };
    }

    case 'MOVE_IDEA_POSITION': {
      const { id, position } = action.payload;
      const x = Math.max(0, Math.round(position.x));
      const y = Math.max(0, Math.round(position.y));

      const nextIdeas = state.ideas.map((idea) =>
        idea.id === id
          ? { ...idea, position: { x, y }, updatedAt: now }
          : idea
      );

      return {
        ...state,
        ideas: nextIdeas,
        lastUpdated: now,
      };
    }

    default:
      return state;
  }
}
