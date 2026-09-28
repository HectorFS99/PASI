import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { InputField } from '../InputField';
import { TipoRespostaPicker } from './TipoRespostaPicker';
import { OpcoesEditor } from './OpcoesEditor';
import { FaixaNumericaFields } from './FaixaNumericaFields';
import { PerguntaDraft, TIPO_ESCALA, tipoRespostaLabel } from './perguntaDraft';
import { TipoPergunta } from '../../constants/dominio';
import { colors } from '../../constants/colors';

interface Props {
  draft: PerguntaDraft;
  onChange: (draft: PerguntaDraft) => void;
  onIncluir: () => void;
  incluindo?: boolean;
}

/** Bloco "Adicionar Pergunta": texto, tipo, campos do tipo e obrigatoriedade. */
export function PerguntaEditor({ draft, onChange, onIncluir, incluindo = false }: Props) {
  const set = <K extends keyof PerguntaDraft>(campo: K, valor: PerguntaDraft[K]) =>
    onChange({ ...draft, [campo]: valor });

  return (
    <>
      <Text className="text-primary font-bold text-sm mb-3">Adicionar Pergunta</Text>

      <InputField
        label="Texto da pergunta *"
        placeholder="Digite a pergunta..."
        value={draft.texto}
        onChangeText={(t) => set('texto', t)}
        multiline
        maxLength={500}
        counter
      />

      <Text className="text-sm font-medium text-gray-700 mb-2">Tipo de resposta *</Text>
      <TipoRespostaPicker value={draft.tipoId} onChange={(tipoId) => set('tipoId', tipoId)} />

      {/* Pré-visualização + campos específicos do tipo */}
      <View className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 mb-4">
        <Text className="text-xs text-gray-400 mb-2">
          Pré-visualização: {tipoRespostaLabel(draft.tipoId)}
        </Text>
        <CamposDoTipo draft={draft} set={set} />
      </View>

      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-sm text-gray-700">Pergunta obrigatória</Text>
        <Switch
          value={draft.obrigatoria}
          onValueChange={(v) => set('obrigatoria', v)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      <TouchableOpacity
        onPress={onIncluir}
        disabled={incluindo}
        className="h-12 bg-primary/10 border border-primary/30 rounded-2xl items-center justify-center mb-6"
      >
        {incluindo ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Text className="text-primary font-semibold">+ Incluir pergunta</Text>
        )}
      </TouchableOpacity>
    </>
  );
}

function CamposDoTipo({
  draft,
  set,
}: {
  draft: PerguntaDraft;
  set: <K extends keyof PerguntaDraft>(campo: K, valor: PerguntaDraft[K]) => void;
}) {
  switch (draft.tipoId) {
    case TipoPergunta.TEXTO:
      return (
        <TextInput
          className="bg-white border border-border rounded-xl px-4 py-3 text-sm text-gray-400"
          placeholder="O respondente digitará sua resposta aqui..."
          placeholderTextColor={colors.placeholder}
          multiline
          editable={false}
        />
      );

    case TipoPergunta.NUMERO:
      return (
        <>
          <TextInput
            className="bg-white border border-border rounded-xl px-4 h-11 text-sm text-gray-400 mb-3"
            placeholder="O respondente digitará um número..."
            placeholderTextColor={colors.placeholder}
            editable={false}
          />
          <FaixaNumericaFields
            min={draft.valorMin}
            max={draft.valorMax}
            onChangeMin={(v) => set('valorMin', v)}
            onChangeMax={(v) => set('valorMax', v)}
          />
        </>
      );

    case TipoPergunta.BOOLEANO:
      return (
        <View className="flex-row gap-2">
          {['Sim', 'Não'].map((label) => (
            <View
              key={label}
              className="flex-1 h-11 rounded-xl border border-border bg-white items-center justify-center"
            >
              <Text className="text-gray-400 text-sm">{label}</Text>
            </View>
          ))}
        </View>
      );

    case TipoPergunta.ESCOLHA_UNICA:
    case TipoPergunta.ESCOLHA_MULTIPLA:
      return (
        <OpcoesEditor
          opcoes={draft.opcoes}
          onChange={(opcoes) => set('opcoes', opcoes)}
          unica={draft.tipoId === TipoPergunta.ESCOLHA_UNICA}
        />
      );

    case TIPO_ESCALA:
      return (
        <>
          <View className="mb-2">
            <FaixaNumericaFields
              min={draft.valorMin}
              max={draft.valorMax}
              onChangeMin={(v) => set('valorMin', v)}
              onChangeMax={(v) => set('valorMax', v)}
              labelMin="Valor mínimo"
              labelMax="Valor máximo"
              placeholderMax="10"
            />
          </View>
          <View className="bg-white border border-border rounded-xl px-4 h-11 justify-center">
            <Text className="text-gray-400 text-sm italic">
              Escala de {draft.valorMin || '0'} a {draft.valorMax || '10'}
            </Text>
          </View>
        </>
      );

    default:
      return null;
  }
}
