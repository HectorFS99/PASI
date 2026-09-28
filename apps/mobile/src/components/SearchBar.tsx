import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface Props {
  value: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
  /** Se informado, exibe o botão de filtros ao lado da busca. */
  onFilterPress?: () => void;
  /** Destaca o botão de filtros quando há filtro aplicado. */
  filterActive?: boolean;
}

/** Busca + botão de filtros, para uso dentro do ScreenHeader (fundo azul). */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  onFilterPress,
  filterActive = false,
}: Props) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-1 flex-row items-center bg-white/15 rounded-xl px-3 h-10">
        <MaterialIcons
          name="search"
          size={18}
          color="rgba(255,255,255,0.6)"
          style={{ marginRight: 8 }}
        />
        <TextInput
          className="flex-1 text-white text-sm"
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={value}
          onChangeText={onChangeText}
          autoCorrect={false}
        />
      </View>
      {onFilterPress && (
        <TouchableOpacity
          onPress={onFilterPress}
          className={`w-10 h-10 rounded-xl items-center justify-center ${
            filterActive ? 'bg-green-500' : 'bg-white/15'
          }`}
          accessibilityRole="button"
          accessibilityLabel={filterActive ? 'Filtros (ativos)' : 'Filtros'}
        >
          <MaterialIcons name="tune" size={20} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}
