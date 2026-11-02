import React from 'react';
import {
  Lightbulb,
  Cloud,
  HardDrive,
  RefreshCw,
  Sun,
  Moon,
  Plus,
  LogOut,
  AlertCircle,
  X,
} from 'lucide-react';
import { useSyncStatus } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

interface HeaderProps {
  onOpenNewIdeaModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewIdeaModal,
}) => {
  const syncStatus = useSyncStatus();
  const { theme, toggleTheme } = useTheme();
  const { user, authError, clearAuthError, loginWithGoogle, logout } =
    useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        {/* Marca + Estado */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
            <Lightbulb className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Mis Ideas
            </h1>
            <span
              data-testid="sync-status-badge"
              className={cn(
                'hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                syncStatus === 'synced'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : syncStatus === 'syncing'
                  ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              )}
            >
              {syncStatus === 'synced' && (
                <>
                  <Cloud className="h-3 w-3" aria-hidden="true" />
                  <span>Nube Sincronizada</span>
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw
                    className="h-3 w-3 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Guardando...</span>
                </>
              )}
              {syncStatus === 'local' && (
                <>
                  <HardDrive className="h-3 w-3" aria-hidden="true" />
                  <span>Guardado Local</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Acciones: Tema, Login con Google y Nueva Idea */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={
              theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
            }
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>

          {/* Botón de Sesión con Google (Siempre Visible) */}
          {user ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuario'}
                  className="h-5 w-5 rounded-full"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                  {(user.displayName || user.email || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline max-w-[110px] truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                {user.displayName || user.email}
              </span>
              <button
                type="button"
                data-testid="google-logout-btn"
                onClick={logout}
                title="Cerrar sesión de Google"
                className="ml-1 inline-flex cursor-pointer items-center text-rose-500 hover:text-rose-600"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid="google-login-btn"
              onClick={loginWithGoogle}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {/* Logo Oficial de Google en SVG */}
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.54-5.17 3.54-8.97z"
                />
                <path
                  fill="#34A853"
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96h-4.01v3.14C3.515 21.3 7.565 24 12.255 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.535 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62h-4.01C.705 8.24.255 10.06.255 12s.45 3.76 1.27 5.38l4.01-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0 7.565 0 3.515 2.7 1.525 6.62l4.01 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Iniciar con Google</span>
            </button>
          )}

          <button
            type="button"
            data-testid="new-idea-btn"
            onClick={onOpenNewIdeaModal}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors duration-200 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nueva Idea</span>
          </button>
        </div>
      </div>

      {/* Aviso si el usuario pulsa "Iniciar con Google" sin haber configurado .env o si ocurre un error */}
      {authError && (
        <div
          role="alert"
          data-testid="auth-error-banner"
          className="border-t border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/80 px-4 py-2.5 text-xs font-medium text-amber-900 dark:text-amber-200"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle
                className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              <span>{authError}</span>
            </div>
            <button
              type="button"
              onClick={clearAuthError}
              aria-label="Cerrar aviso"
              className="cursor-pointer rounded-lg p-1 hover:bg-amber-100 dark:hover:bg-amber-900/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
