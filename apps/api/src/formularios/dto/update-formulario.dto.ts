import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFormularioDto {
  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  id_tipo_formulario?: number;

  @ApiPropertyOptional({ example: 'Novo nome do formulário' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nome?: string;

  @ApiPropertyOptional({ example: 'Nova descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  descricao?: string;
}
