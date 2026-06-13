import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApoioService } from './apoio.service';

@ApiTags('apoio')
@Controller('apoio')
export class ApoioController {
  constructor(private readonly apoioService: ApoioService) {}

  @Get('generos')
  @ApiOperation({ summary: 'Lista os gêneros (cadastro de paciente)' })
  generos() {
    return this.apoioService.generos();
  }

  @Get('profissoes')
  @ApiOperation({ summary: 'Lista as profissões (cadastro de profissional)' })
  profissoes() {
    return this.apoioService.profissoes();
  }

  @Get('unidades')
  @ApiOperation({ summary: 'Lista as unidades de atendimento (cadastro de profissional)' })
  unidades() {
    return this.apoioService.unidades();
  }

  @Get('tipos-unidade')
  @ApiOperation({ summary: 'Lista os tipos de unidade de atendimento' })
  tiposUnidade() {
    return this.apoioService.tiposUnidade();
  }

  @Get('tipos-formulario')
  @ApiOperation({ summary: 'Lista os tipos de formulário' })
  tiposFormulario() {
    return this.apoioService.tiposFormulario();
  }

  @Get('tipos-pergunta')
  @ApiOperation({ summary: 'Lista os tipos de pergunta ativos' })
  tiposPergunta() {
    return this.apoioService.tiposPergunta();
  }

  @Get('situacoes-atendimento')
  @ApiOperation({ summary: 'Lista as situações de atendimento' })
  situacoesAtendimento() {
    return this.apoioService.situacoesAtendimento();
  }

  @Get('situacoes-formulario')
  @ApiOperation({ summary: 'Lista as situações de formulário' })
  situacoesFormulario() {
    return this.apoioService.situacoesFormulario();
  }
}
