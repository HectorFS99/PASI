import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfissionalNavProp, ProfissionalStackParamList } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PrimaryButton } from '../../components/PrimaryButton';
import { FormListSkeleton } from '../../components/Skeleton';
import { MaterialIcons } from '@expo/vector-icons';
import { atendimentosService, Atendimento } from '../../services/atendimentos';
import { formulariosService, FormularioItem } from '../../services/formularios';
import { useFeedback } from '../../context/FeedbackContext';
import { formatProtocolo } from '../../utils/format';

type RouteT = RouteProp<ProfissionalStackParamList, 'EditarAtendimento'>;

export function EditarAtendimentoScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const insets = useSafeAreaInsets();
  const { toast, confirm } = useFeedback();
  const { id } = useRoute<RouteT>().params;

  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal adicionar formulários
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formDisp, setFormDisp] = useState<FormularioItem[]>([]);
  const [formBusca, setFormBusca] = useState('');
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [adicionando, setAdicionando] = useState(false);

  const load = useCallback(async () => {
    try {
      const a = await atendimentosService.buscar(id);
      setAtendimento(a);
      setDescricao(a.descricao ?? '');
    } catch {
      toast('Não foi possível carregar o atendimento.', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const abrirModal = async () => {
    // Abre o modal já com skeleton enquanto busca os formulários disponíveis.
    setSelecionados(new Set());
    setFormBusca('');
    setFormDisp([]);
    setModalLoading(true);
    setModalVisible(true);
    const res = await formulariosService.listar({ ativo: true }).catch(() => ({ data: [] }));
    const jaAtrib = new Set(atendimento?.atendimento_formulario.map((af) => af.id_formulario) ?? []);
    setFormDisp(res.data.filter((f) => !jaAtrib.has(f.id_formulario)));
    setModalLoading(false);
  };

  const confirmarAdicao = async () => {
    if (selecionados.size === 0) return;
    setAdicionando(true);
    try {
      await atendimentosService.atribuirFormularios(id, Array.from(selecionados));
      setModalVisible(false);
      toast('Formulário(s) atribuído(s) com sucesso.', 'success');
      load();
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Não foi possível atribuir.', 'error');
    } finally {
      setAdicionando(false);
    }
  };

  const removerFormulario = async (idForm: number) => {
    const ok = await confirm({
      title: 'Remover formulário',
      message: 'Remover este formulário do atendimento?',
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    try {
      await atendimentosService.removerFormulario(id, idForm);
      toast('Formulário removido.', 'success');
      load();
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Não foi possível remover.', 'error');
    }
  };

  const salvar = async () => {
    setSaving(true);
    try {
      await atendimentosService.atualizar(id, { descricao: descricao.trim() || undefined });
      toast('Alterações salvas!', 'success');
      navigation.goBack();
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Não foi possível salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !atendimento) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#0D2347" />
      </View>
    );
  }

  const isCriado = atendimento.id_situacao_atendimento === 1;
  const formsFiltrados = formDisp.filter(
    (f) => !formBusca || f.nome?.toLowerCase().includes(formBusca.toLowerCase()),
  );

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-primary px-6" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: 16 }}>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold flex-1" numberOfLines={1}>Editar Atendimento</Text>
            <StatusBadge status={atendimento.id_situacao_atendimento} />
          </View>
        </View>

        <View className="px-6 pt-6 pb-10">
          {/* Descrição */}
          <Text className="text-sm font-medium text-gray-700 mb-1">Descrição</Text>
          <TextInput
            className="bg-input-bg border border-border rounded-xl px-4 py-3 text-sm text-gray-800 mb-4"
            placeholder="Descrição do atendimento..."
            placeholderTextColor="#A0AEC0"
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={3}
          />

          {/* Paciente */}
          <Text className="text-sm font-medium text-gray-700 mb-1">Paciente</Text>
          <View className="bg-input-bg border border-border rounded-xl px-4 h-12 justify-center mb-6">
            <Text className="text-sm text-gray-800">
              {atendimento.usuario_atendimento_id_usuario_pacienteTousuario.nome}
            </Text>
          </View>

          {/* Formulários vinculados */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-medium text-gray-700">
              Formulários vinculados ({atendimento.atendimento_formulario.length})
            </Text>
            {isCriado && (
              <TouchableOpacity
                onPress={abrirModal}
                className="flex-row items-center bg-primary px-3 py-1.5 rounded-xl"
              >
                <Text className="text-white text-xs font-medium">+ Adicionar</Text>
              </TouchableOpacity>
            )}
          </View>

          {atendimento.atendimento_formulario.map((af) => {
            const fp = af.status_formulario_paciente;
            const situacaoId = fp?.id_situacao_formulario ?? 1;
            return (
              <View key={af.id_atendimento_formulario} className="bg-white border border-border rounded-xl p-4 mb-3">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-semibold text-gray-800">{af.formulario.nome}</Text>
                    <Text className="text-xs text-muted mt-0.5" numberOfLines={2}>
                      {af.formulario.descricao}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <StatusBadge status={situacaoId} variant="formulario" />
                    {isCriado && (
                      <TouchableOpacity onPress={() => removerFormulario(af.id_formulario)}>
                        <MaterialIcons name="close" size={18} color="#F87171" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View className="flex-row gap-2">
                  {situacaoId === 2 && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('DetalhesAtendimento', { id: atendimento.id_atendimento })}
                      className="flex-1 border border-primary rounded-xl py-2 items-center"
                    >
                      <Text className="text-primary text-xs font-medium">Avaliar respostas</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => navigation.navigate('DetalhesAtendimento', { id: atendimento.id_atendimento })}
                    className="flex-1 border border-border rounded-xl py-2 items-center"
                  >
                    <Text className="text-gray-600 text-xs">Visualizar detalhes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <PrimaryButton label="Cancelar" onPress={() => navigation.goBack()} variant="outlined" />
            </View>
            <View className="flex-1">
              <PrimaryButton label="Salvar alterações" onPress={salvar} loading={saving} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal adicionar formulários */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6 max-h-3/4">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-base font-bold text-primary">Adicionar Formulários</Text>
                <Text className="text-xs text-muted">Selecione formulários para vincular</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="bg-input-bg border border-border rounded-xl px-4 h-10 text-sm mb-3"
              placeholder="Buscar formulários..."
              placeholderTextColor="#A0AEC0"
              value={formBusca}
              onChangeText={setFormBusca}
            />

            <ScrollView className="max-h-64">
              {modalLoading ? (
                <FormListSkeleton rows={4} />
              ) : formsFiltrados.length === 0 ? (
                <Text className="text-center text-muted text-sm py-6">
                  Nenhum formulário disponível para adicionar.
                </Text>
              ) : (
                formsFiltrados.map((f) => {
                  const sel = selecionados.has(f.id_formulario);
                  return (
                    <TouchableOpacity
                      key={f.id_formulario}
                      onPress={() => {
                        setSelecionados((prev) => {
                          const next = new Set(prev);
                          sel ? next.delete(f.id_formulario) : next.add(f.id_formulario);
                          return next;
                        });
                      }}
                      className={`flex-row items-center p-3 rounded-xl mb-2 border ${sel ? 'bg-primary/5 border-primary' : 'border-border'}`}
                    >
                      <MaterialIcons name="assignment" size={22} color="#4A5568" style={{ marginRight: 12 }} />
                      <View className="flex-1">
                        <Text className="text-xs text-primary font-semibold">{f.tipo_formulario?.nome ?? 'Geral'}</Text>
                        <Text className="text-sm text-gray-800">{f.nome}</Text>
                        <Text className="text-xs text-muted" numberOfLines={1}>{f.descricao}</Text>
                      </View>
                      {sel && <MaterialIcons name="check" size={18} color="#0D2347" />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View className="flex-row gap-3 mt-4">
              <View className="flex-1">
                <PrimaryButton label="Cancelar" onPress={() => setModalVisible(false)} variant="outlined" />
              </View>
              <View className="flex-1">
                <PrimaryButton
                  label={`Adicionar (${selecionados.size})`}
                  onPress={confirmarAdicao}
                  loading={adicionando}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
