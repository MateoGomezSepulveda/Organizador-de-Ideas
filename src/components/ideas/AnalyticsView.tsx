import React from 'react';
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Layers,
  Award,
} from 'lucide-react';
import { IDEA_CATEGORIES, IDEA_STAGES } from '../../constants/theme';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import {
  playSynthTone,
  triggerReviewNotification,
} from '../../services/soundService';
import { Idea, IdeaKpiMetrics } from '../../types/domain';
import { formatDisplayDate, isDateOverdue } from '../../utils/dateUtils';
import { calculateIceScore } from '../../utils/metrics';

interface AnalyticsViewProps {
  ideas: Idea[];
  metrics: IdeaKpiMetrics;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  ideas,
  metrics,
}) => {
  const dispatch = useAppDispatch();
  const { soundEnabled } = useAppState();

  const maxStageCount = Math.max(
    1,
    ...Object.values(metrics.byStage)
  );

  const reviewCandidates = ideas.filter(
    (i) => i.reviewDate && i.stage !== 'archived' && i.stage !== 'launched'
  );

  const handleNotifyIdea = async (idea: Idea) => {
    playSynthTone('spark', soundEnabled);
    await triggerReviewNotification(idea.title);
  };

  return (
    <div data-testid="analytics-view" className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Embudo de Conversión Creativa */}
      <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Embudo de Maduración de Ideas
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Distribución por etapa desde Chispa inicial hasta Lanzamiento
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {IDEA_STAGES.map((stage) => {
            const count = metrics.byStage[stage.id] ?? 0;
            const widthPct = Math.round((count / maxStageCount) * 100);
            const totalPct =
              metrics.totalIdeas > 0
                ? Math.round((count / metrics.totalIdeas) * 100)
                : 0;

            return (
              <div key={stage.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {stage.label}
                  </span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {count} ideas ({totalPct}%)
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(widthPct, count > 0 ? 8 : 0)}%`,
                      backgroundColor: stage.accentColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Distribución por Categoría & Rendimiento ICE */}
      <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Densidad por Área Creativa
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Volumen y promedio ICE por dominio
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {IDEA_CATEGORIES.map((cat) => {
            const catIdeas = ideas.filter((i) => i.category === cat.id);
            const count = catIdeas.length;
            const avgIce =
              count > 0
                ? (
                    catIdeas.reduce(
                      (acc, item) => acc + calculateIceScore(item.ice),
                      0
                    ) / count
                  ).toFixed(1)
                : '0.0';

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${cat.dotClass}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {cat.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    {count} ideas
                  </span>
                  <span className="rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 font-extrabold text-teal-700 dark:text-teal-300">
                    ICE {avgIce}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Radar de Revisiones Programadas & Alertas Web Audio / SW */}
      <section className="lg:col-span-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Agenda de Revisión de Hipótesis y Alertas Activas
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Dispara recordatorios sonoros (Web Audio API) y notificaciones nativas del Service Worker para tus revisiones.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {reviewCandidates.map((idea) => {
            const overdue = isDateOverdue(idea.reviewDate);
            return (
              <div
                key={idea.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        overdue
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                          : 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300'
                      }`}
                    >
                      {overdue ? 'Revisión Vencida' : 'Próxima Revisión'} ·{' '}
                      {formatDisplayDate(idea.reviewDate)}
                    </span>
                  </div>
                  <h3
                    onClick={() =>
                      dispatch({
                        type: 'SELECT_IDEA',
                        payload: { id: idea.id },
                      })
                    }
                    className="mt-2 cursor-pointer text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600"
                  >
                    {idea.title}
                  </h3>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: 'SELECT_IDEA',
                        payload: { id: idea.id },
                      })
                    }
                    className="cursor-pointer text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline"
                  >
                    Abrir Canvas
                  </button>
                  <button
                    type="button"
                    data-testid={`notify-review-btn-${idea.id}`}
                    onClick={() => handleNotifyIdea(idea)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 transition-colors duration-200 hover:bg-amber-500/25"
                  >
                    <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Probar Alerta</span>
                  </button>
                </div>
              </div>
            );
          })}

          {reviewCandidates.length === 0 && (
            <div className="col-span-full flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-xs text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>
                Todas las ideas tienen sus revisiones al día. Puedes asignar fechas de revisión desde el cajón de detalles de cada idea.
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
