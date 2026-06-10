import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateProfissionalDto } from './dto/create-profissional.dto';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('profissional')
  @ApiOperation({ summary: 'Cadastra um usuário profissional' })
  createProfissional(@Body() dto: CreateProfissionalDto) {
    return this.usuariosService.createProfissional(dto);
  }

  @Post('paciente')
  @ApiOperation({ summary: 'Cadastra um usuário paciente' })
  createPaciente(@Body() dto: CreatePacienteDto) {
    return this.usuariosService.createPaciente(dto);
  }

  @Get('pacientes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista pacientes para seleção pelo profissional (máx. 20)' })
  listPacientes(@Query('search') search: string | undefined, @CurrentUser() user: AuthUser) {
    return this.usuariosService.listPacientes(search, user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o cadastro completo do usuário autenticado' })
  me(@CurrentUser() user: AuthUser) {
    return this.usuariosService.findById(user.id_usuario);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza os dados pessoais do usuário autenticado (exceto CPF)' })
  updateMe(@Body() dto: UpdateMeDto, @CurrentUser() user: AuthUser) {
    return this.usuariosService.updateMe(user.id_usuario, dto);
  }
}
