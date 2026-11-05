import { describe, expect, it } from 'vitest';
import { INITIAL_APP_STATE } from '../constants/initialData';
import { appReducer } from '../context/appReducer';
import { sanitizeForFirestore } from '../services/firebase';
import {
  CORRUPT_BACKUP_KEY,
  importStateFromJson,
  loadStateFromStorage,
  loadUserProfileState,
  saveUserProfileState,
  STORAGE_KEY,
} from '../services/storageService';
import {
  isDateOverdue,
  isValidLocalDateString,
  parseLocalDate,
} from '../utils/dateUtils';
import {
  calculateIceScore,
  calculateIdeaMetrics,
  classifyIdeaQuadrant,
  exportIdeaToMarkdown,
} from '../utils/metrics';

describe('Unit Tests — Reducer, Métricas, Fechas, Storage y Perfiles por Usuario', () => {
  it('calcula correctamente el puntaje ICE y clasifica cuadrantes', () => {
    expect(calculateIceScore({ impact: 9, confidence: 8, ease: 7 })).toBe(8.0);
    expect(calculateIceScore({ impact: 15, confidence: -3, ease: 5 })).toBe(
      5.3
    );

    const sample = INITIAL_APP_STATE.ideas[0];
    expect(classifyIdeaQuadrant(sample)).toBe('quick_win');
  });

  it('mantiene inmutabilidad en appReducer al crear, editar y promover ideas', () => {
    const prevState = INITIAL_APP_STATE;
    const nextState = appReducer(prevState, {
      type: 'ADD_IDEA',
      payload: {
        id: 'unit-idea-1',
        title: 'Plataforma de Notas Simples',
        category: 'product',
        stage: 'spark',
      },
    });

    expect(nextState).not.toBe(prevState);
    expect(nextState.ideas.length).toBe(prevState.ideas.length + 1);
    expect(nextState.ideas[0].id).toBe('unit-idea-1');

    const movedState = appReducer(nextState, {
      type: 'MOVE_IDEA_STAGE',
      payload: { id: 'unit-idea-1', stage: 'building' },
    });
    expect(movedState.ideas[0].stage).toBe('building');

    const withStep = appReducer(movedState, {
      type: 'ADD_VALIDATION_STEP',
      payload: {
        ideaId: 'unit-idea-1',
        stepId: 'step-edit-1',
        text: 'Tarea con error de escritura',
      },
    });
    const editedStep = appReducer(withStep, {
      type: 'UPDATE_VALIDATION_STEP',
      payload: {
        ideaId: 'unit-idea-1',
        stepId: 'step-edit-1',
        text: 'Tarea corregida perfectamente',
      },
    });
    const targetStep = editedStep.ideas[0].validationSteps.find(
      (s) => s.id === 'step-edit-1'
    );
    expect(targetStep?.text).toBe('Tarea corregida perfectamente');
  });

  it('guarda y restaura de forma aislada las ideas del perfil de cada usuario por UID', () => {
    const customState = appReducer(INITIAL_APP_STATE, {
      type: 'ADD_IDEA',
      payload: {
        id: 'user-private-idea',
        title: 'Mi Idea Privada en el Perfil',
        category: 'business',
        stage: 'building',
      },
    });

    saveUserProfileState('uid-mateo-123', customState);
    const restored = loadUserProfileState('uid-mateo-123');

    expect(restored).not.toBeNull();
    expect(restored?.ideas[0].title).toBe('Mi Idea Privada en el Perfil');
    expect(loadUserProfileState('otro-uid')).toBeNull();
  });

  it('valida fechas reales incluyendo años bisiestos sin desfase UTC', () => {
    expect(isValidLocalDateString('2028-02-29')).toBe(true);
    expect(isValidLocalDateString('2027-02-29')).toBe(false);
    expect(parseLocalDate('2026-10-31')?.getDate()).toBe(31);
    expect(isDateOverdue('2026-10-15', '2026-10-31')).toBe(true);
    expect(isDateOverdue('2026-11-15', '2026-10-31')).toBe(false);
  });

  it('sanitiza recursivamente valores undefined a null para Firestore', () => {
    const dirty = {
      title: 'Idea Cloud',
      reviewDate: undefined,
      nested: {
        optional: undefined,
        arr: [1, undefined, 'ok'],
      },
    };
    const clean = sanitizeForFirestore(dirty);
    expect(clean.reviewDate).toBeNull();
    expect(clean.nested.optional).toBeNull();
    expect(clean.nested.arr).toEqual([1, null, 'ok']);
  });

  it('auto-recupera datos semilla y guarda backup corrupto cuando localStorage es inválido', () => {
    window.localStorage.setItem(STORAGE_KEY, '{corrupt_json:::');
    const recovered = loadStateFromStorage();
    expect(recovered.ideas.length).toBe(INITIAL_APP_STATE.ideas.length);
    expect(window.localStorage.getItem(CORRUPT_BACKUP_KEY)).toBe(
      '{corrupt_json:::'
    );
  });

  it('bloquea intentos de Prototype Pollution al importar JSON', () => {
    const malicious =
      '{"version": 1, "__proto__": {"polluted": true}, "ideas": []}';
    const res = importStateFromJson(malicious);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/Prototype Pollution/i);
    }
  });

  it('exporta una idea completa a formato Markdown estructurado', () => {
    const md = exportIdeaToMarkdown(INITIAL_APP_STATE.ideas[0]);
    expect(md).toContain('# Ejemplo 1: Cómo capturar y detallar una idea');
    expect(md).toContain('## Experimentos de Validación');
  });

  it('calcula los KPIs globales con precisión', () => {
    const kpis = calculateIdeaMetrics(INITIAL_APP_STATE.ideas, '2026-10-31');
    expect(kpis.totalIdeas).toBe(3);
    expect(kpis.launchedIdeas).toBe(1);
    expect(kpis.byStage.spark).toBe(1);
    expect(kpis.byStage.building).toBe(1);
  });
});
