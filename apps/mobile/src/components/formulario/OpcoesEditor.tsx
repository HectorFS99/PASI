import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { OpcaoDraft, gerarKey } from './perguntaDraft';
import { colors } from '../../constants/colors';

interface Props {
  opcoes: OpcaoDraft[];
  onChange: (opcoes: OpcaoDraft[]) => void;
  /** Marcador redondo (seleção única) ou quadrado (múltipla escolha). */
  unica: boolean;
  /** Quantidade mínima de opções (abaixo disso não mostra o botão de remover). */
  minimo?: number;
}

/** Lista editável das opções de uma pergunta de escolha. */
export function OpcoesEditor({ opcoes, onChange, unica, minimo = 2 }: Props) {
  const atualizar = (key: string, texto: string) =>
    onChange(opcoes.map((o) => (o.key === key ? { ...o, texto } : o)));
  const remover = (key: string) => onChange(opcoes.filter((o) => o.key !== key));
  const adicionar = () => onChange([...opcoes, { key: gerarKey(), texto: '' }]);

  return (
    <>
      {opcoes.map((op, i) => (
        <View key={op.key} className="flex-row items-center mb-2">
          <View
            className={`w-4 h-4 ${unica ? 'rounded-full' : 'rounded'} border border-gray-300 mr-2 flex-shrink-0`}
          />
          <TextInput
            className="flex-1 bg-white border border-border rounded-xl px-3 h-9 text-sm text-gray-800"
            placeholder={`Opção ${i + 1}`}
            placeholderTextColor={colors.placeholder}
            value={op.texto}
            onChangeText={(t) => atualizar(op.key, t)}
            maxLength={255}
          />
          {opcoes.length > minimo && (
            <TouchableOpacity
              onPress={() => remover(op.key)}
              className="ml-2 p-1"
              accessibilityRole="button"
              accessibilityLabel={`Remover opção ${i + 1}`}
            >
              <MaterialIcons name="close" size={16} color={colors.dangerLight} />
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity onPress={adicionar} className="flex-row items-center mt-1">
        <Text className="text-primary text-sm font-medium">+ Adicionar opção</Text>
      </TouchableOpacity>
    </>
  );
}
