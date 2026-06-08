import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreatePerguntaDto } from './create-pergunta.dto';

export class CreateFormularioDto {
  @ApiProperty({ example: 2, description: 'id_tipo_formulario (1=Triagem, 2=Pré-diagnóstico...)' })
  @IsInt()
  id_tipo_formulario: number;

  @ApiPropertyOptional({ example: 'Pré-diagnóstico de ansiedade infantil' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nome?: string;

  @ApiPropertyOptional({ example: 'Ficha baseada nos exemplares de pré-diagnóstico' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  descricao?: string;

  @ApiPropertyOptional({
    type: [CreatePerguntaDto],
    description: 'Perguntas iniciais do formulário (podem ser adicionadas depois)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePerguntaDto)
  perguntas?: CreatePerguntaDto[];
}
