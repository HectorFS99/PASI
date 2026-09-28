import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export interface SelectOption<T> {
  value: T;
  label: string;
}

interface Props<T> {
  label: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T | null) => void;
  placeholder?: string;
  error?: string;
}

/** Seletor (Picker) no mesmo padrão visual do InputField: label, borda e erro. */
export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecione',
  error,
}: Props<T>) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <View
        className={`bg-input-bg border rounded-xl ${error ? 'border-red-400' : 'border-border'}`}
      >
        <Picker selectedValue={value} onValueChange={(v) => onChange(v as T | null)}>
          <Picker.Item label={placeholder} value={null} />
          {options.map((op) => (
            <Picker.Item key={String(op.value)} label={op.label} value={op.value} />
          ))}
        </Picker>
      </View>
      {error ? <Text className="text-red-500 text-xs mt-1">{error}</Text> : null}
    </View>
  );
}
