import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { createReadStream, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { DocumentosService } from './documentos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

// Pasta local de uploads (criada na carga do módulo). Disco efêmero no
// Render — trocar por storage em nuvem antes de produção, se necessário.
const UPLOADS_DIR = join(process.cwd(), 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const unico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unico}${extname(file.originalname)}`);
  },
});

@ApiTags('documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Post('formularios/:idFormulario/documentos')
  @ApiOperation({ summary: 'Envia um arquivo de apoio para um formulário (profissional)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { arquivo: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  upload(
    @Param('idFormulario', ParseIntPipe) idFormulario: number,
    @UploadedFile() arquivo: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documentosService.registrarParaFormulario(
      idFormulario,
      arquivo,
      user,
    );
  }

  @Get('formularios/:idFormulario/documentos')
  @ApiOperation({ summary: 'Lista os arquivos de apoio de um formulário' })
  listar(@Param('idFormulario', ParseIntPipe) idFormulario: number) {
    return this.documentosService.listarPorFormulario(idFormulario);
  }

  @Get('documentos/:id/download')
  @ApiOperation({ summary: 'Baixa um documento' })
  async download(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StreamableFile> {
    const doc = await this.documentosService.paraDownload(id);
    const stream = createReadStream(doc.caminho);
    return new StreamableFile(stream, {
      disposition: `attachment; filename="${doc.nome_fisico ?? 'arquivo'}"`,
    });
  }

  @Delete('documentos/:id')
  @ApiOperation({ summary: 'Exclui (logicamente) um documento (profissional)' })
  remover(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documentosService.remover(id, user);
  }
}
