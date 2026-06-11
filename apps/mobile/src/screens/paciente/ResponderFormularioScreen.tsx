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
import { PacienteNavProp, PacienteStackParamList } from '../../navigation/types';
import { PrimaryButton } from '../../components/PrimaryButton';
import { MaterialIcons } from '@expo/vector-icons';
import { formulariosService, Pergunta, RespostaItem, DetalheFormulario } from '../../services/formularios';
import { useFeedback } from '../../context/FeedbackContext';

type RouteT = RouteProp<PacienteStackParamList, 'ResponderFormulario'>;

// Tipo de pergunta (espelha as constantes da API)
const TEXTO = 1;
const NUMERO = 2;
const BOOLEANO = 3;
const ESCOLHA_UNICA = 4;
const ESCOLHA_MULTIPLA = 5;

type RespostasMap = Record<number, RespostaItem>;

function initRespostas(perguntas: Pergunta[], respostasAtuais: DetalheFormulario['respostas']): RespostasMap {
  const map: RespostasMap = {};
  for (const p of perguntas) {
    const existente = respostasAtuais.find((r) => r.id_pergunta === p.id_pergunta);
    if (existente) {
      map[p.id_pergunta] = {
        id_pergunta: p.id_pergunta,
        valor_texto: existente.valor_texto,
        valor_numero: existente.valor_numero,
        valor_binario: existente.valor_binario,
        valor_data: existente.valor_data,
      };
    } else {
      map[p.id_pergunta] = { id_pergunta: p.id_pergunta };
    }
  }
  return map;
}

export function ResponderFormularioScreen() {
  const navigation = useNavigation<PacienteNavProp>();
  const { toast } = useFeedback();
  const { idAtendimento, idFormulario, nomeFormulario } = useRoute<RouteT>().params;

  const [detalhe, setDetalhe] = useState<DetalheFormulario | null>(null);
  const [respostas, setRespostas] = useState<RespostasMap>({});
  const [opcoesSelecionadas, setOpcoesSelecionadas] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await formulariosService.detalhar(idAtendimento, idFormulario);
      setDetalhe(d);
      setRespostas(initRespostas(d.formulario.pergunta, d.respostas));

      // Inicializar opções selecionadas a partir de respostas existentes
      const opcs: Record<number, number[]> = {};
      for (const r of d.respostas) {
        // Para escolhas, o backend devolve valor_numero = id_opcao (uma linha por opção)
        if (r.valor_numero !== undefined && r.valor_numero !== null) {
          const p = d.formulario.pergunta.find((p) => p.id_pergunta === r.id_pergunta);
          if (p && [ESCOLHA_UNICA, ESCOLHA_MULTIPLA].includes(p.id_tipo_pergunta)) {
            if (!opcs[r.id_pergunta]) opcs[r.id_pergunta] = [];
            opcs[r.id_pergunta].push(r.valor_numero);
          }
        }
      }
      setOpcoesSelecionadas(opcs);
    } catch {
      toast('Não foi possível carregar o formulário.', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [idAtendimento, idFormulario]);

  useEffect(() => { load(); }, [load]);

  const setResposta = (idPergunta: number, campo: Partial<RespostaItem>) => {
    setRespostas((prev) => ({
      ...prev,
      [idPergunta]: { ...prev[idPergunta], ...campo },
    }));
  };

  const toggleOpcao = (idPergunta: number, idOpcao: number, unica: boolean) => {
    setOpcoesSelecionadas((prev) => {
      const atual = prev[idPergunta] ?? [];
      let next: number[];
      if (unica) {
        next = [idOpcao];
      } else {
        next = atual.includes(idOpcao) ? atual.filter((o) => o !== idOpcao) : [...atual, idOpcao];
      }
      return { ...prev, [idPergunta]: next };
    });
  };

  const buildPayload = (): RespostaItem[] => {
    if (!detalhe) return [];
    return detalhe.formulario.pergunta.map((p) => {
      const r = respostas[p.id_pergunta] ?? { id_pergunta: p.id_pergunta };
      if ([ESCOLHA_UNICA, ESCOLHA_MULTIPLA].includes(p.id_tipo_pergunta)) {
        return { id_pergunta: p.id_pergunta, id_opcoes: opcoesSelecionadas[p.id_pergunta] ?? [] };
      }
      return r;
    });
  };

  const salvarRascunho = async () => {
    setSaving(true);
    try {
      await formulariosService.salvar(idAtendimento, idFormulario, buildPayload());
      toast('Respostas salvas como rascunho.', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Não foi possível salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const enviar = async () => {
    setSending(true);
    try {
      await formulariosService.salvar(idAtendimento, idFormulario, buildPayload());
      await formulariosService.concluir(idAtendimento, idFormulario);
      toast('Formulário enviado com sucesso!', 'success');
      navigation.goBack();
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Não foi possível enviar.', 'error');
    } finally {
      setSending(false);
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
  const respondidas = Object.values(respostas).filter(
    (r) => r.valor_texto !== undefined || r.valor_numero !== undefined || r.valor_binario !== undefined,
  ).length + Object.values(opcoesSelecionadas).filter((o) => o.length > 0).length;
  const progresso = perguntas.length > 0 ? Math.min(respondidas / perguntas.length, 1) : 0;
  const concluido = detalhe.formulario_paciente?.id_situacao_formulario === 2;

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header com progresso */}
      <View className="bg-primary px-6 pt-14 pb-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-2 self-start flex-row items-center gap-1.5">
          <MaterialIcons name="arrow-back" size={20} color="white" />
          <Text className="text-white text-base">{nomeFormulario}</Text>
        </TouchableOpacity>
        <Text className="text-white/70 text-xs mb-2">
          {respondidas} de {perguntas.length} respondidas
        </Text>
        <View className="h-1.5 bg-white/20 rounded-full">
          <View className="h-1.5 bg-white rounded-full" style={{ width: `${progresso * 100}%` }} />
        </View>
      </View>

      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Descrição do formulário */}
        {detalhe.formulario.descricao && (
          <Text className="text-sm text-gray-600 mb-4 leading-5">{detalhe.formulario.descricao}</Text>
        )}

        {/* Perguntas */}
        {perguntas.map((p, index) => (
          <View key={p.id_pergunta} className="mb-6">
            <View className="flex-row items-start mb-3">
              <View className="w-7 h-7 rounded-full bg-primary items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs font-bold">{index + 1}</Text>
              </View>
              <Text className="flex-1 text-sm font-medium text-gray-800 leading-5">
                {p.pergunta}
                {p.obrigatoria && <Text className="text-red-400"> *</Text>}
              </Text>
            </View>

            {/* TEXTO */}
            {p.id_tipo_pergunta === TEXTO && (
              <TextInput
                className="bg-input-bg border border-border rounded-xl px-4 py-3 text-sm text-gray-800"
                placeholder="Digite sua resposta..."
                placeholderTextColor="#A0AEC0"
                value={respostas[p.id_pergunta]?.valor_texto ?? ''}
                onChangeText={(t) => setResposta(p.id_pergunta, { valor_texto: t })}
                multiline
                editable={!concluido}
              />
            )}

            {/* NUMERO */}
            {p.id_tipo_pergunta === NUMERO && (
              <TextInput
                className="bg-input-bg border border-border rounded-xl px-4 h-12 text-sm text-gray-800"
                placeholder="Digite um número"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                value={respostas[p.id_pergunta]?.valor_numero?.toString() ?? ''}
                onChangeText={(t) => setResposta(p.id_pergunta, { valor_numero: t ? Number(t) : undefined })}
                editable={!concluido}
              />
            )}

            {/* BOOLEANO */}
            {p.id_tipo_pergunta === BOOLEANO && (
              <View className="flex-row gap-3">
                {[{ label: 'Sim', value: true }, { label: 'Não', value: false }].map((opt) => {
                  const sel = respostas[p.id_pergunta]?.valor_binario === opt.value;
                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      disabled={concluido}
                      onPress={() => setResposta(p.id_pergunta, { valor_binario: opt.value })}
                      className={`flex-1 h-11 rounded-xl border items-center justify-center ${sel ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                    >
                      <Text className={`text-sm font-medium ${sel ? 'text-white' : 'text-gray-600'}`}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ESCOLHA_UNICA / ESCOLHA_MULTIPLA */}
            {[ESCOLHA_UNICA, ESCOLHA_MULTIPLA].includes(p.id_tipo_pergunta) &&
              p.opcao_pergunta.map((op) => {
                const sel = (opcoesSelecionadas[p.id_pergunta] ?? []).includes(op.id_opcao);
                return (
                  <TouchableOpacity
                    key={op.id_opcao}
                    disabled={concluido}
                    onPress={() => toggleOpcao(p.id_pergunta, op.id_opcao, p.id_tipo_pergunta === ESCOLHA_UNICA)}
                    className={`flex-row items-center p-4 rounded-xl mb-2 border ${sel ? 'bg-primary/5 border-primary' : 'border-border bg-white'}`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${sel ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                      {sel && <View className="w-2 h-2 rounded-full bg-white" />}
                    </View>
                    <Text className={`text-sm ${sel ? 'text-primary font-medium' : 'text-gray-700'}`}>
                      {op.texto_opcao}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
        ))}

        {/* Botões */}
        {!concluido && (
          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <PrimaryButton label="Salvar rascunho" onPress={salvarRascunho} loading={saving} variant="outlined" />
            </View>
            <View className="flex-1">
              <PrimaryButton label="Enviar" onPress={enviar} loading={sending} />
            </View>
          </View>
        )}
        {concluido && (
          <View className="bg-success-bg border border-success-border rounded-xl p-4 mt-4">
            <View className="flex-row items-center justify-center gap-1.5">
              <MaterialIcons name="check-circle" size={16} color="#276749" />
              <Text className="text-success-text text-sm font-medium">Formulário enviado — obrigado!</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
