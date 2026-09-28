import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfissionalNavProp, ProfissionalStackParamList } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { ScreenHeader } from '../../components/ScreenHeader';
import { FormFooter } from '../../components/FormFooter';
import { atendimentosService, Atendimento, AtendimentoFormulario } from '../../services/atendimentos';
import { avaliacoesService } from '../../services/avaliacoes';
import { useFeedback } from '../../context/FeedbackContext';
import { SituacaoFormulario } from '../../constants/dominio';
import { colors } from '../../constants/colors';
import { formatData, maskCpf } from '../../utils/format';
import { mensagemErroApi } from '../../utils/errors';

type RouteT = RouteProp<ProfissionalStackParamList, 'DetalhesAtendimento'>;

export function DetalhesAtendimentoScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const { toast, confirm } = useFeedback();
  const { id } = useRoute<RouteT>().params;
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const a = await atendimentosService.buscar(id);
      setAtendimento(a);
    } catch {
      toast('Não foi possível carregar o atendimento.', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Inicia a análise (marca "Em avaliação") e abre a tela de avaliação.
  const iniciarAvaliacao = async (af: AtendimentoFormulario) => {
    const ok = await confirm({
      title: 'Iniciar avaliação',
      message: `Deseja iniciar a avaliação do formulário "${af.formulario.nome}"?`,
      confirmLabel: 'Iniciar avaliação',
    });
    if (!ok) return;
    try {
      await avaliacoesService.iniciar(id, af.id_formulario);
      navigation.navigate('AvaliarFormulario', {
        idAtendimento: id,
        idFormulario: af.id_formulario,
        nomeFormulario: af.formulario.nome,
        modo: 'avaliar',
      });
    } catch (err) {
      toast(mensagemErroApi(err, 'Não foi possível iniciar a avaliação.'), 'error');
    }
  };

  if (loading || !atendimento) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const paciente = atendimento.usuario_atendimento_id_usuario_pacienteTousuario;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Detalhes do Atendimento" onBack={() => navigation.goBack()} />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Status + protocolo */}
        <View className="flex-row items-center justify-between mb-6">
          <StatusBadge status={atendimento.id_situacao_atendimento} tooltip />
          <Text className="text-muted text-sm">
            #{String(atendimento.id_atendimento).padStart(4, '0')}
          </Text>
        </View>

        {/* Informações */}
        <Text className="text-base font-bold text-primary mb-4">Informações do Atendimento</Text>

        <View className="flex-row items-start mb-4">
          <MaterialIcons name="description" size={22} color={colors.gray500} style={{ marginRight: 12, marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-xs text-muted font-medium mb-0.5">Descrição</Text>
            <Text className="text-sm text-gray-800">{atendimento.descricao ?? '—'}</Text>
          </View>
        </View>

        <View className="flex-row items-start mb-4">
          <MaterialIcons name="person" size={22} color={colors.gray500} style={{ marginRight: 12, marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-xs text-muted font-medium mb-0.5">Paciente</Text>
            <Text className="text-sm text-gray-800 font-medium">{paciente.nome}</Text>
            <Text className="text-xs text-muted">CPF: {maskCpf(paciente.cpf)}</Text>
          </View>
        </View>

        <View className="flex-row items-start mb-6">
          <MaterialIcons name="event" size={22} color={colors.gray500} style={{ marginRight: 12, marginTop: 2 }} />
          <View className="flex-1">
            <Text className="text-xs text-muted font-medium mb-0.5">Data de criação</Text>
            <Text className="text-sm text-gray-800">{formatData(atendimento.dt_cadastro)}</Text>
          </View>
        </View>

        {/* Formulários */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-primary">Formulários Atribuídos</Text>
          <Text className="text-xs text-muted">{atendimento.atendimento_formulario.length} formulário{atendimento.atendimento_formulario.length !== 1 ? 's' : ''}</Text>
        </View>

        {atendimento.atendimento_formulario.map((af) => {
          const fp = af.status_formulario_paciente;
          const situacaoId = fp?.id_situacao_formulario ?? SituacaoFormulario.RASCUNHO;
          return (
            <View key={af.id_atendimento_formulario} className="bg-white border border-border rounded-2xl p-4 mb-3" style={{ elevation: 1 }}>
              <View className="flex-row items-start justify-between mb-3">
                <MaterialIcons name="assignment" size={22} color={colors.gray600} style={{ marginRight: 8, marginTop: 2 }} />
                <View className="flex-1 mr-2">
                  <Text className="text-sm font-semibold text-gray-800">{af.formulario.nome}</Text>
                  <Text className="text-xs text-muted mt-0.5" numberOfLines={2}>
                    {af.formulario.descricao}
                  </Text>
                </View>
                <StatusBadge status={situacaoId} variant="formulario" tooltip />
              </View>

              <View className="flex-row gap-2">
                {/* Avaliar: só enquanto Respondido ou Em avaliação. Depois de Avaliado, some. */}
                {(situacaoId === SituacaoFormulario.RESPONDIDO ||
                  situacaoId === SituacaoFormulario.EM_AVALIACAO) && (
                  <TouchableOpacity
                    onPress={() => iniciarAvaliacao(af)}
                    className="flex-1 bg-primary/10 rounded-xl py-2 items-center"
                  >
                    <Text className="text-primary text-xs font-medium">Avaliar respostas</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    // Respondido (ou além) → mostra o formulário respondido;
                    // caso contrário, exibe o template com inputs desabilitados.
                    if (situacaoId >= SituacaoFormulario.RESPONDIDO) {
                      navigation.navigate('AvaliarFormulario', {
                        idAtendimento: id,
                        idFormulario: af.id_formulario,
                        nomeFormulario: af.formulario.nome,
                        modo: 'visualizar',
                      });
                    } else {
                      navigation.navigate('DetalhesFormulario', { id: af.id_formulario });
                    }
                  }}
                  className="flex-1 border border-border rounded-xl py-2 items-center"
                >
                  <Text className="text-gray-600 text-xs">Visualizar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Botão fixo */}
      <FormFooter>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="border border-border rounded-xl py-3 items-center"
        >
          <Text className="text-gray-700 text-sm font-medium">Voltar</Text>
        </TouchableOpacity>
      </FormFooter>
    </View>
  );
}
