import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfissionalNavProp } from '../../navigation/types';
import {
  formulariosAdminService,
  FormularioAdmin,
  FiltrosFormulario,
} from '../../services/formularios';
import { apoioService } from '../../services/apoio';
import { useFeedback } from '../../context/FeedbackContext';
import { ScreenHeader, HeaderAddButton } from '../../components/ScreenHeader';
import { SearchBar } from '../../components/SearchBar';
import { Pagination } from '../../components/Pagination';
import { FiltrosModal, FilterSection, FilterDateRange } from '../../components/FiltrosModal';
import { ChipGroup, ChipOption, alternarValor } from '../../components/ChipGroup';
import { RadioList } from '../../components/RadioList';
import { Checkbox } from '../../components/Checkbox';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { colors } from '../../constants/colors';
import { formatData } from '../../utils/format';
import { brParaIsoInicioDia, brParaIsoFimDia } from '../../utils/date';
import { mensagemErroApi } from '../../utils/errors';

type OrdenarPor = NonNullable<FiltrosFormulario['ordenar_por']>;

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
  const { toast, confirm } = useFeedback();
  const [tiposFormulario, setTiposFormulario] = useState<ChipOption<number>[]>([]);

  useEffect(() => {
    apoioService
      .getTiposFormulario()
      .then((tipos) => setTiposFormulario(tipos.map((t) => ({ value: t.id_tipo_formulario, label: t.nome }))))
      .catch(() => {});
  }, []);

  const lista = usePaginatedList<FormularioAdmin, Filtros>({
    filtrosPadrao: FILTROS_PADRAO,
    mensagemErro: 'Não foi possível carregar os formulários.',
    fetcher: ({ page, search, filtros }) =>
      formulariosAdminService.listar({
        page,
        search: search || undefined,
        id_tipo_formulario: filtros.tiposAtivos.length === 1 ? filtros.tiposAtivos[0] : undefined,
        ativo: filtros.apenasAtivos ? true : undefined,
        // Envia início/fim do dia no fuso local (datas incompletas viram undefined).
        data_inicio: brParaIsoInicioDia(filtros.dataInicio),
        data_fim: brParaIsoFimDia(filtros.dataFim),
        ordenar_por: filtros.ordenarPor,
      }),
  });

  const handleDesativar = async (item: FormularioAdmin) => {
    const acao = item.ativo ? 'Desativar' : 'Reativar';
    const ok = await confirm({
      title: `${acao} formulário`,
      message: `Deseja ${acao.toLowerCase()} "${item.nome}"?`,
      confirmLabel: acao,
      destructive: item.ativo,
    });
    if (!ok) return;
    try {
      if (item.ativo) {
        await formulariosAdminService.desativar(item.id_formulario);
      } else {
        await formulariosAdminService.reativar(item.id_formulario);
      }
      toast(`Formulário ${item.ativo ? 'desativado' : 'reativado'}.`, 'success');
      lista.recarregar();
    } catch (err) {
      toast(mensagemErroApi(err, 'Não foi possível realizar a ação.'), 'error');
    }
  };

  const renderCard = ({ item }: { item: FormularioAdmin }) => {
    const tipo = item.tipo_formulario;
    const [corFundo, corTexto] = tipoBadgeColor(tipo?.nome).split(' ');
    const respostas = item._count?.formulario_paciente ?? 0;
    return (
      <View className="bg-white rounded-2xl p-4 mb-3 border border-border" style={{ elevation: 1 }}>
        <View className="flex-row items-center mb-2">
          <View className={`px-2 py-0.5 rounded-full mr-2 ${corFundo}`}>
            <Text className={`text-xs font-semibold ${corTexto}`}>{tipo?.nome ?? 'Geral'}</Text>
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
              navigation.navigate('CriarEditarFormulario', { id: item.id_formulario, modo: 'editar' })
            }
            className="bg-primary/10 px-3 py-1.5 rounded-xl"
          >
            <Text className="text-primary text-xs font-medium">Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDesativar(item)}
            className={`px-3 py-1.5 rounded-xl ${
              item.ativo ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
            }`}
          >
            <Text className={`text-xs font-medium ${item.ativo ? 'text-red-600' : 'text-green-700'}`}>
              {item.ativo ? 'Desativar' : 'Ativar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const { total } = lista;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader
        title="Formulários"
        subtitle={`${total} formulário${total !== 1 ? 's' : ''} exibido${total !== 1 ? 's' : ''}`}
        onBack={() => navigation.goBack()}
        right={
          <HeaderAddButton onPress={() => navigation.navigate('CriarEditarFormulario', { modo: 'criar' })} />
        }
      >
        <SearchBar
          value={lista.search}
          onChangeText={lista.setSearch}
          placeholder="Buscar formulário..."
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
          keyExtractor={(item) => String(item.id_formulario)}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text className="text-center text-muted mt-16">Nenhum formulário encontrado.</Text>
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
        <FilterSection icon="assignment" title="Tipo de formulário">
          <ChipGroup
            options={tiposFormulario}
            selected={lista.filtrosDraft.tiposAtivos}
            onToggle={(id) =>
              lista.editarFiltros({ tiposAtivos: alternarValor(lista.filtrosDraft.tiposAtivos, id) })
            }
          />
        </FilterSection>
        <FilterSection icon="check-circle-outline" title="Status">
          <Checkbox
            boxed
            label="Exibir apenas formulários ativos"
            checked={lista.filtrosDraft.apenasAtivos}
            onToggle={() => lista.editarFiltros({ apenasAtivos: !lista.filtrosDraft.apenasAtivos })}
          />
        </FilterSection>
        <FilterSection icon="calendar-today" title="Filtrar por data de criação">
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
