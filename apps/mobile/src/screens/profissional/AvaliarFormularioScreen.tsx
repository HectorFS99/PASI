import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfissionalNavProp, ProfissionalStackParamList } from '../../navigation/types';
import { FormFooter } from '../../components/FormFooter';
import { PrimaryButton } from '../../components/PrimaryButton';
import {
  formulariosService,
  Pergunta,
  RespostaAtual,
  DetalheFormulario,
} from '../../services/formularios';
import { avaliacoesService } from '../../services/avaliacoes';
import { useFeedback } from '../../context/FeedbackContext';

type RouteT = RouteProp<ProfissionalStackParamList, 'AvaliarFormulario'>;

const TEXTO = 1;
const NUMERO = 2;
const BOOLEANO = 3;
const ESCOLHA_UNICA = 4;
const ESCOLHA_MULTIPLA = 5;

const MAX_OBS = 500;

export function AvaliarFormularioScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const insets = useSafeAreaInsets();
  const { toast, confirm } = useFeedback();
  const { idAtendimento, idFormulario, nomeFormulario, modo } = useRoute<RouteT>().params;
  const ehAvaliar = modo === 'avaliar';

  const [detalhe, setDetalhe] = useState<DetalheFormulario | null>(null);
  const [loading, setLoading] = useState(true);
  const [observacao, setObservacao] = useState('');
  const [erroObs, setErroObs] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await formulariosService.detalhar(idAtendimento, idFormulario);
      setDetalhe(d);
    } catch {
      toast('Não foi possível carregar o formulário.', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [idAtendimento, idFormulario]);

  useEffect(() => {
    load();
  }, [load]);

  const finalizar = async () => {
    if (!observacao.trim()) {
      setErroObs('A observação da avaliação é obrigatória.');
      return;
    }
    const ok = await confirm({
      title: 'Finalizar avaliação',
      message:
        'Após finalizar, a avaliação será registrada e não será possível avaliar este formulário novamente. Deseja continuar?',
      confirmLabel: 'Finalizar avaliação',
    });
    if (!ok) return;
    setSaving(true);
    try {
      await avaliacoesService.avaliar(idAtendimento, idFormulario, observacao.trim());
      toast('Avaliação registrada com sucesso!', 'success');
      navigation.goBack();
    } catch (err: any) {
      toast(
        err?.response?.data?.message ?? 'Não foi possível registrar a avaliação.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !detalhe) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#0D2347" />
      </View>
    );
  }

  const perguntas = detalhe.formulario.pergunta;

  // Agrupa as respostas por pergunta (escolha múltipla tem 1+ linhas).
  const respostasPorPergunta = new Map<number, RespostaAtual[]>();
  for (const r of detalhe.respostas) {
    const arr = respostasPorPergunta.get(r.id_pergunta) ?? [];
    arr.push(r);
    respostasPorPergunta.set(r.id_pergunta, arr);
  }

  const renderResposta = (p: Pergunta) => {
    const rs = respostasPorPergunta.get(p.id_pergunta) ?? [];
    if (rs.length === 0) {
      return <Text className="text-sm text-muted italic">Sem resposta</Text>;
    }

    if ([ESCOLHA_UNICA, ESCOLHA_MULTIPLA].includes(p.id_tipo_pergunta)) {
      return (
        <View className="gap-1">
          {rs.map((r, i) => (
            <View key={i} className="flex-row items-center">
              <MaterialIcons name="check-circle" size={16} color="#16A34A" style={{ marginRight: 8 }} />
              <Text className="text-sm text-gray-800 flex-1">{r.valor_texto ?? '—'}</Text>
            </View>
          ))}
        </View>
      );
    }

    const r = rs[0];
    if (p.id_tipo_pergunta === BOOLEANO) {
      return (
        <Text className="text-sm font-medium text-gray-800">
          {r.valor_binario ? 'Sim' : 'Não'}
        </Text>
      );
    }
    if (p.id_tipo_pergunta === NUMERO) {
      return (
        <Text className="text-sm font-medium text-gray-800">
          {r.valor_numero !== undefined && r.valor_numero !== null ? String(r.valor_numero) : '—'}
        </Text>
      );
    }
    return <Text className="text-sm text-gray-800">{r.valor_texto ?? '—'}</Text>;
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View className="bg-primary px-6" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: 16 }}>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold" numberOfLines={1}>
              {ehAvaliar ? 'Avaliar Formulário' : 'Visualizar Respostas'}
            </Text>
            {nomeFormulario ? (
              <Text className="text-white/70 text-xs" numberOfLines={1}>{nomeFormulario}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {detalhe.formulario.descricao ? (
          <Text className="text-sm text-gray-600 mb-4 leading-5">{detalhe.formulario.descricao}</Text>
        ) : null}

        <Text className="text-primary font-semibold text-sm mb-3">
          Respostas do paciente ({perguntas.length})
        </Text>

        {perguntas.map((p, index) => (
          <View key={p.id_pergunta} className="bg-white border border-border rounded-2xl p-4 mb-3">
            <View className="flex-row items-start mb-2">
              <View className="w-7 h-7 rounded-full bg-primary items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <Text className="text-white text-xs font-bold">{index + 1}</Text>
              </View>
              <Text className="flex-1 text-sm font-medium text-gray-800 leading-5">{p.pergunta}</Text>
            </View>
            <View className="pl-10">{renderResposta(p)}</View>
          </View>
        ))}

        {perguntas.length === 0 && (
          <Text className="text-center text-muted mt-4">Nenhuma pergunta cadastrada.</Text>
        )}

        {/* Observação da avaliação (obrigatória) */}
        {ehAvaliar && (
          <View className="mt-4">
            <Text className="text-primary font-semibold text-sm mb-1">Observação da avaliação *</Text>
            <Text className="text-xs text-muted mb-2">
              Registre sua observação final sobre as respostas (obrigatório).
            </Text>
            <TextInput
              className={`bg-input-bg border rounded-xl px-4 py-3 text-sm text-gray-800 ${
                erroObs ? 'border-red-400' : 'border-border'
              }`}
              placeholder="Descreva sua avaliação..."
              placeholderTextColor="#A0AEC0"
              value={observacao}
              onChangeText={(t) => {
                setObservacao(t.slice(0, MAX_OBS));
                if (erroObs) setErroObs('');
              }}
              multiline
              numberOfLines={5}
              maxLength={MAX_OBS}
              textAlignVertical="top"
              style={{ minHeight: 110 }}
            />
            <View className="flex-row justify-between mt-1">
              {erroObs ? (
                <Text className="text-red-500 text-xs">{erroObs}</Text>
              ) : (
                <View />
              )}
              <Text className="text-muted text-xs">{observacao.length}/{MAX_OBS}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botões fixos */}
      <FormFooter>
        {ehAvaliar ? (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton label="Cancelar" onPress={() => navigation.goBack()} variant="outlined" />
            </View>
            <View className="flex-1">
              <PrimaryButton label="Finalizar avaliação" onPress={finalizar} loading={saving} />
            </View>
          </View>
        ) : (
          <PrimaryButton label="Voltar" onPress={() => navigation.goBack()} variant="outlined" />
        )}
      </FormFooter>
    </KeyboardAvoidingView>
  );
}
