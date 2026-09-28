import { MaterialIcons } from '@expo/vector-icons';
import { CriarPerguntaPayload } from '../../services/formularios';
import { TipoPergunta, TIPOS_COM_OPCOES } from '../../constants/dominio';

type IconName = keyof typeof MaterialIcons.glyphMap;

/**
 * "Escala numérica" existe só na interface: é gravada como NUMERO com
 * faixa mínima/máxima.
 */
export const TIPO_ESCALA = -2;

export const TIPOS_RESPOSTA: { id: number; label: string; descricao: string; icone: IconName }[] = [
  { id: TipoPergunta.TEXTO, label: 'Texto longo', descricao: 'Resposta com múltiplas linhas', icone: 'notes' },
  { id: TipoPergunta.NUMERO, label: 'Número', descricao: 'Somente números inteiros ou decimais', icone: 'tag' },
  { id: TipoPergunta.BOOLEANO, label: 'Sim / Não', descricao: 'Resposta binária', icone: 'toggle-on' },
  { id: TipoPergunta.ESCOLHA_MULTIPLA, label: 'Múltipla escolha', descricao: 'O respondente escolhe uma ou mais opções', icone: 'check-box' },
  { id: TipoPergunta.ESCOLHA_UNICA, label: 'Seleção única', descricao: 'O respondente escolhe exatamente uma opção', icone: 'radio-button-checked' },
  { id: TIPO_ESCALA, label: 'Escala numérica', descricao: 'Avaliação em escala (ex: 0 a 10)', icone: 'linear-scale' },
];

export function tipoRespostaLabel(id: number): string {
  return TIPOS_RESPOSTA.find((t) => t.id === id)?.label ?? 'Tipo desconhecido';
}

export interface OpcaoDraft {
  key: string;
  texto: string;
}

/** Pergunta em edição, antes de virar payload da API. */
export interface PerguntaDraft {
  texto: string;
  tipoId: number;
  obrigatoria: boolean;
  valorMin: string;
  valorMax: string;
  opcoes: OpcaoDraft[];
}

export const PERGUNTA_VAZIA: PerguntaDraft = {
  texto: '',
  tipoId: TipoPergunta.TEXTO,
  obrigatoria: true,
  valorMin: '',
  valorMax: '',
  opcoes: [
    { key: '1', texto: '' },
    { key: '2', texto: '' },
  ],
};

export function gerarKey() {
  return Math.random().toString(36).slice(2);
}

/** Valida o rascunho e monta o payload da API, ou devolve a mensagem de erro. */
export function montarPayloadPergunta(
  draft: PerguntaDraft,
): { payload: CriarPerguntaPayload; erro?: undefined } | { erro: string; payload?: undefined } {
  if (!draft.texto.trim()) return { erro: 'Digite o texto da pergunta.' };

  const precisaOpcoes = TIPOS_COM_OPCOES.includes(draft.tipoId);
  const opcoes = draft.opcoes.filter((o) => o.texto.trim());
  if (precisaOpcoes && opcoes.length < 2) {
    return { erro: 'Perguntas de escolha precisam de pelo menos 2 opções.' };
  }

  const usaFaixa = draft.tipoId === TipoPergunta.NUMERO || draft.tipoId === TIPO_ESCALA;

  return {
    payload: {
      pergunta: draft.texto.trim(),
      id_tipo_pergunta: draft.tipoId === TIPO_ESCALA ? TipoPergunta.NUMERO : draft.tipoId,
      obrigatoria: draft.obrigatoria,
      ...(usaFaixa
        ? {
            valor_minimo: draft.valorMin !== '' ? Number(draft.valorMin) : undefined,
            valor_maximo: draft.valorMax !== '' ? Number(draft.valorMax) : undefined,
          }
        : {}),
      ...(precisaOpcoes
        ? { opcoes: opcoes.map((o) => ({ texto_opcao: o.texto.trim() })) }
        : {}),
    },
  };
}
