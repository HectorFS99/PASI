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
import { MaterialIcons } from '@expo/vector-icons';
import { ProfissionalNavProp } from '../../navigation/types';
import {
  formulariosAdminService,
  FormularioAdmin,
  FiltrosFormulario,
} from '../../services/formularios';
import { apoioService } from '../../services/apoio';
import { formatData } from '../../utils/format';

type OrdenarPor = 'data_desc' | 'data_asc' | 'nome' | 'mais_respondidos';

interface Filtros {
  tiposAtivos: number[];
  apenasAtivos: boolean;
  dataInicio: string;
  dataFim: string;
  ordenarPor: OrdenarPor;
}

const FILTROS_PADRAO: Filtros = {
  tiposAtivos: [],
  apenasAtivos: false,
  dataInicio: '',
  dataFim: '',
  ordenarPor: 'data_desc',
};

const OPCOES_ORDENACAO: { label: string; value: OrdenarPor }[] = [
  { label: 'Data de criação (mais recente)', value: 'data_desc' },
  { label: 'Data de criação (mais antiga)', value: 'data_asc' },
  { label: 'Nome do formulário', value: 'nome' },
  { label: 'Mais respondidos', value: 'mais_respondidos' },
];

function tipoBadgeColor(nome?: string): string {
  const n = (nome ?? '').toUpperCase();
  if (n.includes('CRAS')) return 'bg-blue-100 text-blue-700';
  if (n.includes('CAPS')) return 'bg-green-100 text-green-700';
  if (n.includes('CREAS')) return 'bg-orange-100 text-orange-700';
  return 'bg-gray-100 text-gray-600';
}

export function FormulariosListScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const [formularios, setFormularios] = useState<FormularioAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_PADRAO);
  const [filtrosDraft, setFiltrosDraft] = useState<Filtros>(FILTROS_PADRAO);
  const [tiposFormulario, setTiposFormulario] = useState<
    { id_tipo_formulario: number; nome: string }[]
  >([]);
  const searchRef = useRef(search);
  searchRef.current = search;

  useEffect(() => {
    apoioService.getTiposFormulario().then(setTiposFormulario).catch(() => {});
  }, []);

  const buildParams = useCallback(
    (p: number, q: string, f: Filtros): FiltrosFormulario => ({
      page: p,
      search: q || undefined,
      id_tipo_formulario: f.tiposAtivos.length === 1 ? f.tiposAtivos[0] : undefined,
      ativo: f.apenasAtivos ? true : undefined,
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
        const res = await formulariosAdminService.listar(buildParams(p, q, f));
        setFormularios(res.data);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar os formulários.');
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

  const handleDesativar = (item: FormularioAdmin) => {
    const acao = item.ativo ? 'desativar' : 'reativar';
    Alert.alert(
      `${item.ativo ? 'Desativar' : 'Reativar'} formulário`,
      `Deseja ${acao} "${item.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: item.ativo ? 'Desativar' : 'Reativar',
          style: item.ativo ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (item.ativo) {
                await formulariosAdminService.desativar(item.id_formulario);
              } else {
                await formulariosAdminService.reativar(item.id_formulario);
              }
              load(page, search, filtros);
            } catch (err: any) {
              Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível realizar a ação.');
            }
          },
        },
      ],
    );
  };

  const toggleTipo = (id: number) => {
    setFiltrosDraft((prev) => ({
      ...prev,
      tiposAtivos: prev.tiposAtivos.includes(id)
        ? prev.tiposAtivos.filter((t) => t !== id)
        : [...prev.tiposAtivos, id],
    }));
  };

  const filtrosAtivos =
    filtros.tiposAtivos.length > 0 ||
    filtros.apenasAtivos ||
    !!filtros.dataInicio ||
    !!filtros.dataFim ||
    filtros.ordenarPor !== 'data_desc';

  const renderCard = ({ item }: { item: FormularioAdmin }) => {
    const tipo = item.tipo_formulario;
    const cor = tipoBadgeColor(tipo?.nome);
    const respostas = item._count?.formulario_paciente ?? 0;
    return (
      <View className="bg-white rounded-2xl p-4 mb-3 border border-border" style={{ elevation: 1 }}>
        <View className="flex-row items-center mb-2">
          <View className={`px-2 py-0.5 rounded-full mr-2 ${cor.split(' ')[0]}`}>
            <Text className={`text-xs font-semibold ${cor.split(' ')[1]}`}>{tipo?.nome ?? 'Geral'}</Text>
          </View>
          {!item.ativo && (
            <View className="px-2 py-0.5 rounded-full bg-gray-100">
              <Text className="text-xs text-gray-500">Inativo</Text>
            </View>
          )}
        </View>
        <Text className="text-primary font-semibold text-sm mb-1">{item.nome}</Text>
        <Text className="text-muted text-xs mb-3">
          {respostas} resposta{respostas !== 1 ? 's' : ''} · Criado em {formatData(item.dt_cadastro)}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <TouchableOpacity
            onPress={() => navigation.navigate('DetalhesFormulario', { id: item.id_formulario })}
            className="bg-primary/10 px-3 py-1.5 rounded-xl"
          >
            <Text className="text-primary text-xs font-medium">Visualizar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CriarEditarFormulario', {
                id: item.id_formulario,
                modo: 'editar',
              })
            }
            className="bg-primary/10 px-3 py-1.5 rounded-xl"
          >
            <Text className="text-primary text-xs font-medium">Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDesativar(item)}
            className={`px-3 py-1.5 rounded-xl ${item.ativo ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}
          >
            <Text className={`text-xs font-medium ${item.ativo ? 'text-red-600' : 'text-green-700'}`}>
              {item.ativo ? 'Desativar' : 'Ativar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-primary px-5 pt-14 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center"
            >
              <MaterialIcons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-xl font-bold">Módulo de Formulários</Text>
              <Text className="text-white/60 text-xs">
                {total} formulário{total !== 1 ? 's' : ''} exibido{total !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CriarEditarFormulario', { modo: 'criar' })
            }
            className="w-9 h-9 rounded-full bg-green-500 items-center justify-center"
          >
            <MaterialIcons name="add" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* Busca + Filtros */}
        <View className="flex-row items-center gap-2 mt-3">
          <View className="flex-1 flex-row items-center bg-white/15 rounded-xl px-3 h-10">
            <MaterialIcons name="search" size={18} color="rgba(255,255,255,0.6)" style={{ marginRight: 8 }} />
            <TextInput
              className="flex-1 text-white text-sm"
              placeholder="Buscar formulário..."
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
            <MaterialIcons name="tune" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
      {loading && formularios.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D2347" />
        </View>
      ) : (
        <FlatList
          data={formularios}
          keyExtractor={(item) => String(item.id_formulario)}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text className="text-center text-muted mt-16">Nenhum formulário encontrado.</Text>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View className="flex-row items-center justify-center gap-4 mt-2">
                <TouchableOpacity
                  disabled={page <= 1}
                  onPress={() => load(page - 1, search, filtros)}
                  className={`flex-row items-center gap-1 px-4 py-2 rounded-xl border ${page <= 1 ? 'border-gray-200' : 'border-primary'}`}
                >
                  <MaterialIcons name="chevron-left" size={16} color={page <= 1 ? '#D1D5DB' : '#0D2347'} />
                  <Text className={page <= 1 ? 'text-gray-300 text-sm' : 'text-primary text-sm'}>Anterior</Text>
                </TouchableOpacity>
                <Text className="text-muted text-sm">{page}/{totalPages}</Text>
                <TouchableOpacity
                  disabled={page >= totalPages}
                  onPress={() => load(page + 1, search, filtros)}
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
              {/* Tipo de formulário */}
              <View className="flex-row items-center gap-1.5 mb-2">
                <MaterialIcons name="assignment" size={14} color="#6B7280" />
                <Text className="text-xs font-semibold text-gray-500 uppercase">Tipo de formulário</Text>
              </View>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {tiposFormulario.map((t) => {
                  const sel = filtrosDraft.tiposAtivos.includes(t.id_tipo_formulario);
                  return (
                    <TouchableOpacity
                      key={t.id_tipo_formulario}
                      onPress={() => toggleTipo(t.id_tipo_formulario)}
                      className={`px-4 py-2 rounded-xl border ${sel ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                    >
                      <Text className={`text-sm font-medium ${sel ? 'text-white' : 'text-gray-700'}`}>
                        {t.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Status */}
              <View className="flex-row items-center gap-1.5 mb-2">
                <MaterialIcons name="check-circle-outline" size={14} color="#6B7280" />
                <Text className="text-xs font-semibold text-gray-500 uppercase">Status</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setFiltrosDraft((p) => ({ ...p, apenasAtivos: !p.apenasAtivos }))
                }
                className="flex-row items-center bg-gray-50 border border-border rounded-xl px-4 py-3 mb-4"
              >
                <View
                  className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${filtrosDraft.apenasAtivos ? 'bg-primary border-primary' : 'border-gray-300'}`}
                >
                  {filtrosDraft.apenasAtivos && (
                    <MaterialIcons name="check" size={12} color="white" />
                  )}
                </View>
                <Text className="text-sm text-gray-700">Exibir apenas formulários ativos</Text>
              </TouchableOpacity>

              {/* Data de criação */}
              <View className="flex-row items-center gap-1.5 mb-2">
                <MaterialIcons name="calendar-today" size={14} color="#6B7280" />
                <Text className="text-xs font-semibold text-gray-500 uppercase">Filtrar por data de criação</Text>
              </View>
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
