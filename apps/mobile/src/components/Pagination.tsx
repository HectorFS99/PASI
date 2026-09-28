import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Navegação "Anterior · página/total · Próximo". Não renderiza nada com uma página só. */
export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const podeVoltar = page > 1;
  const podeAvancar = page < totalPages;

  return (
    <View className="flex-row items-center justify-center gap-4 mt-2">
      <PageButton
        label="Anterior"
        icon="chevron-left"
        enabled={podeVoltar}
        onPress={() => onChange(page - 1)}
      />
      <Text className="text-muted text-sm">
        {page}/{totalPages}
      </Text>
      <PageButton
        label="Próximo"
        icon="chevron-right"
        iconRight
        enabled={podeAvancar}
        onPress={() => onChange(page + 1)}
      />
    </View>
  );
}

function PageButton({
  label,
  icon,
  iconRight = false,
  enabled,
  onPress,
}: {
  label: string;
  icon: 'chevron-left' | 'chevron-right';
  iconRight?: boolean;
  enabled: boolean;
  onPress: () => void;
}) {
  const cor = enabled ? colors.primary : colors.gray300;
  const iconEl = <MaterialIcons name={icon} size={16} color={cor} />;
  return (
    <TouchableOpacity
      disabled={!enabled}
      onPress={onPress}
      className={`flex-row items-center gap-1 px-4 py-2 rounded-xl border ${
        enabled ? 'border-primary' : 'border-gray-200'
      }`}
    >
      {!iconRight && iconEl}
      <Text className={enabled ? 'text-primary text-sm' : 'text-gray-300 text-sm'}>{label}</Text>
      {iconRight && iconEl}
    </TouchableOpacity>
  );
}
