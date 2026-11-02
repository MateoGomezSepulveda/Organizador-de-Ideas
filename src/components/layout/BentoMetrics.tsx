import React from 'react';
import { Lightbulb, Sparkles, CheckCircle2 } from 'lucide-react';
import { IdeaKpiMetrics } from '../../types/domain';

interface BentoMetricsProps {
  metrics: IdeaKpiMetrics;
}

export const BentoMetrics: React.FC<BentoMetricsProps> = ({ metrics }) => {
  const inProgressCount =
    metrics.byStage.exploring +
    metrics.byStage.validating +
    metrics.byStage.building;

  return (
    <section
      aria-label="Resumen de ideas"
      className="grid grid-cols-3 gap-3 sm:gap-4"
    >
      {/* Total de Ideas */}
      <div
        data-testid="kpi-active-ideas"
        className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 shadow-xs"
      >
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Por Explorar
          </span>
          <p className="mt-0.5 text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.byStage.spark}
          </p>
        </div>
        <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      {/* En Desarrollo */}
      <div
        data-testid="kpi-in-progress"
        className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 shadow-xs"
      >
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            En Desarrollo
          </span>
          <p className="mt-0.5 text-2xl font-extrabold text-slate-900 dark:text-white">
            {inProgressCount}
          </p>
        </div>
        <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      {/* Completadas */}
      <div
        data-testid="kpi-launched-ideas"
        className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 shadow-xs"
      >
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Completadas
          </span>
          <p className="mt-0.5 text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.launchedIdeas}
          </p>
        </div>
        <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};
