import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProfissionalNavProp } from '../../navigation/types';
import { PrimaryButton } from '../../components/PrimaryButton';
import { MaterialIcons } from '@expo/vector-icons';
import { atendimentosService, Paciente } from '../../services/atendimentos';
import { formulariosService, FormularioItem } from '../../services/formularios';

export function NovoAtendimentoScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const [descricao, setDescricao] = useState('');
  const [pacienteBusca, setPacienteBusca] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [showPacientes, setShowPacientes] = useState(false);
  const [formularios, setFormularios] = useState<FormularioItem[]>([]);
  const [selectedForms, setSelectedForms] = useState<Set<number>>(new Set());
  const [formBusca, setFormBusca] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    formulariosService.listar({ ativo: true }).then((r) => setFormularios(r.data)).catch(() => null);
  }, []);

  const buscarPacientes = async (q: string) => {
    setPacienteBusca(q);
    setPacienteSelecionado(null);
    if (q.length < 2) { setPacientes([]); setShowPacientes(false); return; }
    const res = await atendimentosService.listarPacientes(q).catch(() => []);
    setPacientes(res);
    setShowPacientes(true);
  };

  const selecionarPaciente = (p: Paciente) => {
    setPacienteSelecionado(p);
    setPacienteBusca(p.nome);
    setShowPacientes(false);
  };

  const toggleForm = (id: number) => {
    setSelectedForms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formsFiltrados = formularios.filter(
    (f) => !formBusca || f.nome?.toLowerCase().includes(formBusca.toLowerCase()),
  );

  const handleConfirmar = async () => {
    if (!pacienteSelecionado) { Alert.alert('Atenção', 'Selecione um paciente.'); return; }
    setLoading(true);
    try {
      await atendimentosService.criar({
        descricao: descricao.trim() || undefined,
        id_usuario_paciente: pacienteSelecionado.id_usuario,
        formularios: Array.from(selectedForms),
      });
      Alert.alert('Sucesso', 'Atendimento criado!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Não foi possível criar o atendimento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="bg-primary px-6 pt-14 pb-5">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mb-3 self-start">
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Novo Atendimento</Text>
          <Text className="text-white/70 text-sm">Preencha os dados do atendimento</Text>
        </View>

        <View className="px-6 pt-6 pb-10">
          {/* Descrição */}
          <Text className="text-sm font-medium text-gray-700 mb-1">Descrição</Text>
          <TextInput
            className="bg-input-bg border border-border rounded-xl px-4 py-3 text-sm text-gray-800 mb-4"
            placeholder="Descreva brevemente o motivo do atendimento..."
            placeholderTextColor="#A0AEC0"
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={3}
          />

          {/* Paciente */}
          <Text className="text-sm font-medium text-gray-700 mb-1">Paciente</Text>
          <TextInput
            className="bg-input-bg border border-border rounded-xl px-4 h-12 text-sm text-gray-800 mb-1"
            placeholder="Buscar por nome ou CPF..."
            placeholderTextColor="#A0AEC0"
            value={pacienteBusca}
            onChangeText={buscarPacientes}
          />
          {showPacientes && (
            <View className="border border-border rounded-xl mb-4 overflow-hidden">
              {pacientes.length === 0 ? (
                <Text className="text-muted text-sm p-3">Nenhum paciente encontrado.</Text>
              ) : (
                pacientes.map((p) => (
                  <TouchableOpacity
                    key={p.id_usuario}
                    onPress={() => selecionarPaciente(p)}
                    className="px-4 py-3 border-b border-border last:border-b-0"
                  >
                    <Text className="text-sm text-gray-800 font-medium">{p.nome}</Text>
                    <Text className="text-xs text-muted">{p.cpf}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
          {pacienteSelecionado && !showPacientes && (
            <View className="bg-success-bg border border-success-border rounded-xl px-4 py-2 mb-4">
              <View className="flex-row items-center gap-1">
                <MaterialIcons name="check" size={14} color="#276749" />
                <Text className="text-success-text text-xs">{pacienteSelecionado.nome}</Text>
              </View>
            </View>
          )}

          {/* Formulários */}
          <Text className="text-sm font-medium text-gray-700 mb-1">Formulários a aplicar</Text>
          <TextInput
            className="bg-input-bg border border-border rounded-xl px-4 h-10 text-sm text-gray-800 mb-3"
            placeholder="Buscar formulários..."
            placeholderTextColor="#A0AEC0"
            value={formBusca}
            onChangeText={setFormBusca}
          />
          {formsFiltrados.map((f) => {
            const sel = selectedForms.has(f.id_formulario);
            return (
              <TouchableOpacity
                key={f.id_formulario}
                onPress={() => toggleForm(f.id_formulario)}
                className={`flex-row items-start p-4 rounded-xl mb-2 border ${sel ? 'bg-primary/5 border-primary' : 'bg-white border-border'}`}
              >
                <View className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${sel ? 'bg-primary border-primary' : 'bg-white border-border'}`}>
                  {sel && <MaterialIcons name="check" size={12} color="white" />}
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-primary font-semibold mb-0.5">
                    {f.tipo_formulario?.nome ?? 'Geral'}
                  </Text>
                  <Text className="text-sm text-gray-800 font-medium">{f.nome}</Text>
                  <Text className="text-xs text-muted" numberOfLines={1}>{f.descricao}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View className="flex-row gap-3 mt-6">
            <View className="flex-1">
              <PrimaryButton label="Cancelar" onPress={() => navigation.goBack()} variant="outlined" />
            </View>
            <View className="flex-1">
              <PrimaryButton label="Confirmar" onPress={handleConfirmar} loading={loading} />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
