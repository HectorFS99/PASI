import api from '../config/api';

export interface UsuarioCompleto {
  id_usuario: number;
  id_tipo_usuario: number;
  id_genero?: number | null;
  nome: string;
  sexo: string;
  dt_nascimento?: string | null;
  cpf: string;
  email: string;
  tel_celular: string;
  nac_estrangeira?: boolean | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pais?: string | null;
  id_profissao?: number | null;
  id_unidade_atendimento?: number | null;
  dt_cadastro?: string | null;
}

export interface AtualizarPerfilPayload {
  nome?: string;
  email?: string;
  tel_celular?: string;
  sexo?: string;
  dt_nascimento?: string | null;
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
}

export const usuariosService = {
  me: () => api.get('/usuarios/me').then((r) => r.data as UsuarioCompleto),

  atualizarPerfil: (payload: AtualizarPerfilPayload) =>
    api.patch('/usuarios/me', payload).then((r) => r.data as UsuarioCompleto),
};
