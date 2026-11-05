import React, { useState } from 'react';
import {
  X,
  Star,
  Trash2,
  Plus,
  CheckSquare,
  Square,
  Sparkles,
  Loader2,
  Send,
  FileText,
  Map,
  Pencil,
  Check,
} from 'lucide-react';
import { IDEA_CATEGORIES } from '../../constants/theme';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import {
  askAiAgentAboutIdea,
  generateIdeaHelpWithAi,
} from '../../services/aiAgentService';
import { IdeaCategory, IdeaStage } from '../../types/domain';
import { cn } from '../../utils/cn';
import { getIdeaValidationProgress } from '../../utils/metrics';
import { downloadIdeaRoadmapAsWord } from '../../utils/wordExport';

export const IdeaDetailDrawer: React.FC = () => {
  const { ideas, selectedIdeaId } = useAppState();
  const dispatch = useAppDispatch();

  const [newStepText, setNewStepText] = useState('');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepText, setEditingStepText] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiBusy, setIsAiBusy] = useState(false);

  const idea = ideas.find((i) => i.id === selectedIdeaId);
  if (!idea) return null;

  const progress = getIdeaValidationProgress(idea);

  const normalizedStage: IdeaStage =
    idea.stage === 'launched'
      ? 'launched'
      : idea.stage === 'spark'
      ? 'spark'
      : 'building';

  const handleClose = () => {
    setAiReply(null);
    setAiError(null);
    setEditingStepId(null);
    setEditingStepText('');
    dispatch({ type: 'SELECT_IDEA', payload: { id: null } });
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepText.trim()) return;
    dispatch({
      type: 'ADD_VALIDATION_STEP',
      payload: { ideaId: idea.id, text: newStepText },
    });
    setNewStepText('');
  };

  const handleStartEditStep = (stepId: string, currentText: string) => {
    setEditingStepId(stepId);
    setEditingStepText(currentText);
  };

  const handleSaveEditStep = (stepId: string) => {
    const trimmed = editingStepText.trim();
    if (trimmed) {
      dispatch({
        type: 'UPDATE_VALIDATION_STEP',
        payload: { ideaId: idea.id, stepId, text: trimmed },
      });
    }
    setEditingStepId(null);
    setEditingStepText('');
  };

  const handleCancelEditStep = () => {
    setEditingStepId(null);
    setEditingStepText('');
  };

  const handleExpandWithAi = async () => {
    setAiError(null);
    setIsAiBusy(true);
    try {
      const suggestion = await generateIdeaHelpWithAi(idea.title, idea.summary);
      const updatedSummary = `${suggestion.improvedSummary}\n\nConsejo Estratégico IA: ${suggestion.agentAdvice}`;

      dispatch({
        type: 'UPDATE_IDEA',
        payload: {
          id: idea.id,
          updates: {
            summary: updatedSummary,
            problem: suggestion.problem || idea.problem,
            hypothesis: suggestion.hypothesis || idea.hypothesis,
            roadmap: suggestion.roadmap,
          },
        },
      });

      for (const stepText of suggestion.suggestedSteps) {
        dispatch({
          type: 'ADD_VALIDATION_STEP',
          payload: { ideaId: idea.id, text: stepText },
        });
      }
      setAiReply(
        `He desarrollado la idea en profundidad con ${suggestion.roadmap.length} fases de Roadmap y ${suggestion.suggestedSteps.length} pasos accionables. Ya puedes descargar el Roadmap en formato Word (.doc).`
      );
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'No se pudo consultar al Agente de IA.'
      );
    } finally {
      setIsAiBusy(false);
    }
  };

  const handleAskCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setAiError(null);
    setIsAiBusy(true);
    try {
      const answer = await askAiAgentAboutIdea(
        idea.title,
        idea.summary,
        aiQuestion.trim()
      );
      setAiReply(answer);
      setAiQuestion('');
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'No se pudo consultar al Agente de IA.'
      );
    } finally {
      setIsAiBusy(false);
    }
  };

  const handleAppendAiReplyToNotes = () => {
    if (!aiReply) return;
    const nextNotes = idea.summary
      ? `${idea.summary}\n\nAgente IA: ${aiReply}`
      : `Agente IA: ${aiReply}`;
    dispatch({
      type: 'UPDATE_IDEA',
      payload: { id: idea.id, updates: { summary: nextNotes } },
    });
    setAiReply(null);
  };

  const handleDeleteIdea = () => {
    dispatch({ type: 'DELETE_IDEA', payload: { id: idea.id } });
  };

  return (
    <div
      data-testid="idea-detail-drawer"
      role="dialog"
      aria-modal="true"
      aria-label={`Editar idea ${idea.title}`}
      onClick={handleClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs"
    >
      <div
        className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera simple */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <button
            type="button"
            onClick={() =>
              dispatch({ type: 'TOGGLE_PIN_IDEA', payload: { id: idea.id } })
            }
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors duration-200',
              idea.isPinned
                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            )}
          >
            <Star
              className={cn('h-3.5 w-3.5', idea.isPinned && 'fill-current')}
              aria-hidden="true"
            />
            <span>{idea.isPinned ? 'Favorita' : 'Marcar favorita'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="delete-idea-btn"
              onClick={handleDeleteIdea}
              aria-label="Eliminar idea"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              data-testid="close-drawer-btn"
              onClick={handleClose}
              aria-label="Cerrar"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Contenido limpio y directo */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Título */}
          <div>
            <label
              htmlFor="drawer-idea-title"
              className="block text-xs font-bold text-slate-500 dark:text-slate-400"
            >
              Título de la idea
            </label>
            <input
              id="drawer-idea-title"
              data-testid="drawer-title-input"
              type="text"
              value={idea.title}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_IDEA',
                  payload: {
                    id: idea.id,
                    updates: { title: e.target.value },
                  },
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-base font-bold text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Estado y Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="drawer-stage-select"
                className="block text-xs font-bold text-slate-500 dark:text-slate-400"
              >
                Estado
              </label>
              <select
                id="drawer-stage-select"
                data-testid="drawer-stage-select"
                value={normalizedStage}
                onChange={(e) =>
                  dispatch({
                    type: 'MOVE_IDEA_STAGE',
                    payload: {
                      id: idea.id,
                      stage: e.target.value as IdeaStage,
                    },
                  })
                }
                className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="spark">Por Explorar</option>
                <option value="building">En Desarrollo</option>
                <option value="launched">Completada</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="drawer-category-select"
                className="block text-xs font-bold text-slate-500 dark:text-slate-400"
              >
                Categoría
              </label>
              <select
                id="drawer-category-select"
                data-testid="drawer-category-select"
                value={idea.category}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_IDEA',
                    payload: {
                      id: idea.id,
                      updates: { category: e.target.value as IdeaCategory },
                    },
                  })
                }
                className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                {IDEA_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Asistente Agente de IA para esta Idea */}
          <div className="rounded-2xl border border-teal-200 dark:border-teal-900/70 bg-teal-50/60 dark:bg-teal-950/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Agente de IA + Roadmap
                </span>
              </div>

              <button
                type="button"
                data-testid="drawer-ai-expand-btn"
                onClick={handleExpandWithAi}
                disabled={isAiBusy}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors duration-200 hover:bg-teal-700 disabled:opacity-60"
              >
                {isAiBusy ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Razonando (hasta 1 min)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generar Idea Profunda + Roadmap</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              data-testid="drawer-download-word-btn"
              onClick={() => downloadIdeaRoadmapAsWord(idea)}
              className="w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-teal-600 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-extrabold text-teal-700 dark:text-teal-300 shadow-2xs transition-colors duration-200 hover:bg-teal-50 dark:hover:bg-slate-800"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>Descargar Roadmap Completo en Word (.doc)</span>
            </button>

            <form onSubmit={handleAskCustomQuestion} className="flex gap-2">
              <input
                type="text"
                data-testid="drawer-ai-question-input"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Pregúntale al Agente sobre esta idea (ej. ¿Por dónde empiezo?)..."
                className="flex-1 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isAiBusy}
                aria-label="Preguntar al Agente IA"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-teal-300 dark:border-teal-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-50 disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

            {aiError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                {aiError}
              </p>
            )}

            {aiReply && (
              <div className="rounded-xl border border-teal-200/80 dark:border-teal-800 bg-white dark:bg-slate-900 p-3 space-y-2">
                <p className="whitespace-pre-line text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                  {aiReply}
                </p>
                <button
                  type="button"
                  onClick={handleAppendAiReplyToNotes}
                  className="cursor-pointer text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline"
                >
                  + Agregar esta respuesta a mis notas
                </button>
              </div>
            )}
          </div>

          {/* Notas libres de la idea */}
          <div>
            <label
              htmlFor="drawer-idea-summary"
              className="block text-xs font-bold text-slate-500 dark:text-slate-400"
            >
              Notas y descripción profunda
            </label>
            <textarea
              id="drawer-idea-summary"
              data-testid="drawer-summary-input"
              rows={6}
              value={idea.summary}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_IDEA',
                  payload: {
                    id: idea.id,
                    updates: { summary: e.target.value },
                  },
                })
              }
              placeholder="Escribe aquí todos los detalles, notas o apuntes sobre tu idea..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Roadmap estructurado si existe */}
          {idea.roadmap && idea.roadmap.length > 0 && (
            <div className="rounded-2xl border border-teal-200 dark:border-teal-900/70 bg-teal-50/40 dark:bg-teal-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-800 dark:text-teal-300">
                  <Map className="h-4 w-4" />
                  <span>Roadmap de la Idea ({idea.roadmap.length} fases)</span>
                </span>
                <button
                  type="button"
                  onClick={() => downloadIdeaRoadmapAsWord(idea)}
                  className="cursor-pointer text-xs font-bold text-teal-700 dark:text-teal-300 hover:underline"
                >
                  Descargar .doc
                </button>
              </div>
              <div className="space-y-2.5">
                {idea.roadmap.map((phase) => (
                  <div
                    key={phase.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{phase.phase}</span>
                      <span className="rounded-md bg-teal-50 dark:bg-teal-950 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                        {phase.duration}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>Objetivo:</strong> {phase.objective}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist de Pasos Sencillo */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pasos o tareas ({progress.completed}/{progress.total})
              </span>
              {progress.total > 0 && (
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                  {progress.percentage}%
                </span>
              )}
            </div>

            <div className="space-y-2">
              {idea.validationSteps.map((step) => {
                const isEditing = editingStepId === step.id;

                return (
                  <div
                    key={step.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-950 px-3 py-2 transition-colors duration-200"
                  >
                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          data-testid={`edit-step-input-${step.id}`}
                          value={editingStepText}
                          autoFocus
                          onChange={(e) => setEditingStepText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditStep(step.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEditStep();
                            }
                          }}
                          className="flex-1 rounded-lg border border-teal-500 bg-white dark:bg-slate-900 px-2.5 py-1 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          data-testid={`save-step-${step.id}`}
                          aria-label="Guardar cambios de tarea"
                          onClick={() => handleSaveEditStep(step.id)}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-teal-600 text-white transition-colors duration-200 hover:bg-teal-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Cancelar edición"
                          onClick={handleCancelEditStep}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          data-testid={`toggle-step-${step.id}`}
                          onClick={() =>
                            dispatch({
                              type: 'TOGGLE_VALIDATION_STEP',
                              payload: { ideaId: idea.id, stepId: step.id },
                            })
                          }
                          className="flex flex-1 cursor-pointer items-center gap-2.5 text-left text-sm"
                        >
                          {step.completed ? (
                            <CheckSquare className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <span
                            className={cn(
                              step.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-200'
                            )}
                          >
                            {step.text}
                          </span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            data-testid={`edit-step-${step.id}`}
                            aria-label={`Editar paso ${step.text}`}
                            onClick={() =>
                              handleStartEditStep(step.id, step.text)
                            }
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Eliminar paso ${step.text}`}
                            onClick={() =>
                              dispatch({
                                type: 'DELETE_VALIDATION_STEP',
                                payload: { ideaId: idea.id, stepId: step.id },
                              })
                            }
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleAddStep} className="mt-3 flex gap-2">
              <input
                type="text"
                data-testid="new-validation-step-input"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                placeholder="Añadir un paso o tarea..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="submit"
                data-testid="add-validation-step-btn"
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Añadir</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
