/**
 * Identificadores fixos das tabelas de domínio (carga inicial do DDL).
 * A ordem dos INSERTs no DDL define esses ids (IDENTITY começa em 1).
 */
export const TipoUsuario = {
  PROFISSIONAL: 1,
  PACIENTE: 2,
} as const;

/** situacao_atendimento (ordem da carga inicial do DDL). */
export const SituacaoAtendimento = {
  CRIADO: 1,
  INICIADO: 2,
  RESPONDIDO: 3,
  EM_AVALIACAO: 4,
  AVALIADO: 5,
  ENCERRADO: 6,
  INATIVO: 7,
} as const;

/** situacao_formulario (ordem da carga inicial do DDL). */
export const SituacaoFormulario = {
  RASCUNHO: 1,
  RESPONDIDO: 2,
} as const;

/** Regex de senha: mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 especial. */
export const SENHA_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const SENHA_MENSAGEM =
  'A senha deve ter no mínimo 8 caracteres, incluindo ao menos 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.';
