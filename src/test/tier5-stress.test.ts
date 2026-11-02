import { describe, expect, it } from 'vitest';
import { INITIAL_APP_STATE } from '../constants/initialData';
import { appReducer } from '../context/appReducer';
import { AppState, Idea, IdeaCategory, IdeaStage } from '../types/domain';
import { calculateIdeaMetrics, filterAndSortIdeas } from '../utils/metrics';

function generateBulkIdeas(count: number): Idea[] {
  const stages: IdeaStage[] = [
    'spark',
    'exploring',
    'validating',
    'building',
    'launched',
    'archived',
  ];
  const categories: IdeaCategory[] = [
    'product',
    'business',
    'content',
    'tech',
    'personal',
  ];

  const list: Idea[] = [];
  for (let i = 0; i < count; i++) {
    list.push({
      id: `stress-idea-${i}`,
      title: `Idea de Alto Volumen #${i} — Automatización Inteligente`,
      summary: `Resumen sintético para prueba de estrés número ${i}`,
      problem: `Problema complejo en el sector ${i % 10}`,
      hypothesis: `Hipótesis medible con conversión del ${(i % 50) + 10}%`,
      category: categories[i % categories.length],
      stage: stages[i % stages.length],
      energy: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
      ice: {
        impact: (i % 10) + 1,
        confidence: ((i + 3) % 10) + 1,
        ease: ((i + 6) % 10) + 1,
      },
      tags: i % 2 === 0 ? ['IA', 'B2B'] : ['QuickWin', 'Mobile'],
      validationSteps: [
        {
          id: `st-${i}-1`,
          text: 'Experimento 1',
          completed: i % 2 === 0,
        },
        {
          id: `st-${i}-2`,
          text: 'Experimento 2',
          completed: i % 3 === 0,
        },
      ],
      references: [],
      canvasBlocks: [
        {
          id: `blk-${i}`,
          label: 'Propuesta',
          content: 'Valor diferencial escalable',
        },
      ],
      templateUsed: 'lean_canvas',
      isPinned: i % 5 === 0,
      reviewDate: i % 4 === 0 ? '2026-10-15' : '2026-12-01',
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-30T10:00:00.000Z',
    });
  }
  return list;
}

describe('Tier 5 — Adversarial Hardening & High-Volume Stress Suite (1,000 Ideas)', () => {
  it('procesa cálculo de KPIs sobre 1,000 ideas en menos de 10ms promedio sin pérdida de datos', () => {
    const bulkIdeas = generateBulkIdeas(1000);

    // Warmup
    calculateIdeaMetrics(bulkIdeas, '2026-10-31');

    const iterations = 10;
    const start = performance.now();
    let lastMetrics = calculateIdeaMetrics(bulkIdeas, '2026-10-31');
    for (let i = 0; i < iterations; i++) {
      lastMetrics = calculateIdeaMetrics(bulkIdeas, '2026-10-31');
    }
    const elapsedPerRun = (performance.now() - start) / iterations;

    expect(lastMetrics.totalIdeas).toBe(1000);
    expect(elapsedPerRun).toBeLessThan(10);
  });

  it('filtra y ordena 1,000 ideas combinando criterios en menos de 10ms promedio', () => {
    const bulkIdeas = generateBulkIdeas(1000);
    const filters = {
      ...INITIAL_APP_STATE.filters,
      category: 'product' as const,
      onlyPinned: true,
      minIceScore: 5,
      searchQuery: 'Automatización',
      sortBy: 'ice_desc' as const,
    };

    // Warmup
    filterAndSortIdeas(bulkIdeas, filters);

    const iterations = 10;
    const start = performance.now();
    let result: Idea[] = [];
    for (let i = 0; i < iterations; i++) {
      result = filterAndSortIdeas(bulkIdeas, filters);
    }
    const elapsedPerRun = (performance.now() - start) / iterations;

    expect(result.length).toBeGreaterThan(0);
    expect(elapsedPerRun).toBeLessThan(10);
  });

  it('ejecuta actualizaciones inmutables en appReducer con 750 registros en < 10ms', () => {
    const state: AppState = {
      ...INITIAL_APP_STATE,
      ideas: generateBulkIdeas(750),
    };

    // Warmup JIT
    appReducer(state, {
      type: 'MOVE_IDEA_STAGE',
      payload: { id: 'stress-idea-1', stage: 'exploring' },
    });

    const start = performance.now();
    const updated = appReducer(state, {
      type: 'MOVE_IDEA_STAGE',
      payload: { id: 'stress-idea-350', stage: 'launched' },
    });
    const elapsed = performance.now() - start;

    expect(
      updated.ideas.find((i) => i.id === 'stress-idea-350')?.stage
    ).toBe('launched');
    expect(updated.ideas.length).toBe(750);
    expect(elapsed).toBeLessThan(10);
  });
});
