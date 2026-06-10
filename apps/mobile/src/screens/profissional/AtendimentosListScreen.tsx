import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfissionalNavProp } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { atendimentosService, Atendimento } from '../../services/atendimentos';
import { useAuth } from '../../context/AuthContext';
import { formatProtocolo, formatData } from '../../utils/format';

type OrdenarPor = 'data_desc' | 'data_asc' | 'paciente';

interface Filtros {
  situacoes: number[];
  dataInicio: string;
  dataFim: string;
  ordenarPor: OrdenarPor;
}

const FILTROS_PADRAO: Filtros = {
  situacoes: [],
  dataInicio: '',
  dataFim: '',
  ordenarPor: 'data_desc',
};

const SITUACOES_OPCOES = [
  { id: 1, label: 'Criado' },
  { id: 2, label: 'Iniciado' },
  { id: 3, label: 'Respondido' },
  { id: 4, label: 'Em avaliação' },
  { id: 5, label: 'Avaliado' },
  { id: 6, label: 'Encerrado' },
];

const OPCOES_ORDENACAO: { label: string; value: OrdenarPor }[] = [
  { label: 'Data de cadastro (mais recente)', value: 'data_desc' },
  { label: 'Data de cadastro (mais antiga)', value: 'data_asc' },
  { label: 'Nome do paciente', value: 'paciente' },
];

export function AtendimentosListScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const { logout } = useAuth();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_PADRAO);
  const [filtrosDraft, setFiltrosDraft] = useState<Filtros>(FILTROS_PADRAO);
  const searchRef = useRef(search);
  searchRef.current = search;

  const buildParams = useCallback(
    (p: number, q: string, f: Filtros) => ({
      page: p,
      search: q || undefined,
      situacoes: f.situacoes.length > 0 ? f.situacoes.join(',') : undefined,
      data_inicio: f.dataInicio || undefined,
      data_fim: f.dataFim || undefined,
      ordenar_por: f.ordenarPor,
    }),
    [],
  );

  const load = useCallback(
    async (p = 1, q = searchRef.current, f = filtros) => {
      setLoading(true);
      try {
        const res = await atendimentosService.listar(buildParams(p, q, f) as any);
        setAtendimentos(res.data);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar os atendimentos.');
      } finally {
        setLoading(false);
      }
    },
    [filtros, buildParams],
  );

  useEffect(() => {
    load(1, '', FILTROS_PADRAO);
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    load(1, text, filtros);
  };

  const handleAplicarFiltros = () => {
    setFiltros(filtrosDraft);
    setShowFiltros(false);
    load(1, search, filtrosDraft);
  };

  const handleLimparFiltros = () => {
    setFiltrosDraft(FILTROS_PADRAO);
  };

  const handleEncerrar = (id: number) => {
    Alert.alert('Encerrar atendimento', 'Deseja encerrar este atendimento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Encerrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await atendimentosService.encerrar(id);
            load(page, search, filtros);
          } catch (err: any) {
            Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível encerrar.');
          }
        },
      },
    ]);
  };

  const toggleSituacao = (id: number) => {
    setFiltrosDraft((prev) => ({
      ...prev,
      situacoes: prev.situacoes.includes(id)
        ? prev.situacoes.filter((s) => s !== id)
        : [...prev.situacoes, id],
    }));
  };

  const filtrosAtivos =
    filtros.situacoes.length > 0 ||
    !!filtros.dataInicio ||
    !!filtros.dataFim ||
    filtros.ordenarPor !== 'data_desc';

  const renderCard = ({ item }: { item: Atendimento }) => {
    const paciente = item.usuario_atendimento_id_usuario_pacienteTousuario;
    const canClose = item.id_situacao_atendimento === 5;
    return (
      <View className="bg-white rounded-2xl p-4 mb-3 border border-border" style={{ elevation: 1 }}>
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-primary font-semibold text-sm flex-1 mr-2" numberOfLines={1}>
            {paciente.nome}
          </Text>
          <StatusBadge status={item.id_situacao_atendimento} />
        </View>
        <Text className="text-muted text-xs mb-1">{formatData(item.dt_cadastro)}</Text>
        <Text className="text-xs text-gray-500 mb-3" numberOfLines={1}>
          {formatProtocolo(item.id_atendimento, item.dt_cadastro)}
          {item.descricao ? `  ·  ${item.descricao}` : ''}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <TouchableOpacity
            onPress={() => navigation.navigate('DetalhesAtendimento', { id: item.id_atendimento })}
            className="bg-primary/10 px-3 py-1.5 rounded-xl"
          >
            <Text className="text-primary text-xs font-medium">Visualizar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditarAtendimento', { id: item.id_atendimento })}
            className="bg-primary/10 px-3 py-1.5 rounded-xl"
          >
            <Text className="text-primary text-xs font-medium">Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditarAtendimento', { id: item.id_atendimento })}
            className="bg-primary/10 px-3 py-1.5 rounded-xl"
          >
            <Text className="text-primary text-xs font-medium">Atribuir</Text>
          </TouchableOpacity>
          {canClose && (
            <TouchableOpacity
              onPress={() => handleEncerrar(item.id_atendimento)}
              className="bg-red-50 px-3 py-1.5 rounded-xl border border-red-200"
            >
              <Text className="text-red-600 text-xs font-medium">Encerrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary px-5 pt-14 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xl font-bold">Atendimentos</Text>
            <Text className="text-white/60 text-xs">
              {total} atendimento{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => navigation.navigate('FormulariosList')}
              className="px-3 h-9 rounded-xl bg-white/15 items-center justify-center"
            >
              <Text className="text-white text-xs font-medium">📋 Formulários</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-white text-xs">👤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('NovoAtendimento')}
              className="w-8 h-8 rounded-full bg-green-500 items-center justify-center"
            >
              <Text className="text-white font-bold text-base">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Busca + Filtros */}
        <View className="flex-row items-center gap-2 mt-3">
          <View className="flex-1 flex-row items-center bg-white/15 rounded-xl px-3 h-10">
            <Text className="text-white/60 mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-white text-sm"
              placeholder="Buscar paciente ou atendimento..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={search}
              onChangeText={handleSearch}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setFiltrosDraft(filtros);
              setShowFiltros(true);
            }}
            className={`w-10 h-10 rounded-xl items-center justify-center ${filtrosAtivos ? 'bg-green-500' : 'bg-white/15'}`}
          >
            <Text className="text-white text-base">⊞</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
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
          ListEmptyComponent={
            <Text className="text-center text-muted mt-16">Nenhum atendimento encontrado.</Text>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View className="flex-row items-center justify-center gap-4 mt-2">
                <TouchableOpacity
                  disabled={page <= 1}
                  onPress={() => load(page - 1, search, filtros)}
                  className={`px-4 py-2 rounded-xl border ${page <= 1 ? 'border-gray-200' : 'border-primary'}`}
                >
                  <Text className={page <= 1 ? 'text-gray-300 text-sm' : 'text-primary text-sm'}>
                    ← Anterior
                  </Text>
                </TouchableOpacity>
                <Text className="text-muted text-sm">{page}/{totalPages}</Text>
                <TouchableOpacity
                  disabled={page >= totalPages}
                  onPress={() => load(page + 1, search, filtros)}
                  className={`px-4 py-2 rounded-xl border ${page >= totalPages ? 'border-gray-200' : 'border-primary'}`}
                >
                  <Text className={page >= totalPages ? 'text-gray-300 text-sm' : 'text-primary text-sm'}>
                    Próximo →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* Modal de Filtros */}
      <Modal visible={showFiltros} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8" style={{ maxHeight: '90%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-primary font-bold text-base">Filtros e Ordenação</Text>
              <TouchableOpacity onPress={() => setShowFiltros(false)}>
                <Text className="text-gray-400 text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Situação */}
              <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
                📊 Situação do atendimento
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {SITUACOES_OPCOES.map((s) => {
                  const sel = filtrosDraft.situacoes.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => toggleSituacao(s.id)}
                      className={`px-3 py-2 rounded-xl border ${sel ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                    >
                      <Text className={`text-xs font-medium ${sel ? 'text-white' : 'text-gray-700'}`}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Data de cadastro */}
              <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
                📅 Data de cadastro
              </Text>
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">De</Text>
                  <TextInput
                    className="bg-gray-50 border border-border rounded-xl px-3 h-11 text-sm text-gray-800"
                    placeholder="dd/mm/aaaa"
                    placeholderTextColor="#A0AEC0"
                    value={filtrosDraft.dataInicio}
                    onChangeText={(t) => setFiltrosDraft((p) => ({ ...p, dataInicio: t }))}
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Até</Text>
                  <TextInput
                    className="bg-gray-50 border border-border rounded-xl px-3 h-11 text-sm text-gray-800"
                    placeholder="dd/mm/aaaa"
                    placeholderTextColor="#A0AEC0"
                    value={filtrosDraft.dataFim}
                    onChangeText={(t) => setFiltrosDraft((p) => ({ ...p, dataFim: t }))}
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  />
                </View>
              </View>

              {/* Ordenação */}
              <Text className="text-xs font-semibold text-gray-500 uppercase mb-2">
                ↕ Ordenar por
              </Text>
              {OPCOES_ORDENACAO.map((op) => {
                const sel = filtrosDraft.ordenarPor === op.value;
                return (
                  <TouchableOpacity
                    key={op.value}
                    onPress={() => setFiltrosDraft((p) => ({ ...p, ordenarPor: op.value }))}
                    className={`flex-row items-center px-4 py-3 rounded-xl mb-2 border ${sel ? 'bg-primary/5 border-primary' : 'bg-white border-border'}`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${sel ? 'border-primary' : 'border-gray-300'}`}
                    >
                      {sel && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </View>
                    <Text className={`text-sm ${sel ? 'text-primary font-medium' : 'text-gray-700'}`}>
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Botões */}
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={handleLimparFiltros}
                className="flex-1 h-12 border border-border rounded-2xl items-center justify-center"
              >
                <Text className="text-gray-600 font-medium">Limpar tudo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAplicarFiltros}
                className="flex-1 h-12 bg-primary rounded-2xl items-center justify-center"
              >
                <Text className="text-white font-semibold">Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
