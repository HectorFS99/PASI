import api from '../config/api';

export interface Paciente {
  id_usuario: number;
  nome: string;
  cpf: string;
  email: string;
}

export interface FormularioResumo {
  id_formulario: number;
  nome?: string;
  descricao?: string;
}

export interface StatusFormularioPaciente {
  id_formulario: number;
  id_situacao_formulario: number;
  situacao_formulario: { nome: string } | null;
}

export interface AtendimentoFormulario {
  id_atendimento_formulario: number;
  id_formulario: number;
  dt_atribuicao?: string;
  formulario: FormularioResumo;
  status_formulario_paciente?: StatusFormularioPaciente | null;
}

export interface Atendimento {
  id_atendimento: number;
  descricao?: string;
  id_usuario_paciente: number;
  id_situacao_atendimento: number;
  dt_cadastro?: string;
  situacao_atendimento: { id_situacao_atendimento: number; nome: string };
  usuario_atendimento_id_usuario_pacienteTousuario: Paciente;
  atendimento_formulario: AtendimentoFormulario[];
}

export interface ListaAtendimentos {
  data: Atendimento[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const atendimentosService = {
  listar: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<ListaAtendimentos>('/atendimentos', { params }).then((r) => r.data),

  buscar: (id: number) => api.get<Atendimento>(`/atendimentos/${id}`).then((r) => r.data),

  criar: (data: { descricao?: string; id_usuario_paciente: number; formularios: number[] }) =>
    api.post<Atendimento>('/atendimentos', data).then((r) => r.data),

  atualizar: (id: number, data: { descricao?: string; id_usuario_paciente?: number }) =>
    api.patch<Atendimento>(`/atendimentos/${id}`, data).then((r) => r.data),

  atribuirFormularios: (id: number, formularios: number[]) =>
    api.post<Atendimento>(`/atendimentos/${id}/formularios`, { formularios }).then((r) => r.data),

  removerFormulario: (id: number, idFormulario: number) =>
    api.delete(`/atendimentos/${id}/formularios/${idFormulario}`).then((r) => r.data),

  encerrar: (id: number) =>
    api.patch<Atendimento>(`/atendimentos/${id}/encerrar`).then((r) => r.data),

  listarPacientes: (search?: string) =>
    api.get<Paciente[]>('/usuarios/pacientes', { params: { search } }).then((r) => r.data),
};
