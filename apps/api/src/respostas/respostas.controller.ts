import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RespostasService } from './respostas.service';
import { SalvarRespostasDto } from './dto/salvar-respostas.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@ApiTags('respostas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('atendimentos/:idAtendimento/formularios/:idFormulario')
export class RespostasController {
  constructor(private readonly respostasService: RespostasService) {}

  @Post('iniciar')
  @ApiOperation({
    summary: 'Inicia o preenchimento de um formulário atribuído (paciente)',
  })
  iniciar(
    @Param('idAtendimento', ParseIntPipe) idAtendimento: number,
    @Param('idFormulario', ParseIntPipe) idFormulario: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.respostasService.iniciar(idAtendimento, idFormulario, user);
  }

  @Get('respostas')
  @ApiOperation({
    summary:
      'Detalha o formulário com as respostas atuais (paciente dono ou profissional)',
  })
  detalhar(
    @Param('idAtendimento', ParseIntPipe) idAtendimento: number,
    @Param('idFormulario', ParseIntPipe) idFormulario: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.respostasService.detalhar(idAtendimento, idFormulario, user);
  }

  @Put('respostas')
  @ApiOperation({ summary: 'Salva (substitui) as respostas do paciente — mantém Rascunho' })
  salvar(
    @Param('idAtendimento', ParseIntPipe) idAtendimento: number,
    @Param('idFormulario', ParseIntPipe) idFormulario: number,
    @Body() dto: SalvarRespostasDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.respostasService.salvar(idAtendimento, idFormulario, dto, user);
  }

  @Post('concluir')
  @ApiOperation({
    summary: 'Conclui o formulário (valida obrigatórias e marca como Respondido)',
  })
  concluir(
    @Param('idAtendimento', ParseIntPipe) idAtendimento: number,
    @Param('idFormulario', ParseIntPipe) idFormulario: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.respostasService.concluir(idAtendimento, idFormulario, user);
  }
}
