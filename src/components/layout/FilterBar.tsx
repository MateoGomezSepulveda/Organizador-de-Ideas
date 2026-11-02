import React from 'react';
import { Search, Star, RotateCcw } from 'lucide-react';
import { IDEA_CATEGORIES } from '../../constants/theme';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import { IdeaCategory, IdeaStage } from '../../types/domain';
import { cn } from '../../utils/cn';

const SIMPLE_STATUS_FILTERS: { id: IdeaStage | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'spark', label: 'Por Explorar' },
  { id: 'building', label: 'En Desarrollo' },
  { id: 'launched', label: 'Completadas' },
];

export const FilterBar: React.FC = () => {
  const { filters } = useAppState();
  const dispatch = useAppDispatch();

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.category !== 'all' ||
    filters.stage !== 'all' ||
    filters.onlyPinned;

  return (
    <section
      aria-label="Filtros de ideas"
      className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Buscador limpio */}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            data-testid="search-ideas-input"
            aria-label="Buscar ideas"
            value={filters.searchQuery}
            onChange={(e) =>
              dispatch({
                type: 'SET_FILTERS',
                payload: { searchQuery: e.target.value },
              })
            }
            placeholder="Buscar entre tus ideas..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Pestañas de estado simples */}
        <div className="flex flex-wrap items-center gap-1.5">
          {SIMPLE_STATUS_FILTERS.map((st) => {
            const active = filters.stage === st.id;
            return (
              <button
                key={st.id}
                type="button"
                data-testid={`status-filter-${st.id}`}
                onClick={() =>
                  dispatch({
                    type: 'SET_FILTERS',
                    payload: { stage: st.id },
                  })
                }
                className={cn(
                  'cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-200',
                  active
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                )}
              >
                {st.label}
              </button>
            );
          })}

          <button
            type="button"
            data-testid="filter-pinned-btn"
            onClick={() =>
              dispatch({
                type: 'SET_FILTERS',
                payload: { onlyPinned: !filters.onlyPinned },
              })
            }
            className={cn(
              'inline-flex cursor-pointer items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors duration-200',
              filters.onlyPinned
                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
            )}
          >
            <Star className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Favoritas</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              data-testid="reset-filters-btn"
              onClick={() => dispatch({ type: 'RESET_FILTERS' })}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Categorías simples */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          type="button"
          data-testid="category-pill-all"
          onClick={() =>
            dispatch({ type: 'SET_FILTERS', payload: { category: 'all' } })
          }
          className={cn(
            'cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-200',
            filters.category === 'all'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          )}
        >
          Todas las categorías
        </button>

        {IDEA_CATEGORIES.map((cat) => {
          const isSelected = filters.category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              data-testid={`category-pill-${cat.id}`}
              onClick={() =>
                dispatch({
                  type: 'SET_FILTERS',
                  payload: { category: cat.id as IdeaCategory },
                })
              }
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-200',
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', cat.dotClass)} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
