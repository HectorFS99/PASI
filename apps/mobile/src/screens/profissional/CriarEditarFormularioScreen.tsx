import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ProfissionalNavProp, ProfissionalStackParamList } from '../../navigation/types';
import {
  formulariosAdminService,
  PerguntaAdmin,
  CriarPerguntaPayload,
} from '../../services/formularios';
import { apoioService } from '../../services/apoio';
import { ScreenHeader } from '../../components/ScreenHeader';
import { FormFooter } from '../../components/FormFooter';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ChipGroup, ChipOption } from '../../components/ChipGroup';
import { PerguntaEditor } from '../../components/formulario/PerguntaEditor';
import { PerguntaResumoItem } from '../../components/formulario/PerguntaResumoItem';
import {
  PerguntaDraft,
  PERGUNTA_VAZIA,
  montarPayloadPergunta,
} from '../../components/formulario/perguntaDraft';
import { useFeedback } from '../../context/FeedbackContext';
import { colors } from '../../constants/colors';
import { mensagemErroApi } from '../../utils/errors';

type RouteT = RouteProp<ProfissionalStackParamList, 'CriarEditarFormulario'>;

/**
 * Pergunta listada na tela. No modo criar ainda não existe na API:
 * recebe id negativo e guarda o payload para enviar no Confirmar.
 */
type PerguntaListada = PerguntaAdmin & { _draft?: CriarPerguntaPayload };

function perguntaLocal(payload: CriarPerguntaPayload): PerguntaListada {
  return {
    id_pergunta: -Date.now(),
    pergunta: payload.pergunta,
    id_tipo_pergunta: payload.id_tipo_pergunta,
    obrigatoria: payload.obrigatoria ?? true,
    valor_minimo: payload.valor_minimo,
    valor_maximo: payload.valor_maximo,
    tipo_pergunta: { id_tipo_pergunta: payload.id_tipo_pergunta, nome: '' },
    opcao_pergunta: (payload.opcoes ?? []).map((o, i) => ({
      id_opcao: -i,
      texto_opcao: o.texto_opcao,
      valor_opcao: o.valor_opcao,
    })),
    _draft: payload,
  };
}

export function CriarEditarFormularioScreen() {
  const navigation = useNavigation<ProfissionalNavProp>();
  const { toast, confirm } = useFeedback();
  const { id, modo } = useRoute<RouteT>().params;
  const isEditar = modo === 'editar' && !!id;

  const [loadingInicial, setLoadingInicial] = useState(isEditar);
  const [saving, setSaving] = useState(false);

  const [tiposFormulario, setTiposFormulario] = useState<ChipOption<number>[]>([]);
  const [idTipoFormulario, setIdTipoFormulario] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const [perguntas, setPerguntas] = useState<PerguntaListada[]>([]);
  const [draft, setDraft] = useState<PerguntaDraft>(PERGUNTA_VAZIA);

  useEffect(() => {
    apoioService
      .getTiposFormulario()
      .then((tipos) => {
        setTiposFormulario(tipos.map((t) => ({ value: t.id_tipo_formulario, label: t.nome })));
        if (!isEditar && tipos.length > 0) setIdTipoFormulario(tipos[0].id_tipo_formulario);
      })
      .catch(() => {});

    if (isEditar && id) {
      formulariosAdminService
        .buscar(id)
        .then((f) => {
          setNome(f.nome ?? '');
          setDescricao(f.descricao ?? '');
          setIdTipoFormulario(f.tipo_formulario.id_tipo_formulario);
          setPerguntas(f.pergunta ?? []);
        })
        .catch(() => {
          toast('Não foi possível carregar o formulário.', 'error');
          navigation.goBack();
        })
        .finally(() => setLoadingInicial(false));
    }
  }, []);

  const handleIncluirPergunta = async () => {
    const { payload, erro } = montarPayloadPergunta(draft);
    if (erro !== undefined) {
      toast(erro, 'error');
      return;
    }

    if (!isEditar || !id) {
      // Modo criar: acumula localmente e envia tudo no Confirmar.
      setPerguntas((prev) => [...prev, perguntaLocal(payload)]);
      setDraft(PERGUNTA_VAZIA);
      return;
    }

    // Modo editar: inclui na API imediatamente.
    setSaving(true);
    try {
      const atualizado = await formulariosAdminService.adicionarPergunta(id, payload);
      setPerguntas(atualizado.pergunta ?? []);
      setDraft(PERGUNTA_VAZIA);
      toast('Pergunta adicionada.', 'success');
    } catch (err) {
      toast(mensagemErroApi(err, 'Não foi possível adicionar a pergunta.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoverPergunta = async (p: PerguntaListada) => {
    if (p.id_pergunta < 0) {
      setPerguntas((prev) => prev.filter((x) => x.id_pergunta !== p.id_pergunta));
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
      setPerguntas(atualizado.pergunta ?? []);
      toast('Pergunta removida.', 'success');
    } catch (err) {
      toast(mensagemErroApi(err, 'Não foi possível remover.'), 'error');
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
      } else {
        const novas = perguntas.flatMap((p) => (p._draft ? [p._draft] : []));
        await formulariosAdminService.criar({
          id_tipo_formulario: idTipoFormulario,
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          perguntas: novas.length > 0 ? novas : undefined,
        });
        toast('Formulário criado com sucesso.', 'success');
      }
      navigation.goBack();
    } catch (err) {
      toast(mensagemErroApi(err, 'Não foi possível salvar o formulário.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInicial) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        title={isEditar ? 'Editar Formulário' : 'Criar Formulário'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ---- Informações Básicas ---- */}
        <Text className="text-primary font-bold text-sm mb-3">Informações Básicas</Text>

        <Text className="text-sm font-medium text-gray-700 mb-2">Tipo de formulário *</Text>
        <View className="mb-4">
          <ChipGroup
            options={tiposFormulario}
            selected={idTipoFormulario !== null ? [idTipoFormulario] : []}
            onToggle={setIdTipoFormulario}
          />
        </View>

        <InputField
          label="Título do formulário *"
          placeholder="Ex: Avaliação Social Inicial"
          value={nome}
          onChangeText={setNome}
          maxLength={50}
          counter
        />

        <InputField
          label="Descrição"
          placeholder="Descreva o objetivo deste formulário..."
          value={descricao}
          onChangeText={setDescricao}
          multiline
          maxLength={500}
          counter
        />

        {/* ---- Perguntas já incluídas ---- */}
        {perguntas.length > 0 && (
          <>
            <Text className="text-primary font-bold text-sm mb-3 mt-1">
              Perguntas ({perguntas.length})
            </Text>
            {perguntas.map((p, idx) => (
              <PerguntaResumoItem
                key={p.id_pergunta}
                numero={idx + 1}
                texto={p.pergunta}
                tipoId={p.id_tipo_pergunta}
                obrigatoria={p.obrigatoria}
                onRemover={() => handleRemoverPergunta(p)}
              />
            ))}
            <View className="h-px bg-border my-5" />
          </>
        )}

        {/* ---- Nova pergunta ---- */}
        <PerguntaEditor
          draft={draft}
          onChange={setDraft}
          onIncluir={handleIncluirPergunta}
          incluindo={saving}
        />
      </ScrollView>

      <FormFooter>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <PrimaryButton label="Cancelar" onPress={() => navigation.goBack()} variant="outlined" />
          </View>
          <View className="flex-1">
            <PrimaryButton
              label={isEditar ? 'Salvar' : 'Confirmar'}
              onPress={handleConfirmar}
              loading={saving}
            />
          </View>
        </View>
      </FormFooter>
    </KeyboardAvoidingView>
  );
}
