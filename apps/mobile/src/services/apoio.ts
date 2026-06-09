import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({ baseURL: API_BASE_URL });

export const apoioService = {
  getProfissoes: () =>
    api.get('/apoio/profissoes').then((r) => r.data as { id_profissao: number; nome: string }[]),

  getUnidades: () =>
    api.get('/apoio/unidades-atendimento').then((r) => r.data as { id_unidade_atendimento: number; nome: string }[]),

  getGeneros: () =>
    api.get('/apoio/generos').then((r) => r.data as { id_genero: number; nome: string }[]),
};

export const buscarCep = async (cep: string) => {
  const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
  if (data.erro) return null;
  return data as {
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
  };
};
