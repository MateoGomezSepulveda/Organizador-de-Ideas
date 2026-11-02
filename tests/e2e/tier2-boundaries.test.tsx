import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { INITIAL_APP_STATE } from '../../src/constants/initialData';
import { appReducer } from '../../src/context/appReducer';
import { hasDangerousKeys } from '../../src/services/migrationService';
import {
  CORRUPT_BACKUP_KEY,
  importStateFromJson,
  saveStateToStorage,
  STORAGE_KEY,
} from '../../src/services/storageService';
import { isValidLocalDateString } from '../../src/utils/dateUtils';

describe('Tier 2 — Boundary & Corner Cases', () => {
  it('1. Rechaza creación de ideas con textos vacíos o solo espacios en blanco', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId('new-idea-btn'));
    const modal = screen.getByTestId('new-idea-modal');

    await user.type(within(modal).getByTestId('new-idea-title-input'), '   ');
    await user.click(within(modal).getByTestId('submit-new-idea-btn'));

    expect(within(modal).getByRole('alert')).toHaveTextContent(
      /El título de la idea es obligatorio/i
    );
  });

  it('2. Trunca títulos extremadamente largos a 200 caracteres y clampa puntajes ICE a [1, 10]', () => {
    const giantTitle = 'A'.repeat(500);
    const nextState = appReducer(INITIAL_APP_STATE, {
      type: 'ADD_IDEA',
      payload: {
        title: giantTitle,
        ice: { impact: 999, confidence: -50, ease: Number.NaN },
      },
    });

    const created = nextState.ideas[0];
    expect(created.title.length).toBe(200);
    expect(created.ice).toEqual({ impact: 10, confidence: 1, ease: 5 });
  });

  it('3. Valida años bisiestos (2028-02-29 válido vs 2027-02-29 inválido) y límites de calendario', () => {
    expect(isValidLocalDateString('2028-02-29')).toBe(true);
    expect(isValidLocalDateString('2027-02-29')).toBe(false);
    expect(isValidLocalDateString('2026-04-31')).toBe(false);
    expect(isValidLocalDateString('2026-13-01')).toBe(false);
    expect(isValidLocalDateString('')).toBe(false);
  });

  it('4. Detecta referencias circulares y claves de Prototype Pollution sin colapsar', () => {
    const circular: Record<string, unknown> = { name: 'loop' };
    circular.self = circular;
    expect(hasDangerousKeys(circular)).toBe(true);

    const protoAttack =
      '{"version":1,"ideas":[],"constructor":{"prototype":{"isAdmin":true}}}';
    const importRes = importStateFromJson(protoAttack);
    expect(importRes.ok).toBe(false);
  });

  it('5. Maneja QuotaExceededError en localStorage de forma segura sin romper la aplicación', () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
        throw err;
      });

    const res = saveStateToStorage(INITIAL_APP_STATE);
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();

    setItemSpy.mockRestore();
  });

  it('6. Se auto-recupera cuando localStorage contiene JSON truncado o esquema inválido al montar la UI', () => {
    window.localStorage.setItem(STORAGE_KEY, '{"version":1,"ideas":[{"bad":true}]}');
    render(<App />);

    expect(screen.getByText('Mis Ideas')).toBeInTheDocument();
    expect(window.localStorage.getItem(CORRUPT_BACKUP_KEY)).toBe(
      '{"version":1,"ideas":[{"bad":true}]}'
    );
  });
});
