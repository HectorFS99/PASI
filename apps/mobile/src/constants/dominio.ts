/**
 * Identificadores fixos das tabelas de domínio — espelham
 * apps/api/src/common/constants.ts (carga inicial do DDL).
 */

export const TipoUsuario = {
  PROFISSIONAL: 1,
  PACIENTE: 2,
} as const;

/** situacao_atendimento */
export const SituacaoAtendimento = {
  CRIADO: 1,
  INICIADO: 2,
  RESPONDIDO: 3,
  EM_AVALIACAO: 4,
  AVALIADO: 5,
  ENCERRADO: 6,
  INATIVO: 7,
} as const;

/**
 * situacao_formulario. Atenção: "respondido/bloqueado" é `>= RESPONDIDO`
 * (Em avaliação e Avaliado também bloqueiam edição pelo paciente).
 */
export const SituacaoFormulario = {
  RASCUNHO: 1,
  RESPONDIDO: 2,
  EM_AVALIACAO: 3,
  AVALIADO: 4,
} as const;

/** tipo_pergunta */
export const TipoPergunta = {
  TEXTO: 1,
  NUMERO: 2,
  BOOLEANO: 3,
  ESCOLHA_UNICA: 4,
  ESCOLHA_MULTIPLA: 5,
} as const;

/** Tipos de pergunta respondidos por opções cadastradas. */
export const TIPOS_COM_OPCOES: number[] = [TipoPergunta.ESCOLHA_UNICA, TipoPergunta.ESCOLHA_MULTIPLA];

/** Situações de atendimento oferecidas nos filtros (Inativo não é listado). */
export const SITUACOES_ATENDIMENTO_OPCOES: { value: number; label: string }[] = [
  { value: SituacaoAtendimento.CRIADO, label: 'Criado' },
  { value: SituacaoAtendimento.INICIADO, label: 'Iniciado' },
  { value: SituacaoAtendimento.RESPONDIDO, label: 'Respondido' },
  { value: SituacaoAtendimento.EM_AVALIACAO, label: 'Em avaliação' },
  { value: SituacaoAtendimento.AVALIADO, label: 'Avaliado' },
  { value: SituacaoAtendimento.ENCERRADO, label: 'Encerrado' },
];

/** Valores aceitos na coluna usuario.sexo. */
export type Sexo = 'M' | 'F' | 'O';

export const SEXO_OPCOES: { value: Sexo; label: string }[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'O', label: 'Outro' },
];
