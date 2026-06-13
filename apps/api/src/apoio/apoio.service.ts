import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Tabelas de domínio (lookup) usadas para popular combos no app mobile.
 * Somente leitura. Carga inicial vem do DDL.
 */
@Injectable()
export class ApoioService {
  constructor(private readonly prisma: PrismaService) {}

  generos() {
    return this.prisma.genero.findMany({ orderBy: { id_genero: 'asc' } });
  }

  profissoes() {
    return this.prisma.profissao.findMany({
      orderBy: { nome: 'asc' },
      include: { tipo_profissao: { select: { id_tipo_profissao: true, nome: true } } },
    });
  }

  unidades() {
    return this.prisma.unidade_atendimento.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id_unidade_atendimento: true,
        nome: true,
        cidade: true,
        estado: true,
        tipo_unidade_atendimento: {
          select: { id_tipo_unidade_atend: true, nome: true },
        },
      },
    });
  }

  tiposUnidade() {
    return this.prisma.tipo_unidade_atendimento.findMany({
      orderBy: { id_tipo_unidade_atend: 'asc' },
    });
  }

  tiposFormulario() {
    return this.prisma.tipo_formulario.findMany({
      orderBy: { id_tipo_formulario: 'asc' },
    });
  }

  tiposPergunta() {
    return this.prisma.tipo_pergunta.findMany({
      where: { ativo: true },
      orderBy: { id_tipo_pergunta: 'asc' },
    });
  }

  situacoesAtendimento() {
    return this.prisma.situacao_atendimento.findMany({
      orderBy: { id_situacao_atendimento: 'asc' },
    });
  }

  situacoesFormulario() {
    return this.prisma.situacao_formulario.findMany({
      orderBy: { id_situacao_formulario: 'asc' },
    });
  }
}
