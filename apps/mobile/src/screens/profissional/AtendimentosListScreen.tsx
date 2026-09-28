import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfissionalNavProp } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { ScreenHeader, HeaderAddButton } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { Pagination } from '../../components/Pagination';
import { FiltrosModal, FilterSection, FilterDateRange } from '../../components/FiltrosModal';
import { ChipGroup, alternarValor } from '../../components/ChipGroup';
import { RadioList } from '../../components/RadioList';
import { atendimentosService, Atendimento, FiltrosAtendimento } from '../../services/atendimentos';
import { useDrawer } from '../../context/DrawerContext';
import { useFeedback } from '../../context/FeedbackContext';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { SituacaoAtendimento, SITUACOES_ATENDIMENTO_OPCOES } from '../../constants/dominio';
import { colors } from '../../constants/colors';
import { formatProtocolo, formatData } from '../../utils/format';
import { brParaIsoInicioDia, brParaIsoFimDia } from '../../utils/date';
import { mensagemErroApi } from '../../utils/errors';

type OrdenarPor = NonNullable<FiltrosAtendimento['ordenar_por']>;

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

const OPCOES_ORDENACAO: { label: string; value: OrdenarPor }[] = [
  { label: 'Data de cadastro (mais recente)', value: 'data_desc' },
  { label: 'Data de cadastro (mais antiga)', value: 'data_asc' },
  { label: 'Nome do paciente', value: 'paciente' },
  { label: 'Situação do atendimento', value: 'situacao' },
];

export function AtendimentosListScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const { openDrawer } = useDrawer();
  const { toast, confirm } = useFeedback();

  const lista = usePaginatedList<Atendimento, Filtros>({
    filtrosPadrao: FILTROS_PADRAO,
    mensagemErro: 'Não foi possível carregar os atendimentos.',
    fetcher: ({ page, search, filtros }) =>
      atendimentosService.listar({
        page,
        search: search || undefined,
        situacoes: filtros.situacoes.length > 0 ? filtros.situacoes.join(',') : undefined,
        // Envia início/fim do dia no fuso local (datas incompletas viram undefined).
        data_inicio: brParaIsoInicioDia(filtros.dataInicio),
        data_fim: brParaIsoFimDia(filtros.dataFim),
        ordenar_por: filtros.ordenarPor,
      }),
  });

  const handleEncerrar = async (id: number) => {
    const ok = await confirm({
      title: 'Encerrar atendimento',
      message: 'Deseja encerrar este atendimento?',
      confirmLabel: 'Encerrar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await atendimentosService.encerrar(id);
      toast('Atendimento encerrado.', 'success');
      lista.recarregar();
    } catch (err) {
      toast(mensagemErroApi(err, 'Não foi possível encerrar.'), 'error');
    }
  };

  const renderCard = ({ item }: { item: Atendimento }) => {
    const paciente = item.usuario_atendimento_id_usuario_pacienteTousuario;
    const canClose = item.id_situacao_atendimento === SituacaoAtendimento.AVALIADO;
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
            <Text className="text-primary text-xs font-medium">Alterar</Text>
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

  const { total } = lista;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title="Atendimentos"
        subtitle={`${total} atendimento${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
        onMenu={openDrawer}
        right={<HeaderAddButton onPress={() => navigation.navigate('NovoAtendimento')} />}
      >
        <SearchBar
          value={lista.search}
          onChangeText={lista.setSearch}
          placeholder="Buscar paciente ou atendimento..."
          onFilterPress={lista.abrirFiltros}
          filterActive={lista.filtrosAtivos}
        />
      </ScreenHeader>

      {lista.loading && lista.items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista.items}
          keyExtractor={(item) => String(item.id_atendimento)}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text className="text-center text-muted mt-16">Nenhum atendimento encontrado.</Text>
          }
          ListFooterComponent={
            <Pagination
              page={lista.page}
              totalPages={lista.totalPages}
              onChange={lista.irParaPagina}
            />
          }
        />
      )}

      <FiltrosModal
        visible={lista.filtrosVisiveis}
        onClose={lista.fecharFiltros}
        onClear={lista.limparFiltros}
        onApply={lista.aplicarFiltros}
      >
        <FilterSection icon="bar-chart" title="Situação do atendimento">
          <ChipGroup
            options={SITUACOES_ATENDIMENTO_OPCOES}
            selected={lista.filtrosDraft.situacoes}
            onToggle={(id) =>
              lista.editarFiltros({ situacoes: alternarValor(lista.filtrosDraft.situacoes, id) })
            }
          />
        </FilterSection>
        <FilterSection icon="calendar-today" title="Data de cadastro">
          <FilterDateRange
            inicio={lista.filtrosDraft.dataInicio}
            fim={lista.filtrosDraft.dataFim}
            onChangeInicio={(dataInicio) => lista.editarFiltros({ dataInicio })}
            onChangeFim={(dataFim) => lista.editarFiltros({ dataFim })}
          />
        </FilterSection>
        <FilterSection icon="swap-vert" title="Ordenar por">
          <RadioList
            options={OPCOES_ORDENACAO}
            value={lista.filtrosDraft.ordenarPor}
            onChange={(ordenarPor) => lista.editarFiltros({ ordenarPor })}
          />
        </FilterSection>
      </FiltrosModal>
    </View>
  );
}
