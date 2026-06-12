import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  SituacaoAtendimento,
  SituacaoFormulario,
  TipoPergunta,
  TipoUsuario,
} from '../common/constants';
import type { AuthUser } from '../auth/current-user.decorator';
import { RespostaItemDto, SalvarRespostasDto } from './dto/salvar-respostas.dto';

@Injectable()
export class RespostasService {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Iniciar o preenchimento de um formulário atribuído (paciente)
  // Cria o formulario_paciente em "Rascunho" e move o atendimento
  // de "Criado" para "Iniciado".
  // ----------------------------------------------------------------
  async iniciar(idAtendimento: number, idFormulario: number, user: AuthUser) {
    this.somentePaciente(user);
    const atendimento = await this.carregarAtendimentoDoPaciente(
      idAtendimento,
      idFormulario,
      user,
    );

    let fp = await this.acharFormularioPaciente(idFormulario, user.id_usuario);
    if (!fp) {
      fp = await this.prisma.formulario_paciente.create({
        data: {
          formulario: { connect: { id_formulario: idFormulario } },
          usuario: { connect: { id_usuario: user.id_usuario } },
          situacao_formulario: {
            connect: { id_situacao_formulario: SituacaoFormulario.RASCUNHO },
          },
        },
      });
    }

    if (atendimento.id_situacao_atendimento === SituacaoAtendimento.CRIADO) {
      await this.mudarSituacaoAtendimento(
        idAtendimento,
        SituacaoAtendimento.INICIADO,
      );
    }

    return this.detalhar(idAtendimento, idFormulario, user);
  }

  // ----------------------------------------------------------------
  // Detalhe do formulário para preenchimento/visualização, já com as
  // respostas atuais do paciente. Acessível ao paciente dono e ao
  // profissional (tela de avaliação).
  // ----------------------------------------------------------------
  async detalhar(idAtendimento: number, idFormulario: number, user: AuthUser) {
    const atendimento = await this.acharAtendimento(idAtendimento);
    this.garantirFormularioAtribuido(atendimento, idFormulario);

    const idPaciente = atendimento.id_usuario_paciente;
    if (
      user.tipo === TipoUsuario.PACIENTE &&
      idPaciente !== user.id_usuario
    ) {
      throw new ForbiddenException('Este atendimento não pertence a você.');
    }

    const formulario = await this.prisma.formulario.findUnique({
      where: { id_formulario: idFormulario },
      include: {
        tipo_formulario: true,
        pergunta: {
          orderBy: { id_pergunta: 'asc' },
          include: {
            tipo_pergunta: true,
            opcao_pergunta: { orderBy: { id_opcao: 'asc' } },
          },
        },
      },
    });
    if (!formulario) {
      throw new NotFoundException('Formulário não encontrado');
    }

    const fp = await this.acharFormularioPaciente(idFormulario, idPaciente);
    const respostas = fp
      ? await this.prisma.resposta.findMany({
          where: { id_formulario_paciente: fp.id_formulario_paciente },
          orderBy: { id_resposta: 'asc' },
        })
      : [];

    return {
      atendimento: {
        id_atendimento: atendimento.id_atendimento,
        id_situacao_atendimento: atendimento.id_situacao_atendimento,
      },
      formulario_paciente: fp,
      formulario,
      respostas,
    };
  }

  // ----------------------------------------------------------------
  // Salvar (substituir) as respostas do paciente. Mantém "Rascunho".
  // ----------------------------------------------------------------
  async salvar(
    idAtendimento: number,
    idFormulario: number,
    dto: SalvarRespostasDto,
    user: AuthUser,
  ) {
    this.somentePaciente(user);
    await this.carregarAtendimentoDoPaciente(idAtendimento, idFormulario, user);

    const fp = await this.exigirFormularioPaciente(idFormulario, user.id_usuario);
    // Após enviar (Respondido) ou já em avaliação/avaliado, não pode mais alterar.
    if (fp.id_situacao_formulario >= SituacaoFormulario.RESPONDIDO) {
      throw new BadRequestException(
        'Este formulário já foi concluído e não pode mais ser alterado.',
      );
    }

    // Perguntas válidas deste formulário (com suas opções) para validação.
    const perguntas = await this.prisma.pergunta.findMany({
      where: { id_formulario: idFormulario },
      include: { opcao_pergunta: true },
    });
    const mapaPerguntas = new Map(perguntas.map((p) => [p.id_pergunta, p]));

    // Monta as linhas de resposta validando cada item conforme o tipo.
    const linhasPorPergunta = new Map<
      number,
      Prisma.respostaCreateManyInput[]
    >();
    for (const item of dto.respostas) {
      const pergunta = mapaPerguntas.get(item.id_pergunta);
      if (!pergunta) {
        throw new BadRequestException(
          `A pergunta ${item.id_pergunta} não pertence a este formulário.`,
        );
      }
      linhasPorPergunta.set(
        item.id_pergunta,
        this.montarLinhasResposta(item, pergunta, fp.id_formulario_paciente, user),
      );
    }

    const idsPerguntas = [...linhasPorPergunta.keys()];
    const todasLinhas = [...linhasPorPergunta.values()].flat();

    await this.prisma.$transaction(async (tx) => {
      // Substitui o conjunto de respostas das perguntas enviadas.
      await tx.resposta.deleteMany({
        where: {
          id_formulario_paciente: fp.id_formulario_paciente,
          id_pergunta: { in: idsPerguntas },
        },
      });
      for (const linha of todasLinhas) {
        const resposta = await tx.resposta.create({ data: linha });
        // Trilha de auditoria de cada valor registrado.
        await tx.log_respostas.create({
          data: {
            id_resposta: resposta.id_resposta,
            valor_texto: resposta.valor_texto,
            valor_numero: resposta.valor_numero,
            valor_binario: resposta.valor_binario,
            valor_data: resposta.valor_data,
            id_usuario: user.id_usuario,
          },
        });
      }
    });

    return this.detalhar(idAtendimento, idFormulario, user);
  }

  // ----------------------------------------------------------------
  // Concluir o formulário: valida obrigatórias, marca "Respondido" e,
  // se todos os formulários do atendimento estiverem respondidos,
  // move o atendimento para "Respondido".
  // ----------------------------------------------------------------
  async concluir(idAtendimento: number, idFormulario: number, user: AuthUser) {
    this.somentePaciente(user);
    await this.carregarAtendimentoDoPaciente(idAtendimento, idFormulario, user);

    const fp = await this.exigirFormularioPaciente(idFormulario, user.id_usuario);
    if (fp.id_situacao_formulario >= SituacaoFormulario.RESPONDIDO) {
      throw new BadRequestException('Este formulário já foi concluído.');
    }

    await this.garantirObrigatoriasRespondidas(
      idFormulario,
      fp.id_formulario_paciente,
    );

    await this.prisma.formulario_paciente.update({
      where: { id_formulario_paciente: fp.id_formulario_paciente },
      data: {
        situacao_formulario: {
          connect: { id_situacao_formulario: SituacaoFormulario.RESPONDIDO },
        },
      },
    });

    await this.talvezConcluirAtendimento(idAtendimento, user.id_usuario);

    return this.detalhar(idAtendimento, idFormulario, user);
  }

  // ----------------------------------------------------------------
  // Helpers de validação/montagem
  // ----------------------------------------------------------------
  private montarLinhasResposta(
    item: RespostaItemDto,
    pergunta: Prisma.perguntaGetPayload<{ include: { opcao_pergunta: true } }>,
    idFormularioPaciente: number,
    user: AuthUser,
  ): Prisma.respostaCreateManyInput[] {
    const base = {
      id_formulario_paciente: idFormularioPaciente,
      id_pergunta: pergunta.id_pergunta,
      id_usuario_pac: user.id_usuario,
    };

    switch (pergunta.id_tipo_pergunta) {
      case TipoPergunta.TEXTO: {
        if (!item.valor_texto?.trim()) {
          this.exigirSeObrigatoria(pergunta);
          return [];
        }
        return [{ ...base, valor_texto: item.valor_texto }];
      }
      case TipoPergunta.NUMERO: {
        if (item.valor_numero === undefined || item.valor_numero === null) {
          this.exigirSeObrigatoria(pergunta);
          return [];
        }
        this.validarFaixaNumerica(pergunta, item.valor_numero);
        return [{ ...base, valor_numero: item.valor_numero }];
      }
      case TipoPergunta.BOOLEANO: {
        if (item.valor_binario === undefined || item.valor_binario === null) {
          this.exigirSeObrigatoria(pergunta);
          return [];
        }
        return [{ ...base, valor_binario: item.valor_binario }];
      }
      case TipoPergunta.ESCOLHA_UNICA: {
        const ids = item.id_opcoes ?? [];
        if (ids.length === 0) {
          this.exigirSeObrigatoria(pergunta);
          return [];
        }
        if (ids.length !== 1) {
          throw new BadRequestException(
            `A pergunta "${pergunta.pergunta}" aceita apenas uma opção.`,
          );
        }
        return [this.linhaOpcao(base, pergunta, ids[0])];
      }
      case TipoPergunta.ESCOLHA_MULTIPLA: {
        const ids = item.id_opcoes ?? [];
        if (ids.length === 0) {
          this.exigirSeObrigatoria(pergunta);
          return [];
        }
        return ids.map((idOpcao) => this.linhaOpcao(base, pergunta, idOpcao));
      }
      default:
        throw new BadRequestException(
          `Tipo de pergunta não suportado: ${pergunta.id_tipo_pergunta}.`,
        );
    }
  }

  // Uma escolha vira uma linha de resposta: valor_numero guarda o
  // id_opcao escolhido e valor_texto guarda o texto, para exibição.
  private linhaOpcao(
    base: { id_formulario_paciente: number; id_pergunta: number; id_usuario_pac: number },
    pergunta: Prisma.perguntaGetPayload<{ include: { opcao_pergunta: true } }>,
    idOpcao: number,
  ): Prisma.respostaCreateManyInput {
    const opcao = pergunta.opcao_pergunta.find((o) => o.id_opcao === idOpcao);
    if (!opcao) {
      throw new BadRequestException(
        `A opção ${idOpcao} não pertence à pergunta "${pergunta.pergunta}".`,
      );
    }
    return {
      ...base,
      valor_numero: opcao.id_opcao,
      valor_texto: opcao.texto_opcao,
    };
  }

  private exigirSeObrigatoria(pergunta: { obrigatoria: boolean | null; pergunta: string }) {
    if (pergunta.obrigatoria) {
      throw new BadRequestException(
        `A pergunta obrigatória "${pergunta.pergunta}" precisa ser respondida.`,
      );
    }
  }

  private validarFaixaNumerica(
    pergunta: { valor_minimo: number | null; valor_maximo: number | null; pergunta: string },
    valor: number,
  ) {
    if (pergunta.valor_minimo !== null && valor < pergunta.valor_minimo) {
      throw new BadRequestException(
        `A resposta de "${pergunta.pergunta}" não pode ser menor que ${pergunta.valor_minimo}.`,
      );
    }
    if (pergunta.valor_maximo !== null && valor > pergunta.valor_maximo) {
      throw new BadRequestException(
        `A resposta de "${pergunta.pergunta}" não pode ser maior que ${pergunta.valor_maximo}.`,
      );
    }
  }

  private async garantirObrigatoriasRespondidas(
    idFormulario: number,
    idFormularioPaciente: number,
  ) {
    const obrigatorias = await this.prisma.pergunta.findMany({
      where: { id_formulario: idFormulario, obrigatoria: true },
      select: { id_pergunta: true, pergunta: true },
    });
    if (obrigatorias.length === 0) return;

    const respondidas = await this.prisma.resposta.findMany({
      where: {
        id_formulario_paciente: idFormularioPaciente,
        id_pergunta: { in: obrigatorias.map((p) => p.id_pergunta) },
      },
      distinct: ['id_pergunta'],
      select: { id_pergunta: true },
    });
    const respondidasSet = new Set(respondidas.map((r) => r.id_pergunta));

    const faltando = obrigatorias.filter(
      (p) => !respondidasSet.has(p.id_pergunta),
    );
    if (faltando.length > 0) {
      throw new BadRequestException(
        `Existem ${faltando.length} pergunta(s) obrigatória(s) sem resposta.`,
      );
    }
  }

  // Move o atendimento para "Respondido" quando todos os formulários
  // atribuídos já foram respondidos pelo paciente.
  private async talvezConcluirAtendimento(
    idAtendimento: number,
    idPaciente: number,
  ) {
    const atribuidos = await this.prisma.atendimento_formulario.findMany({
      where: { id_atendimento: idAtendimento },
      select: { id_formulario: true },
    });
    if (atribuidos.length === 0) return;

    const respondidos = await this.prisma.formulario_paciente.count({
      where: {
        id_usuario_paciente: idPaciente,
        id_situacao_formulario: SituacaoFormulario.RESPONDIDO,
        id_formulario: { in: atribuidos.map((a) => a.id_formulario) },
      },
    });

    if (respondidos >= atribuidos.length) {
      await this.mudarSituacaoAtendimento(
        idAtendimento,
        SituacaoAtendimento.RESPONDIDO,
      );
    }
  }

  // ----------------------------------------------------------------
  // Helpers de carga/autorização
  // ----------------------------------------------------------------
  private async acharAtendimento(idAtendimento: number) {
    const atendimento = await this.prisma.atendimento.findUnique({
      where: { id_atendimento: idAtendimento },
      include: {
        atendimento_formulario: { select: { id_formulario: true } },
      },
    });
    if (!atendimento) {
      throw new NotFoundException('Atendimento não encontrado');
    }
    return atendimento;
  }

  private garantirFormularioAtribuido(
    atendimento: { atendimento_formulario: { id_formulario: number }[] },
    idFormulario: number,
  ) {
    const atribuido = atendimento.atendimento_formulario.some(
      (af) => af.id_formulario === idFormulario,
    );
    if (!atribuido) {
      throw new BadRequestException(
        'Este formulário não está atribuído a este atendimento.',
      );
    }
  }

  // Carrega o atendimento garantindo que pertence ao paciente logado,
  // que o formulário está atribuído e que o atendimento aceita respostas.
  private async carregarAtendimentoDoPaciente(
    idAtendimento: number,
    idFormulario: number,
    user: AuthUser,
  ) {
    const atendimento = await this.acharAtendimento(idAtendimento);

    if (atendimento.id_usuario_paciente !== user.id_usuario) {
      throw new ForbiddenException('Este atendimento não pertence a você.');
    }
    this.garantirFormularioAtribuido(atendimento, idFormulario);

    const bloqueado: number[] = [
      SituacaoAtendimento.AVALIADO,
      SituacaoAtendimento.ENCERRADO,
      SituacaoAtendimento.INATIVO,
    ];
    if (bloqueado.includes(atendimento.id_situacao_atendimento)) {
      throw new BadRequestException(
        'Este atendimento não aceita mais respostas.',
      );
    }
    return atendimento;
  }

  private acharFormularioPaciente(idFormulario: number, idPaciente: number) {
    return this.prisma.formulario_paciente.findFirst({
      where: { id_formulario: idFormulario, id_usuario_paciente: idPaciente },
    });
  }

  private async exigirFormularioPaciente(idFormulario: number, idPaciente: number) {
    const fp = await this.acharFormularioPaciente(idFormulario, idPaciente);
    if (!fp) {
      throw new BadRequestException(
        'Inicie o preenchimento do formulário antes de responder.',
      );
    }
    return fp;
  }

  private mudarSituacaoAtendimento(idAtendimento: number, idSituacao: number) {
    return this.prisma.atendimento.update({
      where: { id_atendimento: idAtendimento },
      data: {
        situacao_atendimento: {
          connect: { id_situacao_atendimento: idSituacao },
        },
      },
    });
  }

  private somentePaciente(user: AuthUser) {
    if (user.tipo !== TipoUsuario.PACIENTE) {
      throw new ForbiddenException(
        'Apenas o paciente pode responder formulários.',
      );
    }
  }
}
