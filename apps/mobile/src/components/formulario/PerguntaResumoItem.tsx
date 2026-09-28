import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tipoRespostaLabel } from './perguntaDraft';
import { colors } from '../../constants/colors';

interface Props {
  numero: number;
  texto: string;
  tipoId: number;
  obrigatoria: boolean;
  onRemover: () => void;
}

/** Linha de uma pergunta já incluída no formulário, com botão de remover. */
export function PerguntaResumoItem({ numero, texto, tipoId, obrigatoria, onRemover }: Props) {
  return (
    <View className="bg-gray-50 border border-border rounded-2xl p-3 mb-2 flex-row items-start">
      <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-3 mt-0.5 flex-shrink-0">
        <Text className="text-white text-xs font-bold">{numero}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-800">{texto}</Text>
        <Text className="text-xs text-muted mt-0.5">
          {tipoRespostaLabel(tipoId)}
          {obrigatoria ? ' · Obrigatória' : ''}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onRemover}
        className="ml-2 w-6 h-6 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel={`Remover pergunta ${numero}`}
      >
        <MaterialIcons name="close" size={18} color={colors.dangerLight} />
      </TouchableOpacity>
    </View>
  );
}
