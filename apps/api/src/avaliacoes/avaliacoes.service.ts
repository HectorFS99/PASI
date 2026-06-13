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
  // Iniciar a análise de um formulário respondido (profissional).
  // Move o formulario_paciente de "Respondido" para "Em avaliação" e o
  // atendimento para "Em avaliação". Idempotente: se já está em avaliação,
  // apenas retorna; se já foi avaliado, bloqueia.
  // ----------------------------------------------------------------
  async iniciar(idAtendimento: number, idFormulario: number, user: AuthUser) {
    this.somenteProfissional(user);
    const atendimento = await this.acharAtendimento(idAtendimento);
    this.garantirFormularioAtribuido(atendimento, idFormulario);
    this.garantirAtendimentoAvaliavel(atendimento.id_situacao_atendimento);

    const fp = await this.exigirFormularioPaciente(
      idFormulario,
      atendimento.id_usuario_paciente,
    );

    if (fp.id_situacao_formulario === SituacaoFormulario.AVALIADO) {
      throw new BadRequestException(
        'Este formulário já foi avaliado e não pode ser avaliado novamente.',
      );
    }

    if (fp.id_situacao_formulario === SituacaoFormulario.RESPONDIDO) {
      await this.prisma.formulario_paciente.update({
        where: { id_formulario_paciente: fp.id_formulario_paciente },
        data: {
          situacao_formulario: {
            connect: { id_situacao_formulario: SituacaoFormulario.EM_AVALIACAO },
          },
        },
      });
    } else if (fp.id_situacao_formulario !== SituacaoFormulario.EM_AVALIACAO) {
      throw new BadRequestException(
        'Só é possível avaliar formulários que já foram respondidos pelo paciente.',
      );
    }

    // O atendimento entra em "Em avaliação" assim que a análise começa.
    if (atendimento.id_situacao_atendimento === SituacaoAtendimento.RESPONDIDO) {
      await this.prisma.atendimento.update({
        where: { id_atendimento: atendimento.id_atendimento },
        data: {
          situacao_atendimento: {
            connect: { id_situacao_atendimento: SituacaoAtendimento.EM_AVALIACAO },
          },
        },
      });
    }

    return this.listar(idAtendimento, idFormulario, user);
  }

  // ----------------------------------------------------------------
  // Avaliar (finalizar) um formulário respondido (profissional). Registra
  // a observação, marca o formulario_paciente como "Avaliado" (impedindo
  // novas avaliações) e move o atendimento para "Em avaliação"; quando
  // todos os formulários atribuídos forem avaliados, vai para "Avaliado".
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
    this.garantirAtendimentoAvaliavel(atendimento.id_situacao_atendimento);

    const fp = await this.exigirFormularioPaciente(
      idFormulario,
      atendimento.id_usuario_paciente,
    );

    // Só uma avaliação por formulário: depois de "Avaliado", não permite mais.
    if (fp.id_situacao_formulario === SituacaoFormulario.AVALIADO) {
      throw new BadRequestException(
        'Este formulário já foi avaliado e não pode ser avaliado novamente.',
      );
    }
    const avaliavel: number[] = [
      SituacaoFormulario.RESPONDIDO,
      SituacaoFormulario.EM_AVALIACAO,
    ];
    if (!avaliavel.includes(fp.id_situacao_formulario)) {
      throw new BadRequestException(
        'Só é possível avaliar formulários que já foram respondidos pelo paciente.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.formulario_avaliacao.create({
        data: {
          formulario: { connect: { id_formulario: idFormulario } },
          usuario: { connect: { id_usuario: user.id_usuario } },
          observacao: dto.observacao,
        },
      }),
      this.prisma.formulario_paciente.update({
        where: { id_formulario_paciente: fp.id_formulario_paciente },
        data: {
          situacao_formulario: {
            connect: { id_situacao_formulario: SituacaoFormulario.AVALIADO },
          },
        },
      }),
    ]);

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

  private garantirAtendimentoAvaliavel(idSituacaoAtendimento: number) {
    const bloqueado: number[] = [
      SituacaoAtendimento.ENCERRADO,
      SituacaoAtendimento.INATIVO,
    ];
    if (bloqueado.includes(idSituacaoAtendimento)) {
      throw new BadRequestException(
        'Não é possível avaliar um atendimento Encerrado ou Inativo.',
      );
    }
  }

  private async exigirFormularioPaciente(idFormulario: number, idPaciente: number) {
    const fp = await this.prisma.formulario_paciente.findFirst({
      where: { id_formulario: idFormulario, id_usuario_paciente: idPaciente },
    });
    if (!fp) {
      throw new BadRequestException(
        'O paciente ainda não respondeu este formulário.',
      );
    }
    return fp;
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
