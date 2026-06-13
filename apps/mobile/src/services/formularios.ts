import api from '../config/api';

// -------------------------------------------------------
// Interfaces paciente (usadas em ResponderFormulario)
// -------------------------------------------------------
export interface FormularioItem {
  id_formulario: number;
  nome?: string;
  descricao?: string;
  ativo?: boolean;
  tipo_formulario?: { id_tipo_formulario?: number; nome?: string };
  _count?: { pergunta: number; formulario_paciente?: number };
}

export interface ListaFormularios {
  data: FormularioItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Opcao {
  id_opcao: number;
  texto_opcao: string;
  valor_opcao?: number;
}

export interface Pergunta {
  id_pergunta: number;
  id_tipo_pergunta: number;
  pergunta: string;
  valor_minimo?: number;
  valor_maximo?: number;
  obrigatoria?: boolean;
  tipo_pergunta: { nome?: string };
  opcao_pergunta: Opcao[];
}

export interface RespostaAtual {
  id_resposta: number;
  id_pergunta: number;
  valor_texto?: string;
  valor_numero?: number;
  valor_binario?: boolean;
  valor_data?: string;
}

export interface DetalheFormulario {
  atendimento: { id_atendimento: number; id_situacao_atendimento: number };
  formulario_paciente: {
    id_formulario_paciente: number;
    id_situacao_formulario: number;
  } | null;
  formulario: {
    id_formulario: number;
    nome?: string;
    descricao?: string;
    documentos?: { id_documento: number; caminho: string; nome_fisico?: string }[];
    pergunta: Pergunta[];
  };
  respostas: RespostaAtual[];
}

export interface RespostaItem {
  id_pergunta: number;
  valor_texto?: string;
  valor_numero?: number;
  valor_binario?: boolean;
  valor_data?: string;
  id_opcoes?: number[];
}

export const formulariosService = {
  listar: (params?: { page?: number; limit?: number; search?: string; ativo?: boolean }) =>
    api.get<ListaFormularios>('/formularios', { params }).then((r) => r.data),

  iniciar: (idAtendimento: number, idFormulario: number) =>
    api
      .post<DetalheFormulario>(
        `/atendimentos/${idAtendimento}/formularios/${idFormulario}/iniciar`,
      )
      .then((r) => r.data),

  detalhar: (idAtendimento: number, idFormulario: number) =>
    api
      .get<DetalheFormulario>(
        `/atendimentos/${idAtendimento}/formularios/${idFormulario}/respostas`,
      )
      .then((r) => r.data),

  salvar: (idAtendimento: number, idFormulario: number, respostas: RespostaItem[]) =>
    api
      .put<DetalheFormulario>(
        `/atendimentos/${idAtendimento}/formularios/${idFormulario}/respostas`,
        { respostas },
      )
      .then((r) => r.data),

  concluir: (idAtendimento: number, idFormulario: number) =>
    api
      .post(`/atendimentos/${idAtendimento}/formularios/${idFormulario}/concluir`)
      .then((r) => r.data),
};

// -------------------------------------------------------
// Interfaces & serviço admin (profissional gerencia formulários)
// -------------------------------------------------------
export interface FormularioAdmin {
  id_formulario: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  dt_cadastro?: string;
  tipo_formulario: { id_tipo_formulario: number; nome: string };
  _count?: { pergunta: number; formulario_paciente?: number };
  pergunta?: PerguntaAdmin[];
}

export interface PerguntaAdmin {
  id_pergunta: number;
  pergunta: string;
  id_tipo_pergunta: number;
  obrigatoria: boolean;
  valor_minimo?: number;
  valor_maximo?: number;
  tipo_pergunta: { id_tipo_pergunta: number; nome: string };
  opcao_pergunta: OpcaoAdmin[];
}

export interface OpcaoAdmin {
  id_opcao: number;
  texto_opcao: string;
  valor_opcao?: number;
}

export interface ListaFormulariosAdmin {
  data: FormularioAdmin[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FiltrosFormulario {
  page?: number;
  search?: string;
  id_tipo_formulario?: number;
  ativo?: boolean;
  data_inicio?: string;
  data_fim?: string;
  ordenar_por?: 'data_desc' | 'data_asc' | 'nome' | 'mais_respondidos';
}

export interface CriarFormularioPayload {
  id_tipo_formulario: number;
  nome: string;
  descricao?: string;
  perguntas?: CriarPerguntaPayload[];
}

export interface CriarPerguntaPayload {
  pergunta: string;
  id_tipo_pergunta: number;
  obrigatoria?: boolean;
  valor_minimo?: number;
  valor_maximo?: number;
  opcoes?: { texto_opcao: string; valor_opcao?: number }[];
}

export interface AtualizarFormularioPayload {
  id_tipo_formulario?: number;
  nome?: string;
  descricao?: string;
}

export const formulariosAdminService = {
  listar: (params?: FiltrosFormulario) =>
    api.get<ListaFormulariosAdmin>('/formularios', { params }).then((r) => r.data),

  buscar: (id: number) =>
    api.get<FormularioAdmin>(`/formularios/${id}`).then((r) => r.data),

  criar: (payload: CriarFormularioPayload) =>
    api.post<FormularioAdmin>('/formularios', payload).then((r) => r.data),

  atualizar: (id: number, payload: AtualizarFormularioPayload) =>
    api.patch<FormularioAdmin>(`/formularios/${id}`, payload).then((r) => r.data),

  desativar: (id: number) =>
    api.patch<FormularioAdmin>(`/formularios/${id}/desativar`).then((r) => r.data),

  reativar: (id: number) =>
    api.patch<FormularioAdmin>(`/formularios/${id}/reativar`).then((r) => r.data),

  adicionarPergunta: (id: number, payload: CriarPerguntaPayload) =>
    api.post<FormularioAdmin>(`/formularios/${id}/perguntas`, payload).then((r) => r.data),

  atualizarPergunta: (id: number, idPergunta: number, payload: Partial<CriarPerguntaPayload>) =>
    api
      .patch<FormularioAdmin>(`/formularios/${id}/perguntas/${idPergunta}`, payload)
      .then((r) => r.data),

  removerPergunta: (id: number, idPergunta: number) =>
    api.delete<FormularioAdmin>(`/formularios/${id}/perguntas/${idPergunta}`).then((r) => r.data),
};
