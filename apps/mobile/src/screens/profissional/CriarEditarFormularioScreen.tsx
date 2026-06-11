import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfissionalNavProp, ProfissionalStackParamList } from '../../navigation/types';
import {
  formulariosAdminService,
  FormularioAdmin,
  PerguntaAdmin,
  CriarPerguntaPayload,
} from '../../services/formularios';
import { apoioService } from '../../services/apoio';
import { useFeedback } from '../../context/FeedbackContext';

type RouteT = RouteProp<ProfissionalStackParamList, 'CriarEditarFormulario'>;
type IconName = keyof typeof MaterialIcons.glyphMap;

const TIPOS_RESPOSTA: { id: number; label: string; descricao: string; icone: IconName }[] = [
  { id: 1,  label: 'Texto longo',     descricao: 'Resposta com múltiplas linhas',               icone: 'notes' },
  { id: 2,  label: 'Número',          descricao: 'Somente números inteiros ou decimais',         icone: 'tag' },
  { id: 3,  label: 'Sim / Não',       descricao: 'Resposta binária',                             icone: 'toggle-on' },
  { id: 5,  label: 'Múltipla escolha',descricao: 'O respondente escolhe uma ou mais opções',    icone: 'check-box' },
  { id: 4,  label: 'Seleção única',   descricao: 'O respondente escolhe exatamente uma opção',  icone: 'radio-button-checked' },
  { id: -2, label: 'Escala numérica', descricao: 'Avaliação em escala (ex: 0 a 10)',            icone: 'linear-scale' },
];

interface OpcaoDraft {
  key: string;
  texto: string;
}

interface PerguntaDraft {
  texto: string;
  tipoId: number;
  obrigatoria: boolean;
  valorMin: string;
  valorMax: string;
  opcoes: OpcaoDraft[];
}

const PERGUNTA_VAZIA: PerguntaDraft = {
  texto: '',
  tipoId: 1,
  obrigatoria: true,
  valorMin: '',
  valorMax: '',
  opcoes: [
    { key: '1', texto: '' },
    { key: '2', texto: '' },
  ],
};

function gerarKey() {
  return Math.random().toString(36).slice(2);
}

export function CriarEditarFormularioScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const insets = useSafeAreaInsets();
  const { toast, confirm } = useFeedback();
  const { id, modo } = useRoute<RouteT>().params;
  const isEditar = modo === 'editar' && !!id;

  const [loadingInicial, setLoadingInicial] = useState(isEditar);
  const [saving, setSaving] = useState(false);

  const [tiposFormulario, setTiposFormulario] = useState<{ id_tipo_formulario: number; nome: string }[]>([]);
  const [idTipoFormulario, setIdTipoFormulario] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const [perguntasExistentes, setPerguntasExistentes] = useState<PerguntaAdmin[]>([]);
  const [draft, setDraft] = useState<PerguntaDraft>(PERGUNTA_VAZIA);

  const carregarTipos = useCallback(async () => {
    try {
      const tipos = await apoioService.getTiposFormulario();
      setTiposFormulario(tipos);
      if (!isEditar && tipos.length > 0) {
        setIdTipoFormulario(tipos[0].id_tipo_formulario);
      }
    } catch {}
  }, [isEditar]);

  const carregarFormulario = useCallback(async () => {
    if (!id) return;
    try {
      const f = await formulariosAdminService.buscar(id);
      setNome(f.nome ?? '');
      setDescricao(f.descricao ?? '');
      setIdTipoFormulario(f.tipo_formulario.id_tipo_formulario);
      setPerguntasExistentes(f.pergunta ?? []);
    } catch {
      toast('Não foi possível carregar o formulário.', 'error');
      navigation.goBack();
    } finally {
      setLoadingInicial(false);
    }
  }, [id]);

  useEffect(() => {
    carregarTipos();
    if (isEditar) carregarFormulario();
  }, []);

  const setDraftField = <K extends keyof PerguntaDraft>(k: K, v: PerguntaDraft[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  const addOpcao = () =>
    setDraft((p) => ({
      ...p,
      opcoes: [...p.opcoes, { key: gerarKey(), texto: '' }],
    }));

  const removeOpcao = (key: string) =>
    setDraft((p) => ({
      ...p,
      opcoes: p.opcoes.filter((o) => o.key !== key),
    }));

  const updateOpcao = (key: string, texto: string) =>
    setDraft((p) => ({
      ...p,
      opcoes: p.opcoes.map((o) => (o.key === key ? { ...o, texto } : o)),
    }));

  const precisaOpcoes = draft.tipoId === 4 || draft.tipoId === 5;
  const ehEscala = draft.tipoId === -2;
  const ehNumero = draft.tipoId === 2;

  const handleIncluirPergunta = async () => {
    if (!draft.texto.trim()) {
      toast('Digite o texto da pergunta.', 'error');
      return;
    }
    if (precisaOpcoes) {
      const opcoesValidas = draft.opcoes.filter((o) => o.texto.trim());
      if (opcoesValidas.length < 2) {
        toast('Perguntas de escolha precisam de pelo menos 2 opções.', 'error');
        return;
      }
    }

    const tipoReal = draft.tipoId === -2 ? 2 : draft.tipoId;

    const payload: CriarPerguntaPayload = {
      pergunta: draft.texto.trim(),
      id_tipo_pergunta: tipoReal,
      obrigatoria: draft.obrigatoria,
      ...(ehEscala || ehNumero
        ? {
            valor_minimo: draft.valorMin !== '' ? Number(draft.valorMin) : undefined,
            valor_maximo: draft.valorMax !== '' ? Number(draft.valorMax) : undefined,
          }
        : {}),
      ...(precisaOpcoes
        ? {
            opcoes: draft.opcoes
              .filter((o) => o.texto.trim())
              .map((o) => ({ texto_opcao: o.texto.trim() })),
          }
        : {}),
    };

    if (isEditar && id) {
      setSaving(true);
      try {
        const atualizado = await formulariosAdminService.adicionarPergunta(id, payload);
        setPerguntasExistentes(atualizado.pergunta ?? []);
        setDraft(PERGUNTA_VAZIA);
        toast('Pergunta adicionada.', 'success');
      } catch (err: any) {
        toast(err?.response?.data?.message ?? 'Não foi possível adicionar a pergunta.', 'error');
      } finally {
        setSaving(false);
      }
    } else {
      setPerguntasExistentes((prev) => [
        ...prev,
        {
          id_pergunta: -Date.now(),
          pergunta: payload.pergunta,
          id_tipo_pergunta: tipoReal,
          obrigatoria: payload.obrigatoria ?? true,
          valor_minimo: payload.valor_minimo,
          valor_maximo: payload.valor_maximo,
          tipo_pergunta: { id_tipo_pergunta: tipoReal, nome: '' },
          opcao_pergunta: (payload.opcoes ?? []).map((o, i) => ({
            id_opcao: -i,
            texto_opcao: o.texto_opcao,
            valor_opcao: o.valor_opcao,
          })),
          _draft: payload,
        } as any,
      ]);
      setDraft(PERGUNTA_VAZIA);
    }
  };

  const handleRemoverPergunta = async (p: PerguntaAdmin) => {
    if (p.id_pergunta < 0) {
      setPerguntasExistentes((prev) => prev.filter((x) => x.id_pergunta !== p.id_pergunta));
      return;
    }
    const ok = await confirm({
      title: 'Remover pergunta',
      message: `Deseja remover "${p.pergunta}"?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (!ok || !id) return;
    try {
      const atualizado = await formulariosAdminService.removerPergunta(id, p.id_pergunta);
      setPerguntasExistentes(atualizado.pergunta ?? []);
      toast('Pergunta removida.', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Não foi possível remover.', 'error');
    }
  };

  const handleConfirmar = async () => {
    if (!nome.trim()) {
      toast('O título do formulário é obrigatório.', 'error');
      return;
    }
    if (!idTipoFormulario) {
      toast('Selecione o tipo do formulário.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEditar && id) {
        await formulariosAdminService.atualizar(id, {
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          id_tipo_formulario: idTipoFormulario,
        });
        toast('Formulário atualizado com sucesso.', 'success');
        navigation.goBack();
      } else {
        const draftPerguntas = perguntasExistentes
          .filter((p) => p.id_pergunta < 0)
          .map((p) => (p as any)._draft as CriarPerguntaPayload);

        await formulariosAdminService.criar({
          id_tipo_formulario: idTipoFormulario,
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          perguntas: draftPerguntas.length > 0 ? draftPerguntas : undefined,
        });
        toast('Formulário criado com sucesso.', 'success');
        navigation.goBack();
      }
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Não foi possível salvar o formulário.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInicial) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#0D2347" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View className="bg-primary px-6" style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: 16 }}>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">
            {isEditar ? 'Editar Formulário' : 'Criar Formulário'}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        {/* ---- Informações Básicas ---- */}
        <Text className="text-primary font-bold text-sm mb-3">Informações Básicas</Text>

        <Text className="text-xs text-gray-500 mb-1">Tipo de formulário *</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {tiposFormulario.map((t) => {
            const sel = idTipoFormulario === t.id_tipo_formulario;
            return (
              <TouchableOpacity
                key={t.id_tipo_formulario}
                onPress={() => setIdTipoFormulario(t.id_tipo_formulario)}
                className={`px-4 py-2 rounded-xl border ${sel ? 'bg-primary border-primary' : 'bg-white border-border'}`}
              >
                <Text className={`text-sm font-medium ${sel ? 'text-white' : 'text-gray-700'}`}>
                  {t.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-xs text-gray-500 mb-1">Título do formulário *</Text>
        <TextInput
          className="bg-input-bg border border-border rounded-xl px-4 h-12 text-sm text-gray-800 mb-4"
          placeholder="Ex: Avaliação Social Inicial"
          placeholderTextColor="#A0AEC0"
          value={nome}
          onChangeText={setNome}
        />

        <Text className="text-xs text-gray-500 mb-1">Descrição</Text>
        <TextInput
          className="bg-input-bg border border-border rounded-xl px-4 py-3 text-sm text-gray-800 mb-5"
          placeholder="Descreva o objetivo deste formulário..."
          placeholderTextColor="#A0AEC0"
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* ---- Perguntas Existentes ---- */}
        {perguntasExistentes.length > 0 && (
          <>
            <Text className="text-primary font-bold text-sm mb-3">
              Perguntas ({perguntasExistentes.length})
            </Text>
            {perguntasExistentes.map((p, idx) => (
              <View key={p.id_pergunta} className="bg-gray-50 border border-border rounded-2xl p-3 mb-2 flex-row items-start">
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Text className="text-white text-xs font-bold">{idx + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">{p.pergunta}</Text>
                  <Text className="text-xs text-muted mt-0.5">
                    {TIPOS_RESPOSTA.find((t) => t.id === p.id_tipo_pergunta)?.label ?? 'Tipo desconhecido'}
                    {p.obrigatoria ? ' · Obrigatória' : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoverPergunta(p)}
                  className="ml-2 w-6 h-6 items-center justify-center"
                >
                  <MaterialIcons name="close" size={18} color="#F87171" />
                </TouchableOpacity>
              </View>
            ))}
            <View className="h-px bg-border my-5" />
          </>
        )}

        {/* ---- Adicionar Pergunta ---- */}
        <Text className="text-primary font-bold text-sm mb-3">Adicionar Pergunta</Text>

        <Text className="text-xs text-gray-500 mb-1">Texto da pergunta *</Text>
        <TextInput
          className="bg-input-bg border border-border rounded-xl px-4 py-3 text-sm text-gray-800 mb-4"
          placeholder="Digite a pergunta..."
          placeholderTextColor="#A0AEC0"
          value={draft.texto}
          onChangeText={(t) => setDraftField('texto', t)}
          multiline
          textAlignVertical="top"
        />

        <Text className="text-xs text-gray-500 mb-2">Tipo de resposta *</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {TIPOS_RESPOSTA.map((tipo) => {
            const sel = draft.tipoId === tipo.id;
            return (
              <TouchableOpacity
                key={tipo.id}
                onPress={() => setDraftField('tipoId', tipo.id)}
                className={`flex-row items-center px-3 py-2 rounded-xl border ${sel ? 'bg-primary border-primary' : 'bg-white border-border'}`}
              >
                <MaterialIcons
                  name={tipo.icone}
                  size={16}
                  color={sel ? 'white' : '#374151'}
                  style={{ marginRight: 6 }}
                />
                <Text className={`text-xs font-medium ${sel ? 'text-white' : 'text-gray-700'}`}>
                  {tipo.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pré-visualização + inputs específicos do tipo */}
        <View className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 mb-4">
          <Text className="text-xs text-gray-400 mb-2">
            Pré-visualização: {TIPOS_RESPOSTA.find((t) => t.id === draft.tipoId)?.label}
          </Text>

          {/* TEXTO LONGO */}
          {draft.tipoId === 1 && (
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-sm text-gray-400"
              placeholder="O respondente digitará sua resposta aqui..."
              placeholderTextColor="#A0AEC0"
              multiline
              editable={false}
            />
          )}

          {/* NÚMERO */}
          {draft.tipoId === 2 && (
            <>
              <TextInput
                className="bg-white border border-border rounded-xl px-4 h-11 text-sm text-gray-400"
                placeholder="O respondente digitará um número..."
                placeholderTextColor="#A0AEC0"
                editable={false}
              />
              <View className="flex-row gap-3 mt-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Mínimo (opcional)</Text>
                  <TextInput
                    className="bg-white border border-border rounded-xl px-3 h-10 text-sm text-gray-800"
                    placeholder="0"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="numeric"
                    value={draft.valorMin}
                    onChangeText={(v) => setDraftField('valorMin', v)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Máximo (opcional)</Text>
                  <TextInput
                    className="bg-white border border-border rounded-xl px-3 h-10 text-sm text-gray-800"
                    placeholder="100"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="numeric"
                    value={draft.valorMax}
                    onChangeText={(v) => setDraftField('valorMax', v)}
                  />
                </View>
              </View>
            </>
          )}

          {/* SIM / NÃO */}
          {draft.tipoId === 3 && (
            <View className="flex-row gap-2">
              {['Sim', 'Não'].map((label) => (
                <View key={label} className="flex-1 h-11 rounded-xl border border-border bg-white items-center justify-center">
                  <Text className="text-gray-400 text-sm">{label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* MÚLTIPLA ESCOLHA / SELEÇÃO ÚNICA */}
          {(draft.tipoId === 4 || draft.tipoId === 5) && (
            <>
              {draft.opcoes.map((op, i) => (
                <View key={op.key} className="flex-row items-center mb-2">
                  <View className={`w-4 h-4 ${draft.tipoId === 4 ? 'rounded-full' : 'rounded'} border border-gray-300 mr-2 flex-shrink-0`} />
                  <TextInput
                    className="flex-1 bg-white border border-border rounded-xl px-3 h-9 text-sm text-gray-800"
                    placeholder={`Opção ${i + 1}`}
                    placeholderTextColor="#A0AEC0"
                    value={op.texto}
                    onChangeText={(t) => updateOpcao(op.key, t)}
                  />
                  {draft.opcoes.length > 2 && (
                    <TouchableOpacity onPress={() => removeOpcao(op.key)} className="ml-2 p-1">
                      <MaterialIcons name="close" size={16} color="#F87171" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={addOpcao} className="flex-row items-center mt-1">
                <Text className="text-primary text-sm font-medium">+ Adicionar opção</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ESCALA NUMÉRICA */}
          {draft.tipoId === -2 && (
            <>
              <View className="flex-row gap-3 mb-2">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Valor mínimo</Text>
                  <TextInput
                    className="bg-white border border-border rounded-xl px-3 h-10 text-sm text-gray-800"
                    placeholder="0"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="numeric"
                    value={draft.valorMin}
                    onChangeText={(v) => setDraftField('valorMin', v)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Valor máximo</Text>
                  <TextInput
                    className="bg-white border border-border rounded-xl px-3 h-10 text-sm text-gray-800"
                    placeholder="10"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="numeric"
                    value={draft.valorMax}
                    onChangeText={(v) => setDraftField('valorMax', v)}
                  />
                </View>
              </View>
              <View className="bg-white border border-border rounded-xl px-4 h-11 justify-center">
                <Text className="text-gray-400 text-sm italic">
                  Escala de {draft.valorMin || '0'} a {draft.valorMax || '10'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Obrigatória */}
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-sm text-gray-700">Pergunta obrigatória</Text>
          <Switch
            value={draft.obrigatoria}
            onValueChange={(v) => setDraftField('obrigatoria', v)}
            trackColor={{ false: '#E2E8F0', true: '#0D2347' }}
            thumbColor="#fff"
          />
        </View>

        {/* Botão Incluir Pergunta */}
        <TouchableOpacity
          onPress={handleIncluirPergunta}
          disabled={saving}
          className="h-12 bg-primary/10 border border-primary/30 rounded-2xl items-center justify-center mb-6"
        >
          {saving ? (
            <ActivityIndicator color="#0D2347" size="small" />
          ) : (
            <Text className="text-primary font-semibold">+ Incluir pergunta</Text>
          )}
        </TouchableOpacity>

        {/* Botões Cancelar / Confirmar */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="flex-1 h-12 border border-border rounded-2xl items-center justify-center"
          >
            <Text className="text-gray-600 font-medium">Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirmar}
            disabled={saving}
            className="flex-1 h-12 bg-primary rounded-2xl items-center justify-center"
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-semibold">
                {isEditar ? 'Salvar' : 'Confirmar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
