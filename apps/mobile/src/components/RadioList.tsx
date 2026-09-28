import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface RadioOption<T> {
  value: T;
  label: string;
}

interface Props<T> {
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Lista de opções exclusivas (ex.: ordenação). */
export function RadioList<T extends string | number>({ options, value, onChange }: Props<T>) {
  return (
    <View>
      {options.map((op) => {
        const sel = value === op.value;
        return (
          <TouchableOpacity
            key={String(op.value)}
            onPress={() => onChange(op.value)}
            className={`flex-row items-center px-4 py-3 rounded-xl mb-2 border ${
              sel ? 'bg-primary/5 border-primary' : 'bg-white border-border'
            }`}
            accessibilityRole="radio"
            accessibilityState={{ checked: sel }}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                sel ? 'border-primary' : 'border-gray-300'
              }`}
            >
              {sel && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </View>
            <Text className={`text-sm ${sel ? 'text-primary font-medium' : 'text-gray-700'}`}>
              {op.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
