import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DateField } from './DateField';
import { colors } from '../constants/colors';

type IconName = keyof typeof MaterialIcons.glyphMap;

interface Props {
  visible: boolean;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
  title?: string;
  /** Seções de filtro (use FilterSection). */
  children: ReactNode;
}

/** Bottom sheet padrão de filtros e ordenação das listagens. */
export function FiltrosModal({
  visible,
  onClose,
  onClear,
  onApply,
  title = 'Filtros e Ordenação',
  children,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8" style={{ maxHeight: '90%' }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-primary font-bold text-base">{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar">
              <MaterialIcons name="close" size={22} color={colors.gray400} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>

          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={onClear}
              className="flex-1 h-12 border border-border rounded-2xl items-center justify-center"
            >
              <Text className="text-gray-600 font-medium">Limpar tudo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onApply}
              className="flex-1 h-12 bg-primary rounded-2xl items-center justify-center"
            >
              <Text className="text-white font-semibold">Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Bloco de filtro com ícone e título em caixa alta. */
export function FilterSection({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-1.5 mb-2">
        <MaterialIcons name={icon} size={14} color={colors.gray500} />
        <Text className="text-xs font-semibold text-gray-500 uppercase">{title}</Text>
      </View>
      {children}
    </View>
  );
}

/** Par de datas "De / Até" (formato dd/mm/aaaa). */
export function FilterDateRange({
  inicio,
  fim,
  onChangeInicio,
  onChangeFim,
}: {
  inicio: string;
  fim: string;
  onChangeInicio: (valor: string) => void;
  onChangeFim: (valor: string) => void;
}) {
  return (
    <View className="flex-row gap-3">
      <View className="flex-1">
        <DateField label="De" value={inicio} onChange={onChangeInicio} />
      </View>
      <View className="flex-1">
        <DateField label="Até" value={fim} onChange={onChangeFim} />
      </View>
    </View>
  );
}
