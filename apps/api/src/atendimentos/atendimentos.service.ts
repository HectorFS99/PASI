import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SituacaoAtendimento, TipoUsuario } from '../common/constants';
import type { AuthUser } from '../auth/current-user.decorator';
import { CreateAtendimentoDto } from './dto/create-atendimento.dto';
import { UpdateAtendimentoDto } from './dto/update-atendimento.dto';
import { AtribuirFormulariosDto } from './dto/atribuir-formularios.dto';
import { OrdenarAtendimentoPor, QueryAtendimentoDto } from './dto/query-atendimento.dto';

@Injectable()
export class AtendimentosService {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Criação (apenas profissional)
  // ----------------------------------------------------------------
  async create(dto: CreateAtendimentoDto, user: AuthUser) {
    this.somenteProfissional(user);
    await this.garantirFormulariosAtivos(dto.formularios);

    try {
      return await this.prisma.atendimento.create({
        data: {
          descricao: dto.descricao,
          situacao_atendimento: {
            connect: { id_situacao_atendimento: SituacaoAtendimento.CRIADO },
          },
          usuario_atendimento_id_usuario_pacienteTousuario: {
            connect: { id_usuario: dto.id_usuario_paciente },
          },
          usuario_atendimento_id_usuario_cadTousuario: {
            connect: { id_usuario: user.id_usuario },
          },
          atendimento_formulario: {
            create: dto.formularios.map((id_formulario) => ({
              formulario: { connect: { id_formulario } },
              usuario: { connect: { id_usuario: user.id_usuario } },
            })),
          },
        },
        include: this.includePadrao(),
      });
    } catch (e) {
      throw this.tratarErroRelacao(e);
    }
  }

  // ----------------------------------------------------------------
  // Listagem paginada (profissional vê todos; paciente vê os seus)
  // ----------------------------------------------------------------
  async findAll(query: QueryAtendimentoDto, user: AuthUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.atendimentoWhereInput = {};

    if (user.tipo === TipoUsuario.PACIENTE) {
      where.id_usuario_paciente = user.id_usuario;
    }

    if (query.search?.trim()) {
      // Busca sem sensibilidade a maiúsculas nem a acentos.
      const ids = await this.idsPorBuscaSemAcento(query.search.trim());
      if (ids) {
        where.id_atendimento = { in: ids };
      } else {
        where.OR = [
          { descricao: { contains: query.search.trim(), mode: 'insensitive' } },
          {
            usuario_atendimento_id_usuario_pacienteTousuario: {
              nome: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
        ];
      }
    }

    if (query.situacoes) {
      const ids = query.situacoes
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      if (ids.length > 0) {
        where.id_situacao_atendimento = { in: ids };
      }
    }

    if (query.data_inicio || query.data_fim) {
      // O cliente envia os instantes de início/fim do dia no fuso local,
      // então usamos os valores como recebidos (sem reconstruir o fim do dia).
      where.dt_cadastro = {
        ...(query.data_inicio ? { gte: new Date(query.data_inicio) } : {}),
        ...(query.data_fim ? { lte: new Date(query.data_fim) } : {}),
      };
    }

    type OrderBy = Prisma.atendimentoOrderByWithRelationInput;
    const orderByMap: Record<string, OrderBy> = {
      [OrdenarAtendimentoPor.DATA_DESC]: { id_atendimento: 'desc' },
      [OrdenarAtendimentoPor.DATA_ASC]: { id_atendimento: 'asc' },
      [OrdenarAtendimentoPor.PACIENTE]: {
        usuario_atendimento_id_usuario_pacienteTousuario: { nome: 'asc' },
      },
      [OrdenarAtendimentoPor.SITUACAO]: { id_situacao_atendimento: 'asc' },
    };
    const orderBy = orderByMap[query.ordenar_por ?? OrdenarAtendimentoPor.DATA_DESC];

    const [data, total] = await this.prisma.$transaction([
      this.prisma.atendimento.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.includePadrao(),
      }),
      this.prisma.atendimento.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const atendimento = await this.prisma.atendimento.findUnique({
      where: { id_atendimento: id },
      include: this.includePadrao(),
    });
    if (!atendimento) {
      throw new NotFoundException('Atendimento não encontrado');
    }

    // Enrich each atendimento_formulario with the patient's response status
    const idFormularios = atendimento.atendimento_formulario.map((af) => af.id_formulario);
    if (idFormularios.length > 0) {
      const fpList = await this.prisma.formulario_paciente.findMany({
        where: {
          id_usuario_paciente: atendimento.id_usuario_paciente,
          id_formulario: { in: idFormularios },
        },
        select: {
          id_formulario: true,
          id_situacao_formulario: true,
          situacao_formulario: { select: { nome: true } },
        },
      });
      const statusMap = new Map(fpList.map((fp) => [fp.id_formulario, fp]));
      return {
        ...atendimento,
        atendimento_formulario: atendimento.atendimento_formulario.map((af) => ({
          ...af,
          status_formulario_paciente: statusMap.get(af.id_formulario) ?? null,
        })),
      };
    }

    return atendimento;
  }

  // ----------------------------------------------------------------
  // Edição (descrição sempre; troca de paciente só quando "Criado")
  // ----------------------------------------------------------------
  async update(id: number, dto: UpdateAtendimentoDto, user: AuthUser) {
    this.somenteProfissional(user);
    const atendimento = await this.findOne(id);

    if (
      dto.id_usuario_paciente !== undefined &&
      atendimento.id_situacao_atendimento !== SituacaoAtendimento.CRIADO
    ) {
      throw new BadRequestException(
        'A troca de paciente só é permitida enquanto o atendimento está em "Criado".',
      );
    }

    try {
      return await this.prisma.atendimento.update({
        where: { id_atendimento: id },
        data: {
          descricao: dto.descricao,
          ...(dto.id_usuario_paciente !== undefined
            ? {
                usuario_atendimento_id_usuario_pacienteTousuario: {
                  connect: { id_usuario: dto.id_usuario_paciente },
                },
              }
            : {}),
        },
        include: this.includePadrao(),
      });
    } catch (e) {
      throw this.tratarErroRelacao(e);
    }
  }

  // ----------------------------------------------------------------
  // Atribuir formulários (proibido quando "Avaliado" ou "Encerrado")
  // ----------------------------------------------------------------
  async atribuirFormularios(
    id: number,
    dto: AtribuirFormulariosDto,
    user: AuthUser,
  ) {
    this.somenteProfissional(user);
    const atendimento = await this.findOne(id);

    const bloqueado: number[] = [
      SituacaoAtendimento.AVALIADO,
      SituacaoAtendimento.ENCERRADO,
    ];
    if (bloqueado.includes(atendimento.id_situacao_atendimento)) {
      throw new BadRequestException(
        'Não é possível atribuir formulários a um atendimento Avaliado ou Encerrado.',
      );
    }

    const jaAtribuidos = new Set(
      atendimento.atendimento_formulario.map((af) => af.id_formulario),
    );
    const novos = dto.formularios.filter((f) => !jaAtribuidos.has(f));

    if (novos.length === 0) {
      throw new BadRequestException(
        'Todos os formulários informados já estão atribuídos a este atendimento.',
      );
    }

    await this.garantirFormulariosAtivos(novos);

    try {
      await this.prisma.atendimento_formulario.createMany({
        data: novos.map((id_formulario) => ({
          id_atendimento: id,
          id_formulario,
          id_usuario_atribuicao: user.id_usuario,
        })),
      });
    } catch (e) {
      throw this.tratarErroRelacao(e);
    }

    return this.findOne(id);
  }

  // Remove um formulário do atendimento (regra da tela de edição: só "Criado")
  async removerFormulario(id: number, idFormulario: number, user: AuthUser) {
    this.somenteProfissional(user);
    const atendimento = await this.findOne(id);

    if (atendimento.id_situacao_atendimento !== SituacaoAtendimento.CRIADO) {
      throw new BadRequestException(
        'Só é possível remover formulários enquanto o atendimento está em "Criado".',
      );
    }

    await this.prisma.atendimento_formulario.deleteMany({
      where: { id_atendimento: id, id_formulario: idFormulario },
    });
    return this.findOne(id);
  }

  // ----------------------------------------------------------------
  // Encerrar (apenas quando "Avaliado")
  // ----------------------------------------------------------------
  async encerrar(id: number, user: AuthUser) {
    this.somenteProfissional(user);
    const atendimento = await this.findOne(id);

    if (atendimento.id_situacao_atendimento !== SituacaoAtendimento.AVALIADO) {
      throw new BadRequestException(
        'O atendimento só pode ser encerrado quando estiver na situação "Avaliado".',
      );
    }

    return this.mudarSituacao(id, SituacaoAtendimento.ENCERRADO);
  }

  // Inativar (criado indevidamente)
  async inativar(id: number, user: AuthUser) {
    this.somenteProfissional(user);
    const atendimento = await this.findOne(id);

    if (atendimento.id_situacao_atendimento === SituacaoAtendimento.ENCERRADO) {
      throw new BadRequestException(
        'Um atendimento encerrado não pode ser inativado.',
      );
    }

    return this.mudarSituacao(id, SituacaoAtendimento.INATIVO);
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  // Busca por descrição/nome do paciente ignorando maiúsculas e acentos.
  // Retorna null quando a extensão unaccent não está disponível.
  private async idsPorBuscaSemAcento(search: string): Promise<number[] | null> {
    const like = `%${search}%`;
    try {
      const rows = await this.prisma.$queryRaw<{ id: number }[]>`
        SELECT a.id_atendimento AS id
        FROM atendimento a
        JOIN usuario u ON u.id_usuario = a.id_usuario_paciente
        WHERE unaccent(lower(coalesce(a.descricao, ''))) LIKE unaccent(lower(${like}))
           OR unaccent(lower(u.nome)) LIKE unaccent(lower(${like}))
      `;
      return rows.map((r) => Number(r.id));
    } catch {
      return null;
    }
  }

  private mudarSituacao(id: number, idSituacao: number) {
    return this.prisma.atendimento.update({
      where: { id_atendimento: id },
      data: {
        situacao_atendimento: {
          connect: { id_situacao_atendimento: idSituacao },
        },
      },
      include: this.includePadrao(),
    });
  }

  private includePadrao() {
    return {
      situacao_atendimento: true,
      usuario_atendimento_id_usuario_pacienteTousuario: {
        select: { id_usuario: true, nome: true, cpf: true, email: true },
      },
      atendimento_formulario: {
        include: {
          formulario: {
            select: { id_formulario: true, nome: true, descricao: true },
          },
        },
      },
    } satisfies Prisma.atendimentoInclude;
  }

  private somenteProfissional(user: AuthUser) {
    if (user.tipo !== TipoUsuario.PROFISSIONAL) {
      throw new ForbiddenException(
        'Apenas usuários profissionais podem executar esta ação.',
      );
    }
  }

  // Formulários desativados não podem ser atribuídos a atendimentos.
  private async garantirFormulariosAtivos(ids: number[]) {
    if (ids.length === 0) return;
    const inativos = await this.prisma.formulario.findMany({
      where: { id_formulario: { in: ids }, ativo: false },
      select: { id_formulario: true, nome: true },
    });
    if (inativos.length > 0) {
      const nomes = inativos
        .map((f) => f.nome ?? `#${f.id_formulario}`)
        .join(', ');
      throw new BadRequestException(
        `Formulário(s) desativado(s) não podem ser atribuídos: ${nomes}.`,
      );
    }
  }

  private tratarErroRelacao(e: unknown): Error {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025' || e.code === 'P2003') {
        return new BadRequestException(
          'Paciente ou formulário informado não existe.',
        );
      }
    }
    return e as Error;
  }
}
