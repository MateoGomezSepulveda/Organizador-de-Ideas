import { INITIAL_APP_STATE } from '../constants/initialData';
import { AppState } from '../types/domain';
import {
  hasPrototypePollutionJson,
  validateAndMigrateState,
} from './migrationService';

export const STORAGE_KEY = 'ideavault_state_v2';
export const CORRUPT_BACKUP_KEY = 'ideavault_state_v2_corrupt_backup';
export const USER_PROFILE_PREFIX = 'ideavault_profile_v2_';

export function getUserProfileStorageKey(userId: string): string {
  return `${USER_PROFILE_PREFIX}${userId}`;
}

export function loadStateFromStorage(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_APP_STATE;
    }

    if (hasPrototypePollutionJson(raw)) {
      window.localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(INITIAL_APP_STATE)
      );
      return INITIAL_APP_STATE;
    }

    const parsed = JSON.parse(raw);
    const validated = validateAndMigrateState(parsed);

    if (!validated) {
      window.localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(INITIAL_APP_STATE)
      );
      return INITIAL_APP_STATE;
    }

    return validated;
  } catch {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        window.localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
      }
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(INITIAL_APP_STATE)
      );
    } catch {
      // Ignorar si localStorage está bloqueado o sin cuota
    }
    return INITIAL_APP_STATE;
  }
}

export function saveStateToStorage(state: AppState): {
  ok: boolean;
  error?: string;
} {
  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Error al guardar en almacenamiento local';
    return { ok: false, error: message };
  }
}

/**
 * Carga las ideas guardadas específicamente bajo el perfil de un usuario autenticado.
 */
export function loadUserProfileState(userId: string): AppState | null {
  if (!userId) return null;
  try {
    const raw = window.localStorage.getItem(getUserProfileStorageKey(userId));
    if (!raw || hasPrototypePollutionJson(raw)) return null;
    const parsed = JSON.parse(raw);
    return validateAndMigrateState(parsed);
  } catch {
    return null;
  }
}

/**
 * Guarda las ideas del usuario autenticado en su espacio aislado por UID.
 */
export function saveUserProfileState(userId: string, state: AppState): void {
  if (!userId) return;
  try {
    window.localStorage.setItem(
      getUserProfileStorageKey(userId),
      JSON.stringify(state)
    );
  } catch {
    // Ignorar error de cuota
  }
}

export function exportStateToJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importStateFromJson(
  rawJson: string
): { ok: true; state: AppState } | { ok: false; error: string } {
  if (!rawJson || typeof rawJson !== 'string' || !rawJson.trim()) {
    return { ok: false, error: 'El archivo JSON está vacío.' };
  }

  if (hasPrototypePollutionJson(rawJson)) {
    return {
      ok: false,
      error:
        'Importación bloqueada por seguridad: se detectaron claves prohibidas de Prototype Pollution.',
    };
  }

  try {
    const parsed = JSON.parse(rawJson);
    const validated = validateAndMigrateState(parsed);
    if (!validated) {
      return {
        ok: false,
        error:
          'El archivo JSON no cumple con el esquema válido de IdeaVault (ideas o propiedades corruptas).',
      };
    }
    saveStateToStorage(validated);
    return { ok: true, state: validated };
  } catch {
    return {
      ok: false,
      error: 'Formato JSON inválido o corrupto.',
    };
  }
}

export function resetStorageToSeed(): AppState {
  const freshState: AppState = {
    ...INITIAL_APP_STATE,
    lastUpdated: new Date().toISOString(),
  };
  saveStateToStorage(freshState);
  return freshState;
}
