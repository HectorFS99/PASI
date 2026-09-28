import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface ChipOption<T> {
  value: T;
  label: string;
}

interface Props<T> {
  options: ChipOption<T>[];
  /** Valores selecionados (seleção múltipla). */
  selected: T[];
  onToggle: (value: T) => void;
}

/** Grupo de chips selecionáveis (ex.: filtros por situação ou tipo). */
export function ChipGroup<T extends string | number>({ options, selected, onToggle }: Props<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((op) => {
        const sel = selected.includes(op.value);
        return (
          <TouchableOpacity
            key={String(op.value)}
            onPress={() => onToggle(op.value)}
            className={`px-4 py-2 rounded-xl border ${
              sel ? 'bg-primary border-primary' : 'bg-white border-border'
            }`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: sel }}
          >
            <Text className={`text-sm font-medium ${sel ? 'text-white' : 'text-gray-700'}`}>
              {op.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Adiciona o valor se ausente, remove se presente — para usar com `onToggle`. */
export function alternarValor<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}
