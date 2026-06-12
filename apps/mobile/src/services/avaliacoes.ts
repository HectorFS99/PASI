import api from '../config/api';

export interface Avaliacao {
  id_formulario_avaliacao: number;
  observacao: string;
  dt_avaliacao: string;
  usuario: { id_usuario: number; nome: string };
}

export const avaliacoesService = {
  // Registra a avaliação de um formulário respondido (observação obrigatória).
  avaliar: (idAtendimento: number, idFormulario: number, observacao: string) =>
    api
      .post<Avaliacao[]>(
        `/atendimentos/${idAtendimento}/formularios/${idFormulario}/avaliacoes`,
        { observacao },
      )
      .then((r) => r.data),

  listar: (idAtendimento: number, idFormulario: number) =>
    api
      .get<Avaliacao[]>(
        `/atendimentos/${idAtendimento}/formularios/${idFormulario}/avaliacoes`,
      )
      .then((r) => r.data),
};
