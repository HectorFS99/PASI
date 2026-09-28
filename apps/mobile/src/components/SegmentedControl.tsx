import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface SegmentOption<T> {
  value: T;
  label: string;
}

interface Props<T> {
  label?: string;
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
  error?: string;
}

/** Botões lado a lado de escolha única (ex.: sexo). */
export function SegmentedControl<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  error,
}: Props<T>) {
  return (
    <View className="mb-4">
      {label ? <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text> : null}
      <View className="flex-row gap-2">
        {options.map((op) => {
          const sel = value === op.value;
          return (
            <TouchableOpacity
              key={String(op.value)}
              disabled={disabled}
              onPress={() => onChange(op.value)}
              className={`flex-1 h-11 rounded-xl border items-center justify-center ${
                sel ? 'bg-primary border-primary' : `bg-white ${error ? 'border-red-400' : 'border-border'}`
              }`}
              accessibilityRole="radio"
              accessibilityState={{ checked: sel, disabled }}
            >
              <Text className={`text-sm font-medium ${sel ? 'text-white' : 'text-gray-600'}`}>
                {op.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text className="text-red-500 text-xs mt-1">{error}</Text> : null}
    </View>
  );
}
