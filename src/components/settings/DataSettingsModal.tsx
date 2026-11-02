import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import {
  exportStateToJson,
  importStateFromJson,
  resetStorageToSeed,
} from '../../services/storageService';

interface DataSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataSettingsModal: React.FC<DataSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const [jsonInput, setJsonInput] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const serialized = exportStateToJson(state);
    setJsonInput(serialized);
    try {
      const blob = new Blob([serialized], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ideavault-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback en entornos de prueba sin URL.createObjectURL
    }
    setFeedback({
      type: 'success',
      message: 'Respaldo JSON generado y listo para conservar.',
    });
  };

  const handleImportJson = () => {
    const result = importStateFromJson(jsonInput);
    if (!result.ok) {
      setFeedback({ type: 'error', message: result.error });
      return;
    }

    dispatch({ type: 'HYDRATE_STATE', payload: result.state });
    setFeedback({
      type: 'success',
      message: `Se restauraron ${result.state.ideas.length} ideas correctamente.`,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setJsonInput(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSeed = () => {
    const seed = resetStorageToSeed();
    dispatch({ type: 'HYDRATE_STATE', payload: seed });
    setConfirmReset(false);
    setFeedback({
      type: 'success',
      message: 'Datos semilla restaurados exitosamente.',
    });
  };

  return (
    <div
      data-testid="data-settings-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Gestión de Datos y Respaldos JSON"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/70 dark:text-teal-400">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Gestión de Datos, Portabilidad y Respaldos
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Esquema v{state.version} · Protección contra Prototype Pollution activa
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-settings-btn"
            onClick={onClose}
            aria-label="Cerrar gestión de datos"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {feedback && (
            <div
              role="alert"
              data-testid="settings-feedback-alert"
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Exportar Backup */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  1. Exportar Copia de Seguridad (.json)
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Descarga todas tus ideas, puntajes ICE, bloques de canvas y experimentos.
                </p>
              </div>
              <button
                type="button"
                data-testid="export-json-btn"
                onClick={handleDownloadJson}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Exportar JSON</span>
              </button>
            </div>
          </div>

          {/* Importar Backup */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                2. Importar y Validar Respaldo (.json)
              </h3>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <Upload className="h-3.5 w-3.5" />
                <span>Cargar archivo</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              data-testid="import-json-textarea"
              aria-label="Contenido JSON para importar"
              rows={5}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Pega aquí el contenido JSON de tu respaldo (ej. {"version": 1, "ideas": [...]})'
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 font-mono text-xs text-slate-800 dark:text-slate-200 focus:border-teal-500 focus:outline-none"
            />

            <div className="flex justify-end">
              <button
                type="button"
                data-testid="import-json-btn"
                onClick={handleImportJson}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:opacity-95"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Validar e Importar JSON</span>
              </button>
            </div>
          </div>

          {/* Restaurar Datos Semilla */}
          <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  3. Restaurar Datos Semilla de Demostración
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Restablece el laboratorio con las 6 ideas curadas por defecto.
                </p>
              </div>
              {!confirmReset ? (
                <button
                  type="button"
                  data-testid="request-reset-seed-btn"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restaurar Seed</span>
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="confirm-reset-seed-btn"
                  onClick={handleResetSeed}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700"
                >
                  <span>Confirmar Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
