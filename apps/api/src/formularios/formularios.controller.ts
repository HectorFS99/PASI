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
import { FormulariosService } from './formularios.service';
import { CreateFormularioDto } from './dto/create-formulario.dto';
import { UpdateFormularioDto } from './dto/update-formulario.dto';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';
import { QueryFormularioDto } from './dto/query-formulario.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@ApiTags('formularios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('formularios')
export class FormulariosController {
  constructor(private readonly formulariosService: FormulariosService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um formulário (opcionalmente já com perguntas)' })
  create(@Body() dto: CreateFormularioDto, @CurrentUser() user: AuthUser) {
    return this.formulariosService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista formulários (paginado, com busca por nome)' })
  findAll(@Query() query: QueryFormularioDto) {
    return this.formulariosService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um formulário com perguntas e opções' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.formulariosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita dados do formulário (nome, descrição, tipo)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFormularioDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.formulariosService.update(id, dto, user);
  }

  @Patch(':id/desativar')
  @ApiOperation({ summary: 'Desativa o formulário (impede novas atribuições)' })
  desativar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.formulariosService.desativar(id, user);
  }

  @Patch(':id/reativar')
  @ApiOperation({ summary: 'Reativa um formulário desativado' })
  reativar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.formulariosService.reativar(id, user);
  }

  @Post(':id/perguntas')
  @ApiOperation({ summary: 'Adiciona uma pergunta (bloqueado se já respondido)' })
  addPergunta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePerguntaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.formulariosService.addPergunta(id, dto, user);
  }

  @Patch(':id/perguntas/:idPergunta')
  @ApiOperation({ summary: 'Edita uma pergunta (bloqueado se já respondida)' })
  updatePergunta(
    @Param('id', ParseIntPipe) id: number,
    @Param('idPergunta', ParseIntPipe) idPergunta: number,
    @Body() dto: UpdatePerguntaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.formulariosService.updatePergunta(id, idPergunta, dto, user);
  }

  @Delete(':id/perguntas/:idPergunta')
  @ApiOperation({ summary: 'Exclui uma pergunta (bloqueado se já respondida)' })
  removePergunta(
    @Param('id', ParseIntPipe) id: number,
    @Param('idPergunta', ParseIntPipe) idPergunta: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.formulariosService.removePergunta(id, idPergunta, user);
  }
}
