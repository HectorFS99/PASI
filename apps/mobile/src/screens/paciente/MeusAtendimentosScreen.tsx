import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { PacienteNavProp } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { DateField } from '../../components/DateField';
import { atendimentosService, Atendimento } from '../../services/atendimentos';
import { useAuth } from '../../context/AuthContext';
import { useDrawer } from '../../context/DrawerContext';
import { useFeedback } from '../../context/FeedbackContext';
import { formatProtocolo, formatData } from '../../utils/format';
import { brParaIso } from '../../utils/date';

type OrdenarPor = 'data_desc' | 'data_asc';

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
];

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
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_PADRAO);
  const [filtrosDraft, setFiltrosDraft] = useState<Filtros>(FILTROS_PADRAO);
  const searchRef = useRef(search);
  searchRef.current = search;
  const filtrosRef = useRef(filtros);
  filtrosRef.current = filtros;

  const temPendentes = atendimentos.some((a) =>
    a.atendimento_formulario.some(
      (af) => !af.status_formulario_paciente || af.status_formulario_paciente.id_situacao_formulario !== 2,
    ),
  );

  const buildParams = useCallback(
    (p: number, q: string, f: Filtros) => ({
      page: p,
      search: q || undefined,
      situacoes: f.situacoes.length > 0 ? f.situacoes.join(',') : undefined,
      // Backend espera ISO (aaaa-mm-dd); datas incompletas são ignoradas.
      data_inicio: brParaIso(f.dataInicio),
      data_fim: brParaIso(f.dataFim),
      ordenar_por: f.ordenarPor,
    }),
    [],
  );

  const load = useCallback(
    async (p = 1, q = searchRef.current, f = filtrosRef.current) => {
      setLoading(true);
      try {
        const res = await atendimentosService.listar(buildParams(p, q, f) as any);
        setAtendimentos(res.data);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
      } catch {
        toast('Não foi possível carregar seus atendimentos.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [toast, buildParams],
  );

  const loadRef = useRef(load);
  loadRef.current = load;

  // Recarrega ao focar (ex.: ao voltar de responder um formulário).
  useFocusEffect(
    useCallback(() => {
      loadRef.current(1, searchRef.current, filtrosRef.current);
    }, []),
  );

  const handleAplicarFiltros = () => {
    setFiltros(filtrosDraft);
    setShowFiltros(false);
    load(1, search, filtrosDraft);
  };

  // Limpa filtros e ordenação, fecha o popup e recarrega a listagem padrão.
  const handleLimparFiltros = () => {
    setFiltrosDraft(FILTROS_PADRAO);
    setFiltros(FILTROS_PADRAO);
    setShowFiltros(false);
    load(1, search, FILTROS_PADRAO);
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
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-white/15 rounded-xl px-3 h-10">
            <MaterialIcons name="search" size={18} color="rgba(255,255,255,0.6)" style={{ marginRight: 8 }} />
            <TextInput
              className="flex-1 text-white text-sm"
              placeholder="Buscar atendimento..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={search}
              onChangeText={(t) => { setSearch(t); load(1, t); }}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setFiltrosDraft(filtros);
              setShowFiltros(true);
            }}
            className={`w-10 h-10 rounded-xl items-center justify-center ${filtrosAtivos ? 'bg-green-500' : 'bg-white/15'}`}
          >
            <MaterialIcons name="tune" size={20} color="white" />
          </TouchableOpacity>
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

      {/* Modal de Filtros */}
      <Modal visible={showFiltros} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8" style={{ maxHeight: '90%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-primary font-bold text-base">Filtros e Ordenação</Text>
              <TouchableOpacity onPress={() => setShowFiltros(false)}>
                <MaterialIcons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Situação */}
              <View className="flex-row items-center gap-1.5 mb-2">
                <MaterialIcons name="bar-chart" size={14} color="#6B7280" />
                <Text className="text-xs font-semibold text-gray-500 uppercase">Situação do atendimento</Text>
              </View>
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
              <View className="flex-row items-center gap-1.5 mb-2">
                <MaterialIcons name="calendar-today" size={14} color="#6B7280" />
                <Text className="text-xs font-semibold text-gray-500 uppercase">Data de cadastro</Text>
              </View>
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <DateField
                    label="De"
                    value={filtrosDraft.dataInicio}
                    onChange={(t) => setFiltrosDraft((p) => ({ ...p, dataInicio: t }))}
                  />
                </View>
                <View className="flex-1">
                  <DateField
                    label="Até"
                    value={filtrosDraft.dataFim}
                    onChange={(t) => setFiltrosDraft((p) => ({ ...p, dataFim: t }))}
                  />
                </View>
              </View>

              {/* Ordenação */}
              <View className="flex-row items-center gap-1.5 mb-2">
                <MaterialIcons name="swap-vert" size={14} color="#6B7280" />
                <Text className="text-xs font-semibold text-gray-500 uppercase">Ordenar por</Text>
              </View>
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
