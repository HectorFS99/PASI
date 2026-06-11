import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { PacienteNavProp } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { atendimentosService, Atendimento } from '../../services/atendimentos';
import { useAuth } from '../../context/AuthContext';
import { useDrawer } from '../../context/DrawerContext';
import { useFeedback } from '../../context/FeedbackContext';
import { formatProtocolo, formatData } from '../../utils/format';

export function MeusAtendimentosScreen() {
  const navigation = useNavigation<PacienteNavProp>();
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();
  const { openDrawer } = useDrawer();
  const { toast } = useFeedback();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const searchRef = useRef(search);
  searchRef.current = search;

  const temPendentes = atendimentos.some((a) =>
    a.atendimento_formulario.some(
      (af) => !af.status_formulario_paciente || af.status_formulario_paciente.id_situacao_formulario !== 2,
    ),
  );

  const load = useCallback(async (p = 1, q = searchRef.current) => {
    setLoading(true);
    try {
      const res = await atendimentosService.listar({ page: p, search: q || undefined });
      setAtendimentos(res.data);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch {
      toast('Não foi possível carregar seus atendimentos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadRef = useRef(load);
  loadRef.current = load;

  // Recarrega ao focar (ex.: ao voltar de responder um formulário).
  useFocusEffect(
    useCallback(() => {
      loadRef.current(1, searchRef.current);
    }, []),
  );

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
            className="bg-green-500 rounded-xl py-3 flex-row items-center justify-center gap-1.5"
          >
            <MaterialIcons name="edit" size={16} color="white" />
            <Text className="text-white text-sm font-semibold">
              Responder formulários ({count})
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
      <View className="bg-primary px-5" style={{ paddingTop: Math.max(insets.top, 24), paddingBottom: 24 }}>
        <View className="flex-row items-center gap-3 mb-2">
          <TouchableOpacity
            onPress={openDrawer}
            className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center"
          >
            <MaterialIcons name="menu" size={22} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Meus Atendimentos</Text>
            <Text className="text-white/60 text-xs" numberOfLines={1}>{usuario?.nome}</Text>
          </View>
        </View>
        <View className="flex-row items-center bg-white/15 rounded-xl px-3 h-10">
          <MaterialIcons name="search" size={18} color="rgba(255,255,255,0.6)" style={{ marginRight: 8 }} />
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
                <MaterialIcons name="assignment" size={24} color="#C05621" style={{ marginRight: 12 }} />
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
                <TouchableOpacity
                  disabled={page <= 1}
                  onPress={() => load(page - 1)}
                  className={`flex-row items-center gap-1 px-4 py-2 rounded-xl border ${page <= 1 ? 'border-gray-200' : 'border-primary'}`}
                >
                  <MaterialIcons name="chevron-left" size={16} color={page <= 1 ? '#D1D5DB' : '#0D2347'} />
                  <Text className={page <= 1 ? 'text-gray-300 text-sm' : 'text-primary text-sm'}>Anterior</Text>
                </TouchableOpacity>
                <Text className="text-muted text-sm">{page}/{totalPages}</Text>
                <TouchableOpacity
                  disabled={page >= totalPages}
                  onPress={() => load(page + 1)}
                  className={`flex-row items-center gap-1 px-4 py-2 rounded-xl border ${page >= totalPages ? 'border-gray-200' : 'border-primary'}`}
                >
                  <Text className={page >= totalPages ? 'text-gray-300 text-sm' : 'text-primary text-sm'}>Próximo</Text>
                  <MaterialIcons name="chevron-right" size={16} color={page >= totalPages ? '#D1D5DB' : '#0D2347'} />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
