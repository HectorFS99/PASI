import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  secureToggle?: boolean;
  leftIcon?: React.ReactNode;
}

export function InputField({ label, error, secureToggle, secureTextEntry, leftIcon, ...rest }: Props) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <View
        className={`flex-row items-center bg-input-bg border rounded-xl px-4 h-12 ${
          error ? 'border-red-400' : 'border-border'
        }`}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-sm text-gray-800"
          placeholderTextColor="#A0AEC0"
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          {...rest}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden((v) => !v)}>
            <Text className="text-muted text-xs">{hidden ? 'Mostrar' : 'Ocultar'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text className="text-red-500 text-xs mt-1">{error}</Text> : null}
    </View>
  );
}
