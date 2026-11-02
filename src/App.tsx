import React, { useMemo, useState } from 'react';
import { Plus, Sparkles, BookOpen, RotateCcw } from 'lucide-react';
import { AppProvider, useAppDispatch, useAppState } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { BentoMetrics } from './components/layout/BentoMetrics';
import { FilterBar } from './components/layout/FilterBar';
import { IdeaBoardView } from './components/ideas/IdeaBoardView';
import { IdeaDetailDrawer } from './components/ideas/IdeaDetailDrawer';
import { NewIdeaModal } from './components/ideas/NewIdeaModal';
import { calculateIdeaMetrics, filterAndSortIdeas } from './utils/metrics';
import { AppState } from './types/domain';

export const IdeaVaultWorkspace: React.FC = () => {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  const [isNewIdeaOpen, setIsNewIdeaOpen] = useState(false);
  const [quickSparkTitle, setQuickSparkTitle] = useState('');

  const metrics = useMemo(
    () => calculateIdeaMetrics(state.ideas),
    [state.ideas]
  );

  const visibleIdeas = useMemo(
    () => filterAndSortIdeas(state.ideas, state.filters),
    [state.ideas, state.filters]
  );

  const handleQuickSparkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickSparkTitle.trim();
    if (!trimmed) return;
    dispatch({
      type: 'ADD_IDEA',
      payload: {
        title: trimmed,
        stage: 'spark',
        category: 'product',
        templateUsed: 'blank',
        validationSteps: [],
        canvasBlocks: [],
      },
    });
    setQuickSparkTitle('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <Header
        onOpenNewIdeaModal={() => setIsNewIdeaOpen(true)}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-6 sm:px-6 pb-24">
        {/* Guía de Ejemplo visible cuando NO se ha iniciado sesión */}
        {!user && (
          <section
            data-testid="demo-guide-banner"
            aria-label="Guía de ejemplo de uso"
            className="rounded-2xl border border-teal-200 dark:border-teal-900/70 bg-teal-50/70 dark:bg-teal-950/30 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Modo de Ejemplo — ¿Cómo usar el Organizador de Ideas?
                  </h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong>1. Captura:</strong> Escribe una idea abajo o usa &ldquo;Nueva Idea&rdquo;.{' '}
                    <strong>2. Detalla:</strong> Haz clic en cualquier tarjeta para añadir notas y tareas con espacios libres.{' '}
                    <strong>3. Guarda tu perfil:</strong> Conéctate con <strong>Iniciar con Google</strong> para guardar tus propias ideas privadas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'RESET_TO_SEED' })}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start sm:self-center rounded-xl border border-teal-300 dark:border-teal-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Restaurar Ejemplo</span>
              </button>
            </div>
          </section>
        )}
        {/* Captura rápida en 1 línea */}
        <form
          onSubmit={handleQuickSparkSubmit}
          aria-label="Anote una idea rápida"
          className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xs"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <input
            type="text"
            data-testid="quick-spark-input"
            aria-label="Escribir idea rápida"
            value={quickSparkTitle}
            onChange={(e) => setQuickSparkTitle(e.target.value)}
            placeholder="Escribe una idea rápida aquí y presiona Enter..."
            className="flex-1 bg-transparent px-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            data-testid="quick-spark-submit-btn"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Añadir</span>
          </button>
        </form>

        {/* 3 Contadores simples */}
        <BentoMetrics metrics={metrics} />

        {/* Buscador y filtros sencillos */}
        <FilterBar />

        {/* Cuadrícula limpia de tarjetas */}
        <IdeaBoardView
          ideas={visibleIdeas}
          onOpenNewIdeaModal={() => setIsNewIdeaOpen(true)}
        />
      </main>

      {/* Botón flotante en móvil */}
      <button
        type="button"
        data-testid="mobile-fab-new-idea"
        onClick={() => setIsNewIdeaOpen(true)}
        aria-label="Nueva idea"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-colors duration-200 hover:bg-teal-700 sm:hidden"
      >
        <Plus className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Panel lateral simple de edición */}
      <IdeaDetailDrawer />

      {/* Modal sencillo de nueva idea */}
      <NewIdeaModal
        isOpen={isNewIdeaOpen}
        onClose={() => setIsNewIdeaOpen(false)}
      />
    </div>
  );
};

export const App: React.FC<{ initialState?: AppState }> = ({
  initialState,
}) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider initialState={initialState}>
          <IdeaVaultWorkspace />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
