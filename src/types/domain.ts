export const CURRENT_SCHEMA_VERSION = 1;

export type IdeaStage =
  | 'spark'
  | 'exploring'
  | 'validating'
  | 'building'
  | 'launched'
  | 'archived';

export type IdeaCategory =
  | 'product'
  | 'business'
  | 'content'
  | 'tech'
  | 'personal';

export type IdeaEnergyLevel = 'low' | 'medium' | 'high';

export type IdeaTemplateType = 'blank' | 'lean_canvas' | 'experiment' | 'pitch';

export interface IceScore {
  impact: number;     // 1 - 10
  confidence: number; // 1 - 10
  ease: number;       // 1 - 10
}

export interface ValidationStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface IdeaReference {
  id: string;
  title: string;
  url: string;
}

export interface IdeaBlock {
  id: string;
  label: string;
  content: string;
}

export interface RoadmapPhase {
  id: string;
  phase: string;
  duration: string;
  objective: string;
  deliverables: string[];
  tasks: string[];
}

export interface IdeaPosition {
  x: number;
  y: number;
}

export interface Idea {
  id: string;
  title: string;
  summary: string;
  problem: string;
  hypothesis: string;
  category: IdeaCategory;
  stage: IdeaStage;
  energy: IdeaEnergyLevel;
  ice: IceScore;
  tags: string[];
  validationSteps: ValidationStep[];
  references: IdeaReference[];
  canvasBlocks: IdeaBlock[];
  roadmap?: RoadmapPhase[];
  position?: IdeaPosition;
  templateUsed?: IdeaTemplateType;
  isPinned: boolean;
  reviewDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ActiveView = 'board' | 'matrix' | 'analytics';

export type IdeaSortOption =
  | 'manual'
  | 'ice_desc'
  | 'updated_desc'
  | 'created_desc'
  | 'title_asc';

export interface IdeaFilterState {
  searchQuery: string;
  category: IdeaCategory | 'all';
  stage: IdeaStage | 'all';
  onlyPinned: boolean;
  minIceScore: number;
  tag: string | 'all';
  sortBy: IdeaSortOption;
}

export interface AppState {
  version: number;
  ideas: Idea[];
  activeView: ActiveView;
  selectedIdeaId: string | null;
  filters: IdeaFilterState;
  customTags: string[];
  soundEnabled: boolean;
  lastUpdated: string;
}

export interface IdeaKpiMetrics {
  totalIdeas: number;
  activeIdeas: number;
  launchedIdeas: number;
  archivedIdeas: number;
  pinnedIdeas: number;
  averageIceScore: number;
  highPotentialCount: number; // ICE >= 7.5
  quickWinsCount: number;     // Impact >= 7 && Ease >= 7
  validationCompletionRate: number; // 0 - 100
  conversionRateToLaunch: number;   // 0 - 100
  overdueReviewsCount: number;
  byStage: Record<IdeaStage, number>;
  byCategory: Record<IdeaCategory, number>;
}

export type NewIdeaInput = {
  title: string;
  summary?: string;
  problem?: string;
  hypothesis?: string;
  category?: IdeaCategory;
  stage?: IdeaStage;
  energy?: IdeaEnergyLevel;
  ice?: Partial<IceScore>;
  tags?: string[];
  validationSteps?: ValidationStep[];
  references?: IdeaReference[];
  canvasBlocks?: IdeaBlock[];
  roadmap?: RoadmapPhase[];
  position?: IdeaPosition;
  templateUsed?: IdeaTemplateType;
  isPinned?: boolean;
  reviewDate?: string | null;
  id?: string;
};

export type AppAction =
  | { type: 'ADD_IDEA'; payload: NewIdeaInput }
  | {
      type: 'UPDATE_IDEA';
      payload: { id: string; updates: Partial<Omit<Idea, 'id' | 'createdAt'>> };
    }
  | { type: 'DELETE_IDEA'; payload: { id: string } }
  | { type: 'MOVE_IDEA_STAGE'; payload: { id: string; stage: IdeaStage } }
  | { type: 'TOGGLE_PIN_IDEA'; payload: { id: string } }
  | {
      type: 'UPDATE_ICE_SCORE';
      payload: { id: string; ice: Partial<IceScore> };
    }
  | {
      type: 'ADD_VALIDATION_STEP';
      payload: { ideaId: string; text: string; stepId?: string };
    }
  | {
      type: 'UPDATE_VALIDATION_STEP';
      payload: { ideaId: string; stepId: string; text: string };
    }
  | {
      type: 'TOGGLE_VALIDATION_STEP';
      payload: { ideaId: string; stepId: string };
    }
  | {
      type: 'DELETE_VALIDATION_STEP';
      payload: { ideaId: string; stepId: string };
    }
  | {
      type: 'ADD_REFERENCE';
      payload: { ideaId: string; title: string; url: string; refId?: string };
    }
  | {
      type: 'DELETE_REFERENCE';
      payload: { ideaId: string; refId: string };
    }
  | {
      type: 'ADD_CANVAS_BLOCK';
      payload: { ideaId: string; label: string; content: string; blockId?: string };
    }
  | {
      type: 'UPDATE_CANVAS_BLOCK';
      payload: { ideaId: string; blockId: string; label?: string; content?: string };
    }
  | {
      type: 'DELETE_CANVAS_BLOCK';
      payload: { ideaId: string; blockId: string };
    }
  | {
      type: 'APPLY_TEMPLATE_TO_IDEA';
      payload: { ideaId: string; template: IdeaTemplateType };
    }
  | { type: 'ADD_CUSTOM_TAG'; payload: { tag: string } }
  | { type: 'SET_ACTIVE_VIEW'; payload: { view: ActiveView } }
  | { type: 'SELECT_IDEA'; payload: { id: string | null } }
  | { type: 'SET_FILTERS'; payload: Partial<IdeaFilterState> }
  | { type: 'RESET_FILTERS' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'HYDRATE_STATE'; payload: AppState }
  | { type: 'RESET_TO_SEED' }
  | {
      type: 'REORDER_IDEAS';
      payload: { sourceId: string; targetId: string };
    }
  | {
      type: 'MOVE_IDEA_POSITION';
      payload: { id: string; position: IdeaPosition };
    };
