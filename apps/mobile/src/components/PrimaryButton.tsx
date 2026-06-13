import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined';
  loading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'filled',
  loading = false,
  disabled = false,
}: Props) {
  const isFilled = variant === 'filled';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-12 rounded-xl items-center justify-center mt-2 ${
        isFilled
          ? 'bg-primary'
          : 'bg-white border-2 border-primary'
      } ${disabled || loading ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={isFilled ? '#fff' : '#0D2347'} />
      ) : (
        <Text
          className={`font-semibold text-base ${isFilled ? 'text-white' : 'text-primary'}`}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
