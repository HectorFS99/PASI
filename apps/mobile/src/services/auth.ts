import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({ baseURL: API_BASE_URL });

export interface LoginPayload {
  login: string;
  senha: string;
}

export interface CadastroProfissionalPayload {
  nome: string;
  cpf: string;
  email: string;
  tel_celular: string;
  sexo: string;
  id_profissao: number;
  id_unidade_atendimento: number;
  senha: string;
}

export interface CadastroPacientePayload {
  nome: string;
  cpf: string;
  email: string;
  tel_celular: string;
  sexo: string;
  dt_nascimento?: string;
  nac_estrangeira?: boolean;
  id_genero?: number;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  senha: string;
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post('/auth/login', payload).then((r) => r.data),

  cadastrarProfissional: (payload: CadastroProfissionalPayload) =>
    api.post('/usuarios/profissional', payload).then((r) => r.data),

  cadastrarPaciente: (payload: CadastroPacientePayload) =>
    api.post('/usuarios/paciente', payload).then((r) => r.data),

  esqueceuSenha: (email: string) =>
    api.post('/auth/esqueceu-senha', { email }).then((r) => r.data),
};
