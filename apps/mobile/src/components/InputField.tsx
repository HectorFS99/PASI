import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  secureToggle?: boolean;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  /** Exibe contador de caracteres (exige maxLength). */
  counter?: boolean;
}

export function InputField({
  label,
  error,
  secureToggle,
  secureTextEntry,
  leftIcon,
  disabled,
  editable,
  counter,
  maxLength,
  value,
  ...rest
}: Props) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);
  const isEditable = disabled ? false : editable;
  const mostraContador = counter && maxLength !== undefined && !disabled;
  const multiline = !!rest.multiline;

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <View
        className={`flex-row border rounded-xl px-4 ${multiline ? 'items-start py-3' : 'items-center h-12'} ${
          error ? 'border-red-400' : 'border-border'
        } ${disabled ? 'bg-gray-100' : 'bg-input-bg'}`}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          className={`flex-1 text-sm ${disabled ? 'text-gray-400' : 'text-gray-800'}`}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          editable={isEditable}
          maxLength={maxLength}
          value={value}
          textAlignVertical={multiline ? 'top' : undefined}
          style={multiline ? { minHeight: 72 } : undefined}
          {...rest}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden((v) => !v)}>
            <Text className="text-muted text-xs">{hidden ? 'Mostrar' : 'Ocultar'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error || mostraContador ? (
        <View className="flex-row justify-between mt-1">
          {error ? <Text className="text-red-500 text-xs flex-1">{error}</Text> : <View className="flex-1" />}
          {mostraContador ? (
            <Text className="text-muted text-xs ml-2">
              {String(value ?? '').length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
