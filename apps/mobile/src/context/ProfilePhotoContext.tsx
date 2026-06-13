import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

interface ProfilePhotoContextType {
  foto: string | null; // data-URL base64 ou null
  setFoto: (foto: string | null) => Promise<void>;
}

const ProfilePhotoContext = createContext<ProfilePhotoContextType | null>(null);

const key = (id: number) => `@pasi:foto:${id}`;

export function ProfilePhotoProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const [foto, setFotoState] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) {
      setFotoState(null);
      return;
    }
    AsyncStorage.getItem(key(usuario.id_usuario))
      .then((value) => setFotoState(value))
      .catch(() => setFotoState(null));
  }, [usuario?.id_usuario]);

  const setFoto = async (novaFoto: string | null) => {
    if (!usuario) return;
    if (novaFoto) {
      await AsyncStorage.setItem(key(usuario.id_usuario), novaFoto);
    } else {
      await AsyncStorage.removeItem(key(usuario.id_usuario));
    }
    setFotoState(novaFoto);
  };

  return (
    <ProfilePhotoContext.Provider value={{ foto, setFoto }}>
      {children}
    </ProfilePhotoContext.Provider>
  );
}

export function useProfilePhoto() {
  const ctx = useContext(ProfilePhotoContext);
  if (!ctx) throw new Error('useProfilePhoto deve ser usado dentro de ProfilePhotoProvider');
  return ctx;
}
