import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { existsSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { TipoUsuario } from '../common/constants';
import type { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class DocumentosService {
  constructor(private readonly prisma: PrismaService) {}

  // Registra um arquivo de apoio para um formulário (profissional).
  async registrarParaFormulario(
    idFormulario: number,
    file: Express.Multer.File | undefined,
    user: AuthUser,
  ) {
    this.somenteProfissional(user);
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const formulario = await this.prisma.formulario.findUnique({
      where: { id_formulario: idFormulario },
    });
    if (!formulario) {
      throw new NotFoundException('Formulário não encontrado');
    }

    return this.prisma.documentos.create({
      data: {
        formulario: { connect: { id_formulario: idFormulario } },
        nome_fisico: file.originalname,
        caminho: file.path,
        usuario: { connect: { id_usuario: user.id_usuario } },
      },
    });
  }

  listarPorFormulario(idFormulario: number) {
    return this.prisma.documentos.findMany({
      where: { id_formulario: idFormulario, excluido: false },
      orderBy: { id_documento: 'desc' },
    });
  }

  // Retorna o documento validando que ainda existe (lógica e fisicamente).
  async paraDownload(idDocumento: number) {
    const doc = await this.prisma.documentos.findUnique({
      where: { id_documento: idDocumento },
    });
    if (!doc || doc.excluido) {
      throw new NotFoundException('Documento não encontrado');
    }
    if (!existsSync(doc.caminho)) {
      throw new NotFoundException('Arquivo físico não encontrado no servidor.');
    }
    return doc;
  }

  // Exclusão lógica (mantém o registro com excluido = true).
  async remover(idDocumento: number, user: AuthUser) {
    this.somenteProfissional(user);
    const doc = await this.prisma.documentos.findUnique({
      where: { id_documento: idDocumento },
    });
    if (!doc || doc.excluido) {
      throw new NotFoundException('Documento não encontrado');
    }
    return this.prisma.documentos.update({
      where: { id_documento: idDocumento },
      data: { excluido: true },
    });
  }

  private somenteProfissional(user: AuthUser) {
    if (user.tipo !== TipoUsuario.PROFISSIONAL) {
      throw new ForbiddenException(
        'Apenas usuários profissionais podem gerenciar documentos.',
      );
    }
  }
}
