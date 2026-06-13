import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/**
 * Resposta de UMA pergunta. Os campos preenchidos dependem do tipo da pergunta:
 * - TEXTO            -> valor_texto
 * - NUMERO           -> valor_numero
 * - BOOLEANO         -> valor_binario
 * - ESCOLHA_UNICA    -> id_opcoes (exatamente 1)
 * - ESCOLHA_MULTIPLA -> id_opcoes (1 ou mais)
 * (valor_data fica disponível para uso futuro de perguntas de data.)
 */
export class RespostaItemDto {
  @ApiProperty({ example: 7, description: 'id_pergunta sendo respondida' })
  @IsInt()
  id_pergunta: number;

  @ApiPropertyOptional({ example: 'Sente-se ansioso antes da escola.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  valor_texto?: string;

  @ApiPropertyOptional({ example: 8, description: 'Resposta numérica' })
  @IsOptional()
  @IsNumber()
  valor_numero?: number;

  @ApiPropertyOptional({ example: true, description: 'Resposta Sim/Não' })
  @IsOptional()
  @IsBoolean()
  valor_binario?: boolean;

  @ApiPropertyOptional({ example: '2026-05-01', description: 'Resposta de data (ISO)' })
  @IsOptional()
  @IsDateString()
  valor_data?: string;

  @ApiPropertyOptional({
    example: [3],
    description: 'IDs das opções escolhidas (escolha única = 1; múltipla = 1+)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  id_opcoes?: number[];
}

export class SalvarRespostasDto {
  @ApiProperty({ type: [RespostaItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RespostaItemDto)
  respostas: RespostaItemDto[];
}
