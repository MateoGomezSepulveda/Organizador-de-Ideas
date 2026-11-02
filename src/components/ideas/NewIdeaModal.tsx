import React, { useState } from 'react';
import { X, Plus, Sparkles, Loader2, CheckCircle2, Map } from 'lucide-react';
import { IDEA_CATEGORIES } from '../../constants/theme';
import { useAppDispatch } from '../../context/AppContext';
import { generateIdeaHelpWithAi } from '../../services/aiAgentService';
import {
  IdeaCategory,
  IdeaStage,
  RoadmapPhase,
  ValidationStep,
} from '../../types/domain';

interface NewIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewIdeaModal: React.FC<NewIdeaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [problem, setProblem] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('product');
  const [stage, setStage] = useState<IdeaStage>('spark');
  const [aiSteps, setAiSteps] = useState<string[]>([]);
  const [aiRoadmap, setAiRoadmap] = useState<RoadmapPhase[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAskAiHelper = async () => {
    if (!title.trim()) {
      setError(
        'Escribe primero el título de tu idea para que el Agente de IA pueda desarrollarla a fondo.'
      );
      return;
    }

    setError(null);
    setIsGeneratingAi(true);
    try {
      const suggestion = await generateIdeaHelpWithAi(title.trim(), summary);
      const enrichedNotes = suggestion.agentAdvice
        ? `${suggestion.improvedSummary}\n\nConsejo Estratégico IA: ${suggestion.agentAdvice}`
        : suggestion.improvedSummary;

      setSummary(enrichedNotes);
      setProblem(suggestion.problem);
      setHypothesis(suggestion.hypothesis);
      setCategory(suggestion.suggestedCategory);
      setAiSteps(suggestion.suggestedSteps);
      setAiRoadmap(suggestion.roadmap);
      setAiAdvice(suggestion.agentAdvice);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el Agente de IA.'
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título de la idea es obligatorio.');
      return;
    }

    const initialSteps: ValidationStep[] = aiSteps.map((text, idx) => ({
      id: `step-ai-${Date.now()}-${idx}`,
      text,
      completed: false,
    }));

    dispatch({
      type: 'ADD_IDEA',
      payload: {
        title: title.trim(),
        summary: summary.trim(),
        problem: problem.trim(),
        hypothesis: hypothesis.trim(),
        category,
        stage,
        templateUsed: 'blank',
        validationSteps: initialSteps,
        roadmap: aiRoadmap,
        canvasBlocks: [],
      },
    });

    setTitle('');
    setSummary('');
    setProblem('');
    setHypothesis('');
    setAiSteps([]);
    setAiRoadmap([]);
    setAiAdvice(null);
    setError(null);
    onClose();
  };

  return (
    <div
      data-testid="new-idea-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Nueva idea"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Nueva Idea + Generador de Roadmap IA
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="new-idea-title"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                ¿Cuál es tu idea? *
              </label>

              <button
                type="button"
                data-testid="ai-expand-new-idea-btn"
                onClick={handleAskAiHelper}
                disabled={isGeneratingAi}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/70 px-2.5 py-1 text-xs font-bold text-teal-800 dark:text-teal-300 transition-colors duration-200 hover:bg-teal-100 disabled:opacity-60"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Razonando a fondo (hasta 1 min)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Desarrollar Idea + Roadmap IA</span>
                  </>
                )}
              </button>
            </div>

            <input
              id="new-idea-title"
              data-testid="new-idea-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej. Plataforma SaaS de logística para comercios locales"
              className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-idea-summary"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Desarrollo profundo de la idea
            </label>
            <textarea
              id="new-idea-summary"
              data-testid="new-idea-summary-input"
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Escribe detalles o pulsa 'Desarrollar Idea + Roadmap IA' para que un modelo avanzado estructure la propuesta completa..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Vista previa del Roadmap por fases generado por la IA */}
          {aiRoadmap.length > 0 && (
            <div className="rounded-xl border border-teal-200 dark:border-teal-900/70 bg-teal-50/50 dark:bg-teal-950/30 p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-teal-800 dark:text-teal-300">
                <Map className="h-4 w-4" />
                <span>
                  Roadmap Ejecutivo Generado ({aiRoadmap.length} fases listas para exportar a Word):
                </span>
              </div>
              <div className="space-y-2">
                {aiRoadmap.map((phase) => (
                  <div
                    key={phase.id}
                    className="rounded-lg border border-teal-200/70 dark:border-teal-800/70 bg-white dark:bg-slate-900 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{phase.phase}</span>
                      <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                        {phase.duration}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">
                      {phase.objective}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vista previa de pasos generados por el Agente de IA */}
          {aiSteps.length > 0 && (
            <div
              data-testid="ai-generated-steps-preview"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 space-y-2"
            >
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span>Pasos accionables iniciales:</span>
              </div>
              {aiAdvice && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {aiAdvice}
                </p>
              )}
              <ul className="space-y-1">
                {aiSteps.map((step, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="new-idea-category"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Categoría
              </label>
              <select
                id="new-idea-category"
                data-testid="new-idea-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as IdeaCategory)}
                className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold"
              >
                {IDEA_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="new-idea-stage"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Estado
              </label>
              <select
                id="new-idea-stage"
                data-testid="new-idea-stage-select"
                value={stage}
                onChange={(e) => setStage(e.target.value as IdeaStage)}
                className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold"
              >
                <option value="spark">Por Explorar</option>
                <option value="building">En Desarrollo</option>
                <option value="launched">Completada</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="submit-new-idea-btn"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              <span>Guardar Idea</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
