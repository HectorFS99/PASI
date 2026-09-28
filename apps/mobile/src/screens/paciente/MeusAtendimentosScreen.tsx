import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { PacienteNavProp } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { Pagination } from '../../components/Pagination';
import { FiltrosModal, FilterSection, FilterDateRange } from '../../components/FiltrosModal';
import { ChipGroup, alternarValor } from '../../components/ChipGroup';
import { RadioList } from '../../components/RadioList';
import { atendimentosService, Atendimento } from '../../services/atendimentos';
import { useAuth } from '../../context/AuthContext';
import { useDrawer } from '../../context/DrawerContext';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import {
  SituacaoAtendimento,
  SituacaoFormulario,
  SITUACOES_ATENDIMENTO_OPCOES,
} from '../../constants/dominio';
import { colors } from '../../constants/colors';
import { formatProtocolo, formatData } from '../../utils/format';
import { brParaIsoInicioDia, brParaIsoFimDia } from '../../utils/date';

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

const OPCOES_ORDENACAO: { label: string; value: OrdenarPor }[] = [
  { label: 'Data de cadastro (mais recente)', value: 'data_desc' },
  { label: 'Data de cadastro (mais antiga)', value: 'data_asc' },
];

/** Situações em que o paciente ainda pode responder formulários. */
const SITUACOES_RESPONDIVEIS: number[] = [
  SituacaoAtendimento.CRIADO,
  SituacaoAtendimento.INICIADO,
  SituacaoAtendimento.RESPONDIDO,
];

const pendentesCount = (a: Atendimento) =>
  a.atendimento_formulario.filter(
    (af) =>
      !af.status_formulario_paciente ||
      af.status_formulario_paciente.id_situacao_formulario < SituacaoFormulario.RESPONDIDO,
  ).length;

export function MeusAtendimentosScreen() {
  const navigation = useNavigation<PacienteNavProp>();
  const { usuario } = useAuth();
  const { openDrawer } = useDrawer();

  const lista = usePaginatedList<Atendimento, Filtros>({
    filtrosPadrao: FILTROS_PADRAO,
    mensagemErro: 'Não foi possível carregar seus atendimentos.',
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

  const temPendentes = lista.items.some((a) => pendentesCount(a) > 0);

  const renderCard = ({ item }: { item: Atendimento }) => {
    const count = pendentesCount(item);
    const podeResponder = SITUACOES_RESPONDIVEIS.includes(item.id_situacao_atendimento) && count > 0;
    const abrir = () =>
      navigation.navigate('FormulariosAtendimento', {
        idAtendimento: item.id_atendimento,
        descricao: item.descricao ?? 'Atendimento',
      });

    return (
      <View className="bg-white rounded-2xl p-4 mb-3 border border-border" style={{ elevation: 1 }}>
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xs text-muted">
            {formatProtocolo(item.id_atendimento, item.dt_cadastro)}
          </Text>
          <StatusBadge status={item.id_situacao_atendimento} />
        </View>
        <Text className="text-sm font-semibold text-primary mb-0.5" numberOfLines={2}>
          {item.descricao ?? 'Atendimento'}
        </Text>
        <Text className="text-xs text-muted mb-3">{formatData(item.dt_cadastro)}</Text>

        {podeResponder ? (
          <TouchableOpacity
            onPress={abrir}
            className="bg-green-500 rounded-xl py-3 flex-row items-center justify-center gap-1.5"
          >
            <MaterialIcons name="edit" size={16} color={colors.white} />
            <Text className="text-white text-sm font-semibold">
              Responder formulários ({count})
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={abrir} className="border border-border rounded-xl py-3 items-center">
            <Text className="text-gray-600 text-sm">Visualizar detalhes</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Meus Atendimentos" subtitle={usuario?.nome} onMenu={openDrawer}>
        <SearchBar
          value={lista.search}
          onChangeText={lista.setSearch}
          placeholder="Buscar atendimento..."
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
          ListHeaderComponent={
            temPendentes ? (
              <View className="flex-row items-center bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
                <MaterialIcons name="assignment" size={24} color={colors.warning} style={{ marginRight: 12 }} />
                <View>
                  <Text className="text-orange-700 font-semibold text-sm">Formulários pendentes</Text>
                  <Text className="text-orange-500 text-xs">Você possui formulários para preencher</Text>
                </View>
              </View>
            ) : null
          }
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
