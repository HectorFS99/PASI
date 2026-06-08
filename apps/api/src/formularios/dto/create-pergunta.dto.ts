import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateOpcaoDto } from './create-opcao.dto';

export class CreatePerguntaDto {
  @ApiProperty({ example: 'A criança costuma se preocupar demais com o futuro?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  pergunta: string;

  @ApiProperty({
    example: 4,
    description:
      'id_tipo_pergunta: 1=TEXTO, 2=NUMERO, 3=BOOLEANO, 4=ESCOLHA_UNICA, 5=ESCOLHA_MULTIPLA',
  })
  @IsInt()
  id_tipo_pergunta: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  obrigatoria?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Valor mínimo (perguntas numéricas)' })
  @IsOptional()
  @IsInt()
  valor_minimo?: number;

  @ApiPropertyOptional({ example: 10, description: 'Valor máximo (perguntas numéricas)' })
  @IsOptional()
  @IsInt()
  valor_maximo?: number;

  @ApiPropertyOptional({
    type: [CreateOpcaoDto],
    description: 'Opções (obrigatório para ESCOLHA_UNICA e ESCOLHA_MULTIPLA)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpcaoDto)
  opcoes?: CreateOpcaoDto[];
}
