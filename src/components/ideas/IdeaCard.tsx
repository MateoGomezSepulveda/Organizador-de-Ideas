import React from 'react';
import { Star, CheckCircle2, GripVertical, FileText } from 'lucide-react';
import { CATEGORY_MAP } from '../../constants/theme';
import { useAppDispatch } from '../../context/AppContext';
import { Idea, IdeaStage } from '../../types/domain';
import { cn } from '../../utils/cn';
import { getIdeaValidationProgress } from '../../utils/metrics';
import { downloadIdeaRoadmapAsWord } from '../../utils/wordExport';

interface IdeaCardProps {
  idea: Idea;
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLElement>, id: string) => void;
  onDragOver?: (e: React.DragEvent<HTMLElement>, id: string) => void;
  onDrop?: (e: React.DragEvent<HTMLElement>, id: string) => void;
  onDragEnd?: () => void;
  onPointerDownCard?: (e: React.PointerEvent<HTMLElement>, id: string) => void;
  style?: React.CSSProperties;
}

const SIMPLE_STAGE_OPTIONS: { value: IdeaStage; label: string }[] = [
  { value: 'spark', label: 'Por Explorar' },
  { value: 'building', label: 'En Desarrollo' },
  { value: 'launched', label: 'Completada' },
];

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  draggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onPointerDownCard,
  style,
}) => {
  const dispatch = useAppDispatch();

  const progress = getIdeaValidationProgress(idea);
  const categoryMeta = CATEGORY_MAP[idea.category];

  const normalizedStageValue: IdeaStage =
    idea.stage === 'launched'
      ? 'launched'
      : idea.stage === 'spark'
      ? 'spark'
      : 'building';

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_PIN_IDEA', payload: { id: idea.id } });
  };

  const handleDownloadWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadIdeaRoadmapAsWord(idea);
  };

  return (
    <article
      data-testid={`idea-card-${idea.id}`}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, idea.id)}
      onDragOver={(e) => onDragOver?.(e, idea.id)}
      onDrop={(e) => onDrop?.(e, idea.id)}
      onDragEnd={onDragEnd}
      onPointerDown={(e) => onPointerDownCard?.(e, idea.id)}
      style={style}
      onClick={() =>
        dispatch({ type: 'SELECT_IDEA', payload: { id: idea.id } })
      }
      className={cn(
        'group flex cursor-grab active:cursor-grabbing flex-col justify-between rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-200 hover:border-teal-500 dark:hover:border-teal-500 select-none',
        isDragging
          ? 'opacity-50 scale-[0.98] border-teal-500 ring-2 ring-teal-500/30'
          : isDragOver
          ? 'border-teal-500 ring-2 ring-teal-500/40 bg-teal-50/20 dark:bg-teal-950/20'
          : 'border-slate-200 dark:border-slate-800'
      )}
    >
      <div>
        {/* Cabecera limpia: Agarre con cursor, Categoría, Word y Favorito */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              title="Arrastra con el cursor para mover esta tarjeta"
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400"
            >
              <GripVertical className="h-4 w-4" aria-hidden="true" />
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold',
                categoryMeta.badgeClass
              )}
            >
              {categoryMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              data-testid={`word-btn-${idea.id}`}
              onClick={handleDownloadWord}
              onPointerDown={(e) => e.stopPropagation()}
              title="Descargar Roadmap en Word (.doc)"
              aria-label={`Descargar Roadmap en Word de ${idea.title}`}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/50 px-2 text-[11px] font-bold text-teal-700 dark:text-teal-300 transition-colors duration-200 hover:bg-teal-100 dark:hover:bg-teal-900"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Word</span>
            </button>

            <button
              type="button"
              data-testid={`pin-btn-${idea.id}`}
              onClick={handleTogglePin}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={
                idea.isPinned ? 'Quitar de favoritas' : 'Marcar como favorita'
              }
              className={cn(
                'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl transition-colors duration-200',
                idea.isPinned
                  ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/60 dark:text-amber-400'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800'
              )}
            >
              <Star
                className={cn('h-4 w-4', idea.isPinned && 'fill-current')}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Título y Descripción */}
        <h3 className="mt-3 text-base font-bold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-200">
          {idea.title}
        </h3>

        {idea.summary && (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {idea.summary}
          </p>
        )}
      </div>

      {/* Pie simple: Tareas/Roadmap y selector de estado */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <CheckCircle2
            className={cn(
              'h-4 w-4',
              progress.percentage === 100 && progress.total > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400'
            )}
            aria-hidden="true"
          />
          <span>
            {progress.total > 0
              ? `${progress.completed}/${progress.total} pasos`
              : 'Sin pasos'}
            {idea.roadmap && idea.roadmap.length > 0
              ? ` · ${idea.roadmap.length} fases`
              : ''}
          </span>
        </span>

        <select
          aria-label={`Estado de ${idea.title}`}
          data-testid={`stage-select-${idea.id}`}
          value={normalizedStageValue}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            dispatch({
              type: 'MOVE_IDEA_STAGE',
              payload: {
                id: idea.id,
                stage: e.target.value as IdeaStage,
              },
            });
          }}
          className={cn(
            'cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none',
            normalizedStageValue === 'launched'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : normalizedStageValue === 'building'
              ? 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
          )}
        >
          {SIMPLE_STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
};
