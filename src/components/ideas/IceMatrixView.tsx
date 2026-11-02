import React from 'react';
import {
  Zap,
  Compass,
  Clock,
  Archive,
  Sliders,
} from 'lucide-react';
import { STAGE_MAP } from '../../constants/theme';
import { useAppDispatch } from '../../context/AppContext';
import { Idea } from '../../types/domain';
import { cn } from '../../utils/cn';
import {
  calculateIceScore,
  classifyIdeaQuadrant,
  IceQuadrant,
} from '../../utils/metrics';
import { EmptyState } from '../common/EmptyState';

interface IceMatrixViewProps {
  ideas: Idea[];
  onOpenNewIdeaModal: () => void;
}

const QUADRANT_META: Record<
  IceQuadrant,
  {
    title: string;
    subtitle: string;
    badgeClass: string;
    icon: React.ReactNode;
  }
> = {
  quick_win: {
    title: '1. Quick Wins (Ejecutar Ahora)',
    subtitle: 'Alto Impacto (≥6) + Alta Facilidad (≥6)',
    badgeClass:
      'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30',
    icon: <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  },
  strategic_bet: {
    title: '2. Apuestas Estratégicas (Planificar MVP)',
    subtitle: 'Alto Impacto (≥6) + Baja Facilidad (<6)',
    badgeClass:
      'border-teal-200 bg-teal-50/70 dark:border-teal-900/60 dark:bg-teal-950/30',
    icon: <Compass className="h-4 w-4 text-teal-600 dark:text-teal-400" />,
  },
  fill_in: {
    title: '3. Victorias Incrementales (Tiempo Libre)',
    subtitle: 'Bajo Impacto (<6) + Alta Facilidad (≥6)',
    badgeClass:
      'border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30',
    icon: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  },
  reconsider: {
    title: '4. Descartar o Congelador',
    subtitle: 'Bajo Impacto (<6) + Baja Facilidad (<6)',
    badgeClass:
      'border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/50',
    icon: <Archive className="h-4 w-4 text-slate-600 dark:text-slate-400" />,
  },
};

export const IceMatrixView: React.FC<IceMatrixViewProps> = ({
  ideas,
  onOpenNewIdeaModal,
}) => {
  const dispatch = useAppDispatch();

  if (ideas.length === 0) {
    return (
      <EmptyState
        title="Sin ideas para graficar en la Matriz ICE"
        description="Agrega nuevas ideas o ajusta los filtros activos para calibrar su Impacto, Confianza y Facilidad."
        actionLabel="Nueva Idea"
        onAction={onOpenNewIdeaModal}
      />
    );
  }

  const quadrants: IceQuadrant[] = [
    'quick_win',
    'strategic_bet',
    'fill_in',
    'reconsider',
  ];

  return (
    <div data-testid="ice-matrix-view" className="space-y-6">
      {/* Cuadrícula 2x2 de Impacto vs Facilidad */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {quadrants.map((quadKey) => {
          const meta = QUADRANT_META[quadKey];
          const quadIdeas = ideas.filter(
            (idea) => classifyIdeaQuadrant(idea) === quadKey
          );

          return (
            <section
              key={quadKey}
              data-testid={`quadrant-${quadKey}`}
              className={cn(
                'flex flex-col rounded-2xl border p-4 shadow-sm',
                meta.badgeClass
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {meta.icon}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {meta.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {meta.subtitle}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white dark:bg-slate-800 px-2.5 py-0.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 shadow-sm">
                  {quadIdeas.length}
                </span>
              </div>

              <div className="space-y-2">
                {quadIdeas.map((idea) => {
                  const score = calculateIceScore(idea.ice);
                  const stMeta = STAGE_MAP[idea.stage];
                  return (
                    <div
                      key={idea.id}
                      onClick={() =>
                        dispatch({
                          type: 'SELECT_IDEA',
                          payload: { id: idea.id },
                        })
                      }
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-sm transition-colors duration-200 hover:border-teal-500"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                          {idea.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.2 font-semibold border',
                              stMeta.badgeClass
                            )}
                          >
                            {stMeta.shortLabel}
                          </span>
                          <span>
                            I:{idea.ice.impact} · C:{idea.ice.confidence} · E:
                            {idea.ice.ease}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-lg bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 px-2.5 py-1 text-xs font-extrabold text-teal-800 dark:text-teal-300">
                        {score.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
                {quadIdeas.length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    Ninguna idea clasificada en este cuadrante.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Calibrador Interactivo ICE en Tiempo Real */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Calibrador Rápido de Puntaje ICE (Impacto · Confianza · Facilidad)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="pb-2.5 font-bold">Idea</th>
                <th className="pb-2.5 font-bold">Impacto (1-10)</th>
                <th className="pb-2.5 font-bold">Confianza (1-10)</th>
                <th className="pb-2.5 font-bold">Facilidad (1-10)</th>
                <th className="pb-2.5 text-right font-bold">Score ICE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {ideas.map((idea) => {
                const score = calculateIceScore(idea.ice);
                return (
                  <tr
                    key={idea.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: 'SELECT_IDEA',
                            payload: { id: idea.id },
                          })
                        }
                        className="cursor-pointer text-left font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400"
                      >
                        {idea.title}
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={1}
                          max={10}
                          aria-label={`Impacto de ${idea.title}`}
                          value={idea.ice.impact}
                          onChange={(e) =>
                            dispatch({
                              type: 'UPDATE_ICE_SCORE',
                              payload: {
                                id: idea.id,
                                ice: { impact: Number(e.target.value) },
                              },
                            })
                          }
                          className="h-1.5 w-24 cursor-pointer accent-teal-600"
                        />
                        <span className="w-5 font-bold text-slate-700 dark:text-slate-300">
                          {idea.ice.impact}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={1}
                          max={10}
                          aria-label={`Confianza de ${idea.title}`}
                          value={idea.ice.confidence}
                          onChange={(e) =>
                            dispatch({
                              type: 'UPDATE_ICE_SCORE',
                              payload: {
                                id: idea.id,
                                ice: { confidence: Number(e.target.value) },
                              },
                            })
                          }
                          className="h-1.5 w-24 cursor-pointer accent-teal-600"
                        />
                        <span className="w-5 font-bold text-slate-700 dark:text-slate-300">
                          {idea.ice.confidence}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={1}
                          max={10}
                          aria-label={`Facilidad de ${idea.title}`}
                          value={idea.ice.ease}
                          onChange={(e) =>
                            dispatch({
                              type: 'UPDATE_ICE_SCORE',
                              payload: {
                                id: idea.id,
                                ice: { ease: Number(e.target.value) },
                              },
                            })
                          }
                          className="h-1.5 w-24 cursor-pointer accent-teal-600"
                        />
                        <span className="w-5 font-bold text-slate-700 dark:text-slate-300">
                          {idea.ice.ease}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex rounded-lg bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 px-2.5 py-1 font-extrabold text-teal-800 dark:text-teal-300">
                        {score.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
