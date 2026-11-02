import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  isFirebaseConfigured,
  onCloudAuthStateChanged,
  signInWithGoogle,
  signOutFromCloud,
} from '../services/firebase';

interface AuthContextValue {
  user: User | null;
  isConfigured: boolean;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isFirebaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onCloudAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => setAuthError(null);

  const loginWithGoogle = async () => {
    setAuthError(null);
    if (!isFirebaseConfigured) {
      setAuthError(
        'Falta configurar Firebase: crea un archivo .env en la raíz del proyecto con tus claves VITE_FIREBASE_* y reinicia la terminal (npm run dev).'
      );
      return;
    }
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión con Google. Verifica tu configuración de Firebase.'
      );
    }
  };

  const logout = async () => {
    setAuthError(null);
    if (!isFirebaseConfigured) return;
    try {
      await signOutFromCloud();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Error al cerrar sesión'
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isConfigured: isFirebaseConfigured,
        isLoading,
        authError,
        clearAuthError,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return ctx;
}
