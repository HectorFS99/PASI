import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface Props {
  label: string;
  checked: boolean;
  onToggle: () => void;
  /** Envolve o checkbox em um cartão com borda (usado nos filtros). */
  boxed?: boolean;
}

export function Checkbox({ label, checked, onToggle, boxed = false }: Props) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      className={`flex-row items-center ${
        boxed ? 'bg-gray-50 border border-border rounded-xl px-4 py-3' : ''
      }`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View
        className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
          checked ? 'bg-primary border-primary' : 'bg-white border-gray-300'
        }`}
      >
        {checked && <MaterialIcons name="check" size={12} color={colors.white} />}
      </View>
      <Text className="text-sm text-gray-700">{label}</Text>
    </TouchableOpacity>
  );
}
