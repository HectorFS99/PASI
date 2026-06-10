import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ID_FORMULARIO_TRIAGEM, SituacaoAtendimento, TipoUsuario } from '../common/constants';
import type { AuthUser } from '../auth/current-user.decorator';
import { CreateProfissionalDto } from './dto/create-profissional.dto';
import { CreatePacienteDto } from './dto/create-paciente.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfissional(dto: CreateProfissionalDto) {
    const senha_hash = await bcrypt.hash(dto.senha, SALT_ROUNDS);
    return this.criar({
      tipo_usuario: { connect: { id_tipo_usuario: TipoUsuario.PROFISSIONAL } },
      nome: dto.nome,
      cpf: dto.cpf,
      email: dto.email.toLowerCase(),
      tel_celular: dto.tel_celular,
      sexo: dto.sexo,
      senha_hash,
      profissao: { connect: { id_profissao: dto.id_profissao } },
      unidade_atendimento_usuario_id_unidade_atendimentoTounidade_atendimento: {
        connect: { id_unidade_atendimento: dto.id_unidade_atendimento },
      },
    });
  }

  async createPaciente(dto: CreatePacienteDto) {
    const senha_hash = await bcrypt.hash(dto.senha, SALT_ROUNDS);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            tipo_usuario: { connect: { id_tipo_usuario: TipoUsuario.PACIENTE } },
            nome: dto.nome,
            cpf: dto.cpf,
            email: dto.email.toLowerCase(),
            tel_celular: dto.tel_celular,
            sexo: dto.sexo,
            dt_nascimento: dto.dt_nascimento ? new Date(dto.dt_nascimento) : null,
            nac_estrangeira: dto.nac_estrangeira ?? false,
            cep: dto.cep,
            logradouro: dto.logradouro,
            numero: dto.numero,
            complemento: dto.complemento,
            bairro: dto.bairro,
            cidade: dto.cidade,
            estado: dto.estado,
            pais: dto.pais,
            senha_hash,
            ...(dto.id_genero
              ? { genero: { connect: { id_genero: dto.id_genero } } }
              : {}),
          },
        });

        await tx.atendimento.create({
          data: {
            id_usuario_paciente: usuario.id_usuario,
            id_situacao_atendimento: SituacaoAtendimento.CRIADO,
            atendimento_formulario: {
              create: { id_formulario: ID_FORMULARIO_TRIAGEM },
            },
          },
        });

        return this.semSenha(usuario);
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const campo = (e.meta?.target as string) ?? 'campo único';
        throw new ConflictException(
          `Já existe um usuário com este ${this.nomeCampoConflito(campo)}.`,
        );
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new ConflictException(
          'Profissão ou unidade de atendimento informada não existe.',
        );
      }
      throw e;
    }
  }

  async listPacientes(search: string | undefined, user: AuthUser) {
    if (user.tipo !== TipoUsuario.PROFISSIONAL) {
      throw new ForbiddenException('Apenas profissionais podem listar pacientes.');
    }
    const where: Prisma.usuarioWhereInput = { id_tipo_usuario: TipoUsuario.PACIENTE };
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search.replace(/\D/g, '') } },
      ];
    }
    return this.prisma.usuario.findMany({
      where,
      select: { id_usuario: true, nome: true, cpf: true, email: true },
      take: 20,
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
    });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return this.semSenha(usuario);
  }

  private async criar(data: Prisma.usuarioCreateInput) {
    try {
      const usuario = await this.prisma.usuario.create({ data });
      return this.semSenha(usuario);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const campo = (e.meta?.target as string) ?? 'campo único';
        throw new ConflictException(
          `Já existe um usuário com este ${this.nomeCampoConflito(campo)}.`,
        );
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new ConflictException(
          'Profissão ou unidade de atendimento informada não existe.',
        );
      }
      throw e;
    }
  }

  private nomeCampoConflito(target: string): string {
    if (target.includes('cpf')) return 'CPF';
    if (target.includes('email')) return 'e-mail';
    if (target.includes('tel')) return 'telefone';
    return target;
  }

  private semSenha<T extends { senha_hash?: string | null }>(usuario: T) {
    const { senha_hash, ...resto } = usuario;
    void senha_hash;
    return resto;
  }
}
