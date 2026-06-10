import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum OrdenarAtendimentoPor {
  DATA_DESC = 'data_desc',
  DATA_ASC = 'data_asc',
  PACIENTE = 'paciente',
}

export class QueryAtendimentoDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, description: '10 itens por página (padrão)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'João',
    description: 'Busca por descrição do atendimento ou nome do paciente',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: '1,3,5',
    description: 'IDs de situação separados por vírgula (ex: 1,2,3)',
  })
  @IsOptional()
  @IsString()
  situacoes?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Data de cadastro — início do intervalo' })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Data de cadastro — fim do intervalo' })
  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @ApiPropertyOptional({ enum: OrdenarAtendimentoPor, default: OrdenarAtendimentoPor.DATA_DESC })
  @IsOptional()
  @IsEnum(OrdenarAtendimentoPor)
  ordenar_por?: OrdenarAtendimentoPor = OrdenarAtendimentoPor.DATA_DESC;
}
