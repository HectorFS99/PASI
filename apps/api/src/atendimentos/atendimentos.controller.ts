import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AtendimentosService } from './atendimentos.service';
import { CreateAtendimentoDto } from './dto/create-atendimento.dto';
import { UpdateAtendimentoDto } from './dto/update-atendimento.dto';
import { AtribuirFormulariosDto } from './dto/atribuir-formularios.dto';
import { QueryAtendimentoDto } from './dto/query-atendimento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@ApiTags('atendimentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('atendimentos')
export class AtendimentosController {
  constructor(private readonly atendimentosService: AtendimentosService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um atendimento e atribui formulários (profissional)' })
  create(@Body() dto: CreateAtendimentoDto, @CurrentUser() user: AuthUser) {
    return this.atendimentosService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      'Lista atendimentos (profissional vê todos; paciente vê os seus). Paginado, com busca.',
  })
  findAll(@Query() query: QueryAtendimentoDto, @CurrentUser() user: AuthUser) {
    return this.atendimentosService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um atendimento e seus formulários atribuídos' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.atendimentosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita descrição e/ou paciente do atendimento' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAtendimentoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.atendimentosService.update(id, dto, user);
  }

  @Post(':id/formularios')
  @ApiOperation({ summary: 'Atribui novos formulários ao atendimento' })
  atribuirFormularios(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtribuirFormulariosDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.atendimentosService.atribuirFormularios(id, dto, user);
  }

  @Delete(':id/formularios/:idFormulario')
  @ApiOperation({ summary: 'Remove um formulário do atendimento (apenas em "Criado")' })
  removerFormulario(
    @Param('id', ParseIntPipe) id: number,
    @Param('idFormulario', ParseIntPipe) idFormulario: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.atendimentosService.removerFormulario(id, idFormulario, user);
  }

  @Patch(':id/encerrar')
  @ApiOperation({ summary: 'Encerra o atendimento (apenas quando "Avaliado")' })
  encerrar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.atendimentosService.encerrar(id, user);
  }

  @Patch(':id/inativar')
  @ApiOperation({ summary: 'Inativa o atendimento (criado indevidamente)' })
  inativar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.atendimentosService.inativar(id, user);
  }
}
