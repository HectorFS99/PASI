import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Barra de ações fixa na parte inferior da tela. Mantém botões de
 * navegação (Voltar, Cancelar, Salvar, etc.) sempre visíveis,
 * independentemente do scroll do conteúdo.
 */
export function FormFooter({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="bg-white border-t border-border px-6 pt-3"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {children}
    </View>
  );
}
