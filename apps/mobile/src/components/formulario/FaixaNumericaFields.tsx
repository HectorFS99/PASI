import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { colors } from '../../constants/colors';

interface Props {
  min: string;
  max: string;
  onChangeMin: (valor: string) => void;
  onChangeMax: (valor: string) => void;
  labelMin?: string;
  labelMax?: string;
  placeholderMin?: string;
  placeholderMax?: string;
}

/** Par de campos "mínimo / máximo" para perguntas numéricas e escalas. */
export function FaixaNumericaFields({
  min,
  max,
  onChangeMin,
  onChangeMax,
  labelMin = 'Mínimo (opcional)',
  labelMax = 'Máximo (opcional)',
  placeholderMin = '0',
  placeholderMax = '100',
}: Props) {
  return (
    <View className="flex-row gap-3">
      <NumeroInput label={labelMin} placeholder={placeholderMin} value={min} onChange={onChangeMin} />
      <NumeroInput label={labelMax} placeholder={placeholderMax} value={max} onChange={onChangeMax} />
    </View>
  );
}

function NumeroInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <View className="flex-1">
      <Text className="text-xs text-gray-500 mb-1">{label}</Text>
      <TextInput
        className="bg-white border border-border rounded-xl px-3 h-10 text-sm text-gray-800"
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}
