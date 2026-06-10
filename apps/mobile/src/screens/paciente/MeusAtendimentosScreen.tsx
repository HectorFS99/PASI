import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PacienteNavProp } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { atendimentosService, Atendimento } from '../../services/atendimentos';
import { useAuth } from '../../context/AuthContext';
import { formatProtocolo, formatData } from '../../utils/format';

export function MeusAtendimentosScreen() {
  const navigation = useNavigation<PacienteNavProp>();
  const { usuario, logout } = useAuth();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const temPendentes = atendimentos.some((a) =>
    a.atendimento_formulario.some(
      (af) => !af.status_formulario_paciente || af.status_formulario_paciente.id_situacao_formulario !== 2,
    ),
  );

  const load = useCallback(async (p = 1, q = search) => {
    setLoading(true);
    try {
      const res = await atendimentosService.listar({ page: p, search: q || undefined });
      setAtendimentos(res.data);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar seus atendimentos.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(1, ''); }, []);

  const pendentesCount = (a: Atendimento) =>
    a.atendimento_formulario.filter(
      (af) => !af.status_formulario_paciente || af.status_formulario_paciente.id_situacao_formulario !== 2,
    ).length;

  const renderCard = ({ item }: { item: Atendimento }) => {
    const count = pendentesCount(item);
    const podeResponder = [1, 2, 3].includes(item.id_situacao_atendimento) && count > 0;

    return (
      <View className="bg-white rounded-2xl p-4 mb-3 border border-border" style={{ elevation: 1 }}>
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xs text-muted">{formatProtocolo(item.id_atendimento, item.dt_cadastro)}</Text>
          <StatusBadge status={item.id_situacao_atendimento} />
        </View>
        <Text className="text-sm font-semibold text-primary mb-0.5" numberOfLines={2}>
          {item.descricao ?? 'Atendimento'}
        </Text>
        <Text className="text-xs text-muted mb-3">{formatData(item.dt_cadastro)}</Text>

        {podeResponder ? (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('FormulariosAtendimento', {
                idAtendimento: item.id_atendimento,
                descricao: item.descricao ?? 'Atendimento',
              })
            }
            className="bg-green-500 rounded-xl py-3 items-center"
          >
            <Text className="text-white text-sm font-semibold">
              ✏ Responder formulários ({count})
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('FormulariosAtendimento', {
                idAtendimento: item.id_atendimento,
                descricao: item.descricao ?? 'Atendimento',
              })
            }
            className="border border-border rounded-xl py-3 items-center"
          >
            <Text className="text-gray-600 text-sm">Visualizar detalhes</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary px-5 pt-14 pb-5">
        <View className="flex-row items-center gap-3 mb-3">
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <Text className="text-white text-base">👤</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white/70 text-xs">Olá,</Text>
            <Text className="text-white text-sm font-semibold" numberOfLines={1}>
              {usuario?.nome}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} className="bg-white/15 px-3 py-1.5 rounded-xl">
            <Text className="text-white text-xs">Sair</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-white text-xl font-bold">Meus Atendimentos</Text>
        <Text className="text-white/60 text-xs mb-3">
          Acompanhe seus atendimentos e responda formulários
        </Text>
        <View className="flex-row items-center bg-white/15 rounded-xl px-3 h-10">
          <Text className="text-white/60 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-white text-sm"
            placeholder="Buscar atendimento..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={(t) => { setSearch(t); load(1, t); }}
          />
        </View>
      </View>

      {loading && atendimentos.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D2347" />
        </View>
      ) : (
        <FlatList
          data={atendimentos}
          keyExtractor={(item) => String(item.id_atendimento)}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListHeaderComponent={
            temPendentes ? (
              <TouchableOpacity className="flex-row items-center bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
                <Text className="text-xl mr-3">📋</Text>
                <View>
                  <Text className="text-orange-700 font-semibold text-sm">Formulários pendentes</Text>
                  <Text className="text-orange-500 text-xs">Você possui formulários para preencher</Text>
                </View>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <Text className="text-center text-muted mt-16">Nenhum atendimento encontrado.</Text>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View className="flex-row items-center justify-center gap-4 mt-2">
                <TouchableOpacity disabled={page <= 1} onPress={() => load(page - 1)}
                  className={`px-4 py-2 rounded-xl border ${page <= 1 ? 'border-gray-200' : 'border-primary'}`}>
                  <Text className={page <= 1 ? 'text-gray-300 text-sm' : 'text-primary text-sm'}>← Anterior</Text>
                </TouchableOpacity>
                <Text className="text-muted text-sm">{page}/{totalPages}</Text>
                <TouchableOpacity disabled={page >= totalPages} onPress={() => load(page + 1)}
                  className={`px-4 py-2 rounded-xl border ${page >= totalPages ? 'border-gray-200' : 'border-primary'}`}>
                  <Text className={page >= totalPages ? 'text-gray-300 text-sm' : 'text-primary text-sm'}>Próximo →</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
