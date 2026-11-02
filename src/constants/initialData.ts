import {
  AppState,
  CURRENT_SCHEMA_VERSION,
  Idea,
  IdeaFilterState,
} from '../types/domain';

export const DEFAULT_FILTERS: IdeaFilterState = {
  searchQuery: '',
  category: 'all',
  stage: 'all',
  onlyPinned: false,
  minIceScore: 0,
  tag: 'all',
  sortBy: 'manual',
};

export const INITIAL_CUSTOM_TAGS: string[] = [
  'Ejemplo',
  'Guía',
  'Rápida',
  'Proyecto',
];

export const SEED_IDEAS: Idea[] = [
  {
    id: 'idea-seed-1',
    title: 'Ejemplo 1: Cómo capturar y detallar una idea',
    summary:
      'Haz clic sobre esta tarjeta para abrir el panel lateral. Allí podrás escribir notas libres, cambiar la categoría o añadir una lista de pasos.',
    problem: '',
    hypothesis: '',
    category: 'product',
    stage: 'spark',
    energy: 'low',
    ice: { impact: 8, confidence: 8, ease: 8 },
    tags: ['Ejemplo', 'Guía'],
    validationSteps: [
      {
        id: 'step-101',
        text: 'Haz clic en esta tarjeta para ver sus detalles',
        completed: true,
      },
      {
        id: 'step-102',
        text: 'Escribe una nota o agrega un paso nuevo en el panel derecho',
        completed: false,
      },
      {
        id: 'step-103',
        text: 'Marca este paso como completado cuando termines',
        completed: false,
      },
    ],
    references: [],
    canvasBlocks: [],
    templateUsed: 'blank',
    isPinned: true,
    reviewDate: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'idea-seed-2',
    title: 'Ejemplo 2: Avanza el estado de tus ideas en 1 clic',
    summary:
      'Usa el selector inferior de cada tarjeta para mover tus ideas desde "Por Explorar" hacia "En Desarrollo" y finalmente a "Completada".',
    problem: '',
    hypothesis: '',
    category: 'tech',
    stage: 'building',
    energy: 'medium',
    ice: { impact: 7, confidence: 8, ease: 9 },
    tags: ['Ejemplo'],
    validationSteps: [
      {
        id: 'step-201',
        text: 'Definir el objetivo principal de la idea',
        completed: true,
      },
      {
        id: 'step-202',
        text: 'Cambiar el estado a "Completada" cuando esté lista',
        completed: false,
      },
    ],
    references: [],
    canvasBlocks: [],
    templateUsed: 'blank',
    isPinned: true,
    reviewDate: null,
    createdAt: '2026-10-01T09:15:00.000Z',
    updatedAt: '2026-10-01T09:15:00.000Z',
  },
  {
    id: 'idea-seed-3',
    title: 'Ejemplo 3: Inicia sesión con Google para guardar tu perfil',
    summary:
      'Al iniciar sesión con Google arriba a la derecha, tus ideas se guardan en tu perfil personal. Al cerrar sesión, tus datos privados se ocultan y vuelve este ejemplo.',
    problem: '',
    hypothesis: '',
    category: 'personal',
    stage: 'launched',
    energy: 'low',
    ice: { impact: 8, confidence: 9, ease: 9 },
    tags: ['Guía'],
    validationSteps: [
      {
        id: 'step-301',
        text: 'Conectar cuenta con el botón "Iniciar con Google"',
        completed: true,
      },
      {
        id: 'step-302',
        text: 'Crear tus propias ideas dentro de tu perfil',
        completed: true,
      },
    ],
    references: [],
    canvasBlocks: [],
    templateUsed: 'blank',
    isPinned: false,
    reviewDate: null,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  },
];

export const INITIAL_APP_STATE: AppState = {
  version: CURRENT_SCHEMA_VERSION,
  ideas: SEED_IDEAS,
  activeView: 'board',
  selectedIdeaId: null,
  filters: DEFAULT_FILTERS,
  customTags: INITIAL_CUSTOM_TAGS,
  soundEnabled: true,
  lastUpdated: '2026-10-01T10:00:00.000Z',
};
