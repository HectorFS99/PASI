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
import { MaterialIcons } from '@expo/vector-icons';
import { PacienteNavProp, PacienteStackParamList } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { atendimentosService, Atendimento, AtendimentoFormulario } from '../../services/atendimentos';
import { formulariosService } from '../../services/formularios';
import { formatProtocolo } from '../../utils/format';

type RouteT = RouteProp<PacienteStackParamList, 'FormulariosAtendimento'>;
type IconName = keyof typeof MaterialIcons.glyphMap;

function iconeFormulario(nome?: string): IconName {
  const n = (nome ?? '').toLowerCase();
  if (n.includes('cras') || n.includes('socioecon') || n.includes('triagem')) return 'home';
  if (n.includes('caps') || n.includes('mental') || n.includes('saúde')) return 'favorite';
  if (n.includes('creas') || n.includes('violação') || n.includes('direito')) return 'balance';
  return 'assignment';
}

export function FormulariosAtendimentoScreen() {
  const navigation = useNavigation<PacienteNavProp>();
  const { idAtendimento, descricao } = useRoute<RouteT>().params;
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const a = await atendimentosService.buscar(idAtendimento);
      setAtendimento(a);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os formulários.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [idAtendimento]);

  useEffect(() => { load(); }, [load]);

  const iniciarFormulario = async (af: AtendimentoFormulario) => {
    try {
      await formulariosService.iniciar(idAtendimento, af.id_formulario);
      navigation.navigate('ResponderFormulario', {
        idAtendimento,
        idFormulario: af.id_formulario,
        nomeFormulario: af.formulario.nome ?? 'Formulário',
      });
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível iniciar o formulário.');
    }
  };

  if (loading || !atendimento) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#0D2347" />
      </View>
    );
  }

  const formularios = atendimento.atendimento_formulario;
  const total = formularios.length;
  const respondidos = formularios.filter(
    (af) => af.status_formulario_paciente?.id_situacao_formulario === 2,
  ).length;
  const pendentes = total - respondidos;
  const progresso = total > 0 ? respondidos / total : 0;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-3 self-start">
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Formulários</Text>
        <Text className="text-white/70 text-sm">
          Protocolo {formatProtocolo(idAtendimento, atendimento.dt_cadastro)}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Progresso */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-medium text-gray-700">Progresso do atendimento</Text>
          <Text className="text-sm font-bold text-primary">{respondidos}/{total}</Text>
        </View>
        <View className="h-2 bg-gray-100 rounded-full mb-2">
          <View
            className="h-2 bg-green-500 rounded-full"
            style={{ width: `${progresso * 100}%` }}
          />
        </View>
        {pendentes > 0 && (
          <Text className="text-xs text-orange-600 mb-6">
            {pendentes} formulário{pendentes !== 1 ? 's' : ''} pendente{pendentes !== 1 ? 's' : ''}
          </Text>
        )}

        {/* Cards de formulários */}
        {formularios.map((af) => {
          const situacaoId = af.status_formulario_paciente?.id_situacao_formulario ?? 1;
          const respondido = situacaoId === 2;
          const iconName = iconeFormulario(af.formulario.nome);

          return (
            <View key={af.id_atendimento_formulario} className="bg-white border border-border rounded-2xl p-4 mb-3" style={{ elevation: 1 }}>
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <MaterialIcons name={iconName} size={26} color="#0D2347" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">{af.formulario.nome}</Text>
                  <Text className="text-xs text-muted mt-0.5" numberOfLines={2}>{af.formulario.descricao}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <StatusBadge status={situacaoId} variant="formulario" />
                {respondido ? (
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('ResponderFormulario', {
                        idAtendimento,
                        idFormulario: af.id_formulario,
                        nomeFormulario: af.formulario.nome ?? 'Formulário',
                      })
                    }
                    className="border border-border rounded-xl px-4 py-2"
                  >
                    <Text className="text-gray-600 text-sm">Ver</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => iniciarFormulario(af)}
                    className="bg-green-500 rounded-xl px-4 py-2"
                  >
                    <Text className="text-white text-sm font-semibold">Iniciar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
