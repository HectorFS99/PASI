import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TIPOS_RESPOSTA } from './perguntaDraft';
import { colors } from '../../constants/colors';

interface Props {
  value: number;
  onChange: (tipoId: number) => void;
}

/** Chips com ícone para escolher o tipo de resposta da pergunta. */
export function TipoRespostaPicker({ value, onChange }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2 mb-4">
      {TIPOS_RESPOSTA.map((tipo) => {
        const sel = value === tipo.id;
        return (
          <TouchableOpacity
            key={tipo.id}
            onPress={() => onChange(tipo.id)}
            className={`flex-row items-center px-3 py-2 rounded-xl border ${
              sel ? 'bg-primary border-primary' : 'bg-white border-border'
            }`}
            accessibilityRole="radio"
            accessibilityState={{ checked: sel }}
            accessibilityHint={tipo.descricao}
          >
            <MaterialIcons
              name={tipo.icone}
              size={16}
              color={sel ? colors.white : colors.gray700}
              style={{ marginRight: 6 }}
            />
            <Text className={`text-xs font-medium ${sel ? 'text-white' : 'text-gray-700'}`}>
              {tipo.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
