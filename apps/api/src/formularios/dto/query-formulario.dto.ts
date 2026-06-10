import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum OrdenarFormularioPor {
  DATA_DESC = 'data_desc',
  DATA_ASC = 'data_asc',
  NOME = 'nome',
  MAIS_RESPONDIDOS = 'mais_respondidos',
}

export class QueryFormularioDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'Triagem', description: 'Busca por nome do formulário' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Filtra por id_tipo_formulario' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_tipo_formulario?: number;

  @ApiPropertyOptional({ example: true, description: 'true = apenas ativos, false = apenas inativos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Data de criação — início do intervalo' })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Data de criação — fim do intervalo' })
  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @ApiPropertyOptional({ enum: OrdenarFormularioPor, default: OrdenarFormularioPor.DATA_DESC })
  @IsOptional()
  @IsEnum(OrdenarFormularioPor)
  ordenar_por?: OrdenarFormularioPor = OrdenarFormularioPor.DATA_DESC;
}
