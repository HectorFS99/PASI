import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ProfissionalNavProp, ProfissionalStackParamList } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { atendimentosService, Atendimento } from '../../services/atendimentos';
import { formatProtocolo, formatData, maskCpf } from '../../utils/format';

type RouteT = RouteProp<ProfissionalStackParamList, 'DetalhesAtendimento'>;

export function DetalhesAtendimentoScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const { id } = useRoute<RouteT>().params;
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const a = await atendimentosService.buscar(id);
      setAtendimento(a);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o atendimento.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading || !atendimento) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#0D2347" />
      </View>
    );
  }

  const paciente = atendimento.usuario_atendimento_id_usuario_pacienteTousuario;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-3 self-start">
          <Text className="text-white text-2xl">← Detalhes do Atendimento</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Status + protocolo */}
        <View className="flex-row items-center justify-between mb-6">
          <StatusBadge status={atendimento.id_situacao_atendimento} />
          <Text className="text-muted text-sm">
            #{String(atendimento.id_atendimento).padStart(4, '0')}
          </Text>
        </View>

        {/* Informações */}
        <Text className="text-base font-bold text-primary mb-4">Informações do Atendimento</Text>

        <View className="flex-row items-start mb-4">
          <Text className="text-lg mr-3">📄</Text>
          <View className="flex-1">
            <Text className="text-xs text-muted font-medium mb-0.5">Descrição</Text>
            <Text className="text-sm text-gray-800">{atendimento.descricao ?? '—'}</Text>
          </View>
        </View>

        <View className="flex-row items-start mb-4">
          <Text className="text-lg mr-3">👤</Text>
          <View className="flex-1">
            <Text className="text-xs text-muted font-medium mb-0.5">Paciente</Text>
            <Text className="text-sm text-gray-800 font-medium">{paciente.nome}</Text>
            <Text className="text-xs text-muted">CPF: {maskCpf(paciente.cpf)}</Text>
          </View>
        </View>

        <View className="flex-row items-start mb-6">
          <Text className="text-lg mr-3">📅</Text>
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
          const situacaoId = fp?.id_situacao_formulario ?? 1;
          return (
            <View key={af.id_atendimento_formulario} className="bg-white border border-border rounded-2xl p-4 mb-3" style={{ elevation: 1 }}>
              <View className="flex-row items-start justify-between mb-3">
                <Text className="text-lg mr-2">📋</Text>
                <View className="flex-1 mr-2">
                  <Text className="text-sm font-semibold text-gray-800">{af.formulario.nome}</Text>
                  <Text className="text-xs text-muted mt-0.5" numberOfLines={2}>
                    {af.formulario.descricao}
                  </Text>
                </View>
                <StatusBadge status={situacaoId} variant="formulario" />
              </View>

              <View className="flex-row gap-2">
                {situacaoId === 2 && (
                  <TouchableOpacity className="flex-1 bg-primary/10 rounded-xl py-2 items-center">
                    <Text className="text-primary text-xs font-medium">Avaliar respostas</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity className="flex-1 border border-border rounded-xl py-2 items-center">
                  <Text className="text-gray-600 text-xs">Visualizar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="border border-border rounded-xl py-3 items-center mt-4"
        >
          <Text className="text-gray-700 text-sm font-medium">Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
