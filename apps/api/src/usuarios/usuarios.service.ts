import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { TipoUsuario } from '../common/constants';
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
    return this.criar({
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
