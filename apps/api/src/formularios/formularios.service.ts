import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TIPOS_COM_OPCOES, TipoUsuario } from '../common/constants';
import type { AuthUser } from '../auth/current-user.decorator';
import { CreateFormularioDto } from './dto/create-formulario.dto';
import { UpdateFormularioDto } from './dto/update-formulario.dto';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';
import { CreateOpcaoDto } from './dto/create-opcao.dto';
import { OrdenarFormularioPor, QueryFormularioDto } from './dto/query-formulario.dto';

@Injectable()
export class FormulariosService {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Formulário
  // ----------------------------------------------------------------
  async create(dto: CreateFormularioDto, user: AuthUser) {
    this.somenteProfissional(user);

    for (const p of dto.perguntas ?? []) {
      this.validarOpcoes(p.id_tipo_pergunta, p.opcoes);
    }

    try {
      return await this.prisma.formulario.create({
        data: {
          tipo_formulario: {
            connect: { id_tipo_formulario: dto.id_tipo_formulario },
          },
          nome: dto.nome,
          descricao: dto.descricao,
          pergunta: {
            create: (dto.perguntas ?? []).map((p) =>
              this.montarPerguntaCreate(p, user.id_usuario),
            ),
          },
        },
        include: this.includeDetalhe(),
      });
    } catch (e) {
      throw this.tratarErro(e);
    }
  }

  async findAll(query: QueryFormularioDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.formularioWhereInput = {};

    if (query.search?.trim()) {
      // Busca sem sensibilidade a maiúsculas nem a acentos.
      const ids = await this.idsPorBuscaSemAcento(query.search.trim());
      if (ids) {
        where.id_formulario = { in: ids };
      } else {
        where.nome = { contains: query.search.trim(), mode: 'insensitive' };
      }
    }
    if (query.id_tipo_formulario !== undefined) {
      where.id_tipo_formulario = query.id_tipo_formulario;
    }
    if (query.ativo !== undefined) {
      where.ativo = query.ativo;
    }
    if (query.data_inicio || query.data_fim) {
      where.dt_cadastro = {
        ...(query.data_inicio ? { gte: new Date(query.data_inicio) } : {}),
        ...(query.data_fim
          ? { lte: new Date(`${query.data_fim}T23:59:59.999Z`) }
          : {}),
      };
    }
    type OrderBy = Prisma.formularioOrderByWithRelationInput;
    const orderByMap: Record<string, OrderBy> = {
      [OrdenarFormularioPor.DATA_DESC]: { id_formulario: 'desc' },
      [OrdenarFormularioPor.DATA_ASC]: { id_formulario: 'asc' },
      [OrdenarFormularioPor.NOME]: { nome: 'asc' },
      [OrdenarFormularioPor.MAIS_RESPONDIDOS]: {
        formulario_paciente: { _count: 'desc' },
      },
    };
    const orderBy = orderByMap[query.ordenar_por ?? OrdenarFormularioPor.DATA_DESC];

    const [data, total] = await this.prisma.$transaction([
      this.prisma.formulario.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          tipo_formulario: true,
          _count: { select: { pergunta: true, formulario_paciente: true } },
        },
      }),
      this.prisma.formulario.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const formulario = await this.prisma.formulario.findUnique({
      where: { id_formulario: id },
      include: this.includeDetalhe(),
    });
    if (!formulario) {
      throw new NotFoundException('Formulário não encontrado');
    }
    return formulario;
  }

  async update(id: number, dto: UpdateFormularioDto, user: AuthUser) {
    this.somenteProfissional(user);
    await this.findOne(id);

    try {
      return await this.prisma.formulario.update({
        where: { id_formulario: id },
        data: {
          nome: dto.nome,
          descricao: dto.descricao,
          ...(dto.id_tipo_formulario !== undefined
            ? {
                tipo_formulario: {
                  connect: { id_tipo_formulario: dto.id_tipo_formulario },
                },
              }
            : {}),
        },
        include: this.includeDetalhe(),
      });
    } catch (e) {
      throw this.tratarErro(e);
    }
  }

  // Desativar impede novas associações deste formulário a atendimentos.
  async desativar(id: number, user: AuthUser) {
    this.somenteProfissional(user);
    await this.findOne(id);
    return this.prisma.formulario.update({
      where: { id_formulario: id },
      data: { ativo: false },
      include: this.includeDetalhe(),
    });
  }

  async reativar(id: number, user: AuthUser) {
    this.somenteProfissional(user);
    await this.findOne(id);
    return this.prisma.formulario.update({
      where: { id_formulario: id },
      data: { ativo: true },
      include: this.includeDetalhe(),
    });
  }

  // ----------------------------------------------------------------
  // Perguntas
  // ----------------------------------------------------------------
  async addPergunta(id: number, dto: CreatePerguntaDto, user: AuthUser) {
    this.somenteProfissional(user);
    await this.findOne(id);

    // Regra: formulário já respondido não aceita novas perguntas.
    if (await this.formularioRespondido(id)) {
      throw new BadRequestException(
        'Não é possível incluir perguntas: este formulário já possui respostas.',
      );
    }

    this.validarOpcoes(dto.id_tipo_pergunta, dto.opcoes);

    try {
      await this.prisma.pergunta.create({
        data: {
          ...this.montarPerguntaCreate(dto, user.id_usuario),
          formulario: { connect: { id_formulario: id } },
        },
      });
    } catch (e) {
      throw this.tratarErro(e);
    }
    return this.findOne(id);
  }

  async updatePergunta(
    id: number,
    idPergunta: number,
    dto: UpdatePerguntaDto,
    user: AuthUser,
  ) {
    this.somenteProfissional(user);
    await this.getPerguntaDoFormulario(id, idPergunta);

    // Regra: pergunta respondida não pode ser editada.
    if (await this.perguntaRespondida(idPergunta)) {
      throw new BadRequestException(
        'Não é possível editar uma pergunta que já foi respondida.',
      );
    }

    if (dto.id_tipo_pergunta !== undefined || dto.opcoes !== undefined) {
      const tipo = dto.id_tipo_pergunta;
      if (tipo !== undefined) this.validarOpcoes(tipo, dto.opcoes);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.pergunta.update({
          where: { id_pergunta: idPergunta },
          data: {
            pergunta: dto.pergunta,
            obrigatoria: dto.obrigatoria,
            valor_minimo: dto.valor_minimo,
            valor_maximo: dto.valor_maximo,
            ...(dto.id_tipo_pergunta !== undefined
              ? {
                  tipo_pergunta: {
                    connect: { id_tipo_pergunta: dto.id_tipo_pergunta },
                  },
                }
              : {}),
          },
        });

        // Se vieram opções, substitui o conjunto inteiro.
        if (dto.opcoes !== undefined) {
          await tx.opcao_pergunta.deleteMany({
            where: { id_pergunta: idPergunta },
          });
          if (dto.opcoes.length > 0) {
            await tx.opcao_pergunta.createMany({
              data: dto.opcoes.map((o) => ({
                id_pergunta: idPergunta,
                texto_opcao: o.texto_opcao,
                valor_opcao: o.valor_opcao,
              })),
            });
          }
        }
      });
    } catch (e) {
      throw this.tratarErro(e);
    }
    return this.findOne(id);
  }

  async removePergunta(id: number, idPergunta: number, user: AuthUser) {
    this.somenteProfissional(user);
    await this.getPerguntaDoFormulario(id, idPergunta);

    // Regra: pergunta respondida não pode ser excluída.
    if (await this.perguntaRespondida(idPergunta)) {
      throw new BadRequestException(
        'Não é possível excluir uma pergunta que já foi respondida.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.opcao_pergunta.deleteMany({ where: { id_pergunta: idPergunta } }),
      this.prisma.pergunta.delete({ where: { id_pergunta: idPergunta } }),
    ]);
    return this.findOne(id);
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  // Busca por nome/descrição ignorando maiúsculas e acentos (unaccent).
  // Retorna null quando a extensão não está disponível (fallback Prisma).
  private async idsPorBuscaSemAcento(search: string): Promise<number[] | null> {
    const like = `%${search}%`;
    try {
      const rows = await this.prisma.$queryRaw<{ id: number }[]>`
        SELECT id_formulario AS id
        FROM formulario
        WHERE unaccent(lower(coalesce(nome, ''))) LIKE unaccent(lower(${like}))
           OR unaccent(lower(coalesce(descricao, ''))) LIKE unaccent(lower(${like}))
      `;
      return rows.map((r) => Number(r.id));
    } catch {
      return null;
    }
  }

  private montarPerguntaCreate(
    p: CreatePerguntaDto,
    idUsuario: number,
  ): Prisma.perguntaCreateWithoutFormularioInput {
    return {
      pergunta: p.pergunta,
      obrigatoria: p.obrigatoria ?? true,
      valor_minimo: p.valor_minimo,
      valor_maximo: p.valor_maximo,
      tipo_pergunta: { connect: { id_tipo_pergunta: p.id_tipo_pergunta } },
      usuario: { connect: { id_usuario: idUsuario } },
      ...(p.opcoes && p.opcoes.length > 0
        ? {
            opcao_pergunta: {
              create: p.opcoes.map((o) => ({
                texto_opcao: o.texto_opcao,
                valor_opcao: o.valor_opcao,
              })),
            },
          }
        : {}),
    };
  }

  private validarOpcoes(idTipoPergunta: number, opcoes?: CreateOpcaoDto[]) {
    const exigeOpcoes = TIPOS_COM_OPCOES.includes(idTipoPergunta);
    if (exigeOpcoes && (!opcoes || opcoes.length < 2)) {
      throw new BadRequestException(
        'Perguntas de escolha (única ou múltipla) precisam de pelo menos 2 opções.',
      );
    }
    if (!exigeOpcoes && opcoes && opcoes.length > 0) {
      throw new BadRequestException(
        'Apenas perguntas de escolha podem ter opções.',
      );
    }
  }

  private async getPerguntaDoFormulario(id: number, idPergunta: number) {
    const pergunta = await this.prisma.pergunta.findUnique({
      where: { id_pergunta: idPergunta },
    });
    if (!pergunta || pergunta.id_formulario !== id) {
      throw new NotFoundException('Pergunta não encontrada neste formulário');
    }
    return pergunta;
  }

  private async perguntaRespondida(idPergunta: number): Promise<boolean> {
    const total = await this.prisma.resposta.count({
      where: { id_pergunta: idPergunta },
    });
    return total > 0;
  }

  private async formularioRespondido(idFormulario: number): Promise<boolean> {
    const total = await this.prisma.resposta.count({
      where: { pergunta: { id_formulario: idFormulario } },
    });
    return total > 0;
  }

  private includeDetalhe() {
    return {
      tipo_formulario: true,
      pergunta: {
        orderBy: { id_pergunta: 'asc' as const },
        include: {
          tipo_pergunta: true,
          opcao_pergunta: { orderBy: { id_opcao: 'asc' as const } },
        },
      },
    } satisfies Prisma.formularioInclude;
  }

  private somenteProfissional(user: AuthUser) {
    if (user.tipo !== TipoUsuario.PROFISSIONAL) {
      throw new ForbiddenException(
        'Apenas usuários profissionais podem gerenciar formulários.',
      );
    }
  }

  private tratarErro(e: unknown): Error {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025' || e.code === 'P2003') {
        return new BadRequestException(
          'Tipo de formulário ou tipo de pergunta informado não existe.',
        );
      }
    }
    return e as Error;
  }
}
