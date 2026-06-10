import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../config/api';

export interface AuthUser {
  id_usuario: number;
  nome: string;
  email: string;
  tipo: number; // 1=Profissional 2=Paciente
}

interface AuthContextType {
  token: string | null;
  usuario: AuthUser | null;
  isLoading: boolean;
  login: (token: string, usuario: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['@pasi:token', '@pasi:usuario']).then(
      ([tokenEntry, usuarioEntry]) => {
        const saved = tokenEntry[1];
        const savedUser = usuarioEntry[1];
        if (saved && savedUser) {
          setToken(saved);
          setUsuario(JSON.parse(savedUser) as AuthUser);
          setAuthToken(saved);
        }
        setIsLoading(false);
      },
    );
  }, []);

  const login = async (newToken: string, newUsuario: AuthUser) => {
    await AsyncStorage.multiSet([
      ['@pasi:token', newToken],
      ['@pasi:usuario', JSON.stringify(newUsuario)],
    ]);
    setAuthToken(newToken);
    setToken(newToken);
    setUsuario(newUsuario);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['@pasi:token', '@pasi:usuario']);
    setAuthToken(null);
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ token, usuario, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
