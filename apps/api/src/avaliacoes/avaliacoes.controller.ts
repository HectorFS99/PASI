import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvaliacoesService } from './avaliacoes.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@ApiTags('avaliacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('atendimentos/:idAtendimento/formularios/:idFormulario/avaliacoes')
export class AvaliacoesController {
  constructor(private readonly avaliacoesService: AvaliacoesService) {}

  @Post('iniciar')
  @ApiOperation({
    summary: 'Inicia a análise do formulário (marca "Em avaliação") — profissional',
  })
  iniciar(
    @Param('idAtendimento', ParseIntPipe) idAtendimento: number,
    @Param('idFormulario', ParseIntPipe) idFormulario: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.avaliacoesService.iniciar(idAtendimento, idFormulario, user);
  }

  @Post()
  @ApiOperation({
    summary: 'Avalia um formulário respondido, com observação obrigatória (profissional)',
  })
  avaliar(
    @Param('idAtendimento', ParseIntPipe) idAtendimento: number,
    @Param('idFormulario', ParseIntPipe) idFormulario: number,
    @Body() dto: CreateAvaliacaoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.avaliacoesService.avaliar(idAtendimento, idFormulario, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista as avaliações de um formulário do atendimento' })
  listar(
    @Param('idAtendimento', ParseIntPipe) idAtendimento: number,
    @Param('idFormulario', ParseIntPipe) idFormulario: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.avaliacoesService.listar(idAtendimento, idFormulario, user);
  }
}
