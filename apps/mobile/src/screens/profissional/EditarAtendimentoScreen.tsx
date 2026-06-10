import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ProfissionalNavProp, ProfissionalStackParamList } from '../../navigation/types';
import { StatusBadge } from '../../components/StatusBadge';
import { PrimaryButton } from '../../components/PrimaryButton';
import { atendimentosService, Atendimento } from '../../services/atendimentos';
import { formulariosService, FormularioItem } from '../../services/formularios';
import { formatProtocolo } from '../../utils/format';

type RouteT = RouteProp<ProfissionalStackParamList, 'EditarAtendimento'>;

export function EditarAtendimentoScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const { id } = useRoute<RouteT>().params;

  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal adicionar formulários
  const [modalVisible, setModalVisible] = useState(false);
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
      Alert.alert('Erro', 'Não foi possível carregar o atendimento.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const abrirModal = async () => {
    const res = await formulariosService.listar({ ativo: true }).catch(() => ({ data: [] }));
    const jaAtrib = new Set(atendimento?.atendimento_formulario.map((af) => af.id_formulario) ?? []);
    setFormDisp(res.data.filter((f) => !jaAtrib.has(f.id_formulario)));
    setSelecionados(new Set());
    setFormBusca('');
    setModalVisible(true);
  };

  const confirmarAdicao = async () => {
    if (selecionados.size === 0) return;
    setAdicionando(true);
    try {
      await atendimentosService.atribuirFormularios(id, Array.from(selecionados));
      setModalVisible(false);
      load();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível atribuir.');
    } finally {
      setAdicionando(false);
    }
  };

  const removerFormulario = (idForm: number) => {
    Alert.alert('Remover formulário', 'Remover este formulário do atendimento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await atendimentosService.removerFormulario(id, idForm);
            load();
          } catch (err: any) {
            Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível remover.');
          }
        },
      },
    ]);
  };

  const salvar = async () => {
    setSaving(true);
    try {
      await atendimentosService.atualizar(id, { descricao: descricao.trim() || undefined });
      Alert.alert('Sucesso', 'Alterações salvas!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível salvar.');
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
        <View className="bg-primary px-6 pt-14 pb-5">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mb-3 self-start">
            <Text className="text-white text-2xl">←</Text>
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <Text className="text-white text-xl font-bold">Editar Atendimento</Text>
            <StatusBadge status={atendimento.id_situacao_atendimento} />
          </View>
          <Text className="text-white/70 text-sm mt-1">
            {formatProtocolo(atendimento.id_atendimento, atendimento.dt_cadastro)}
          </Text>
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
                        <Text className="text-red-400 text-lg">×</Text>
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
                <Text className="text-gray-400 text-xl">×</Text>
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
              {formsFiltrados.map((f) => {
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
                    <Text className="text-lg mr-3">📋</Text>
                    <View className="flex-1">
                      <Text className="text-xs text-primary font-semibold">{f.tipo_formulario?.nome ?? 'Geral'}</Text>
                      <Text className="text-sm text-gray-800">{f.nome}</Text>
                      <Text className="text-xs text-muted" numberOfLines={1}>{f.descricao}</Text>
                    </View>
                    {sel && <Text className="text-primary font-bold">✓</Text>}
                  </TouchableOpacity>
                );
              })}
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
