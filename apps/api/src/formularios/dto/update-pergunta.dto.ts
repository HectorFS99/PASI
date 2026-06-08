import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateOpcaoDto } from './create-opcao.dto';

export class UpdatePerguntaDto {
  @ApiPropertyOptional({ example: 'Texto revisado da pergunta' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  pergunta?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  id_tipo_pergunta?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  obrigatoria?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  valor_minimo?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  valor_maximo?: number;

  @ApiPropertyOptional({
    type: [CreateOpcaoDto],
    description: 'Se informado, substitui todas as opções da pergunta',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOpcaoDto)
  opcoes?: CreateOpcaoDto[];
}
