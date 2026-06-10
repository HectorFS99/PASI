import axios from 'axios';
import api from '../config/api';

export const apoioService = {
  getProfissoes: () =>
    api.get('/apoio/profissoes').then((r) => r.data as { id_profissao: number; nome: string }[]),

  getUnidades: () =>
    api.get('/apoio/unidades-atendimento').then((r) => r.data as { id_unidade_atendimento: number; nome: string }[]),

  getGeneros: () =>
    api.get('/apoio/generos').then((r) => r.data as { id_genero: number; nome: string }[]),

  getTiposFormulario: () =>
    api.get('/apoio/tipos-formulario').then((r) => r.data as { id_tipo_formulario: number; nome: string }[]),

  getTiposPergunta: () =>
    api.get('/apoio/tipos-pergunta').then((r) => r.data as { id_tipo_pergunta: number; nome: string }[]),

  getSituacoesAtendimento: () =>
    api.get('/apoio/situacoes-atendimento').then((r) => r.data as { id_situacao_atendimento: number; nome: string }[]),
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
