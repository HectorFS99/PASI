import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateProfissionalDto } from './dto/create-profissional.dto';
import { CreatePacienteDto } from './dto/create-paciente.dto';
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o cadastro completo do usuário autenticado' })
  me(@CurrentUser() user: AuthUser) {
    return this.usuariosService.findById(user.id_usuario);
  }
}
