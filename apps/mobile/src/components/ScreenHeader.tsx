import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface Props {
  title?: string;
  subtitle?: string;
  /** Exibe a seta de voltar. */
  onBack?: () => void;
  /** Exibe o botão de menu (telas iniciais). Ignorado se `onBack` for informado. */
  onMenu?: () => void;
  /** Conteúdo à direita do título (ex.: botão "Novo", badge de status). */
  right?: ReactNode;
  /** Conteúdo abaixo do título (ex.: busca, barra de progresso, logo). */
  children?: ReactNode;
  /**
   * `default`: título compacto em linha com o botão (telas internas).
   * `large`: seta acima e título maior (fluxo de login/cadastro).
   */
  variant?: 'default' | 'large';
}

/** Cabeçalho azul padrão das telas, já respeitando a área segura do topo. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  onMenu,
  right,
  children,
  variant = 'default',
}: Props) {
  const insets = useSafeAreaInsets();

  if (variant === 'large') {
    return (
      <View className="bg-primary px-6 pb-4" style={{ paddingTop: Math.max(insets.top + 16, 56) }}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            className="mb-3 self-start p-1"
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
        {title ? <Text className="text-white text-xl font-bold">{title}</Text> : null}
        {subtitle ? <Text className="text-white/70 text-sm">{subtitle}</Text> : null}
        {children}
      </View>
    );
  }

  const acao = onBack
    ? { icon: 'arrow-back' as const, onPress: onBack, label: 'Voltar' }
    : onMenu
      ? { icon: 'menu' as const, onPress: onMenu, label: 'Abrir menu' }
      : null;

  return (
    <View className="bg-primary px-5 pb-4" style={{ paddingTop: Math.max(insets.top, 16) }}>
      <View className="flex-row items-center gap-3">
        {acao && (
          <TouchableOpacity
            onPress={acao.onPress}
            className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={acao.label}
          >
            <MaterialIcons name={acao.icon} size={22} color={colors.white} />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          {title ? (
            <Text className="text-white text-lg font-bold" numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text className="text-white/70 text-xs" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children ? <View className="mt-3">{children}</View> : null}
    </View>
  );
}

/** Botão branco "+ Novo" usado à direita do cabeçalho das listagens. */
export function HeaderAddButton({ onPress, label = 'Novo' }: { onPress: () => void; label?: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-1 bg-white rounded-xl px-3 h-9"
    >
      <MaterialIcons name="add" size={18} color={colors.primary} />
      <Text className="text-primary text-sm font-semibold">{label}</Text>
    </TouchableOpacity>
  );
}
