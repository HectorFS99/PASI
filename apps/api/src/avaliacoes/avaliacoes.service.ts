import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SituacaoAtendimento,
  SituacaoFormulario,
  TipoUsuario,
} from '../common/constants';
import type { AuthUser } from '../auth/current-user.decorator';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';

@Injectable()
export class AvaliacoesService {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Avaliar um formulário respondido (profissional). Registra a
  // observação e move o atendimento para "Em avaliação"; quando todos
  // os formulários atribuídos forem avaliados, vai para "Avaliado".
  // ----------------------------------------------------------------
  async avaliar(
    idAtendimento: number,
    idFormulario: number,
    dto: CreateAvaliacaoDto,
    user: AuthUser,
  ) {
    this.somenteProfissional(user);
    const atendimento = await this.acharAtendimento(idAtendimento);
    this.garantirFormularioAtribuido(atendimento, idFormulario);

    const bloqueado: number[] = [
      SituacaoAtendimento.ENCERRADO,
      SituacaoAtendimento.INATIVO,
    ];
    if (bloqueado.includes(atendimento.id_situacao_atendimento)) {
      throw new BadRequestException(
        'Não é possível avaliar um atendimento Encerrado ou Inativo.',
      );
    }

    // O formulário do paciente precisa estar "Respondido" para ser avaliado.
    const fp = await this.prisma.formulario_paciente.findFirst({
      where: {
        id_formulario: idFormulario,
        id_usuario_paciente: atendimento.id_usuario_paciente,
      },
    });
    if (!fp || fp.id_situacao_formulario !== SituacaoFormulario.RESPONDIDO) {
      throw new BadRequestException(
        'Só é possível avaliar formulários que já foram respondidos pelo paciente.',
      );
    }

    await this.prisma.formulario_avaliacao.create({
      data: {
        formulario: { connect: { id_formulario: idFormulario } },
        usuario: { connect: { id_usuario: user.id_usuario } },
        observacao: dto.observacao,
      },
    });

    await this.atualizarSituacaoAtendimento(atendimento.id_atendimento);

    return this.listar(idAtendimento, idFormulario, user);
  }

  // ----------------------------------------------------------------
  // Lista as avaliações de um formulário do atendimento.
  // ----------------------------------------------------------------
  async listar(idAtendimento: number, idFormulario: number, user: AuthUser) {
    this.somenteProfissional(user);
    const atendimento = await this.acharAtendimento(idAtendimento);
    this.garantirFormularioAtribuido(atendimento, idFormulario);

    return this.prisma.formulario_avaliacao.findMany({
      where: { id_formulario: idFormulario },
      orderBy: { id_formulario_avaliacao: 'desc' },
      include: {
        usuario: { select: { id_usuario: true, nome: true } },
      },
    });
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  // Em avaliação enquanto houver formulários atribuídos sem avaliação;
  // Avaliado quando todos os atribuídos já tiverem ao menos uma avaliação.
  private async atualizarSituacaoAtendimento(idAtendimento: number) {
    const atribuidos = await this.prisma.atendimento_formulario.findMany({
      where: { id_atendimento: idAtendimento },
      select: { id_formulario: true },
    });
    if (atribuidos.length === 0) return;

    const idsAtribuidos = atribuidos.map((a) => a.id_formulario);
    const avaliados = await this.prisma.formulario_avaliacao.findMany({
      where: { id_formulario: { in: idsAtribuidos } },
      distinct: ['id_formulario'],
      select: { id_formulario: true },
    });

    const todosAvaliados = avaliados.length >= idsAtribuidos.length;
    const novaSituacao = todosAvaliados
      ? SituacaoAtendimento.AVALIADO
      : SituacaoAtendimento.EM_AVALIACAO;

    await this.prisma.atendimento.update({
      where: { id_atendimento: idAtendimento },
      data: {
        situacao_atendimento: {
          connect: { id_situacao_atendimento: novaSituacao },
        },
      },
    });
  }

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

  private somenteProfissional(user: AuthUser) {
    if (user.tipo !== TipoUsuario.PROFISSIONAL) {
      throw new ForbiddenException(
        'Apenas usuários profissionais podem avaliar formulários.',
      );
    }
  }
}
