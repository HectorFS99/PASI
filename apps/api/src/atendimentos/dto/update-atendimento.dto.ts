import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAtendimentoDto {
  @ApiPropertyOptional({ example: 'Descrição atualizada' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  descricao?: string;

  @ApiPropertyOptional({
    example: 2,
    description:
      'Troca o paciente vinculado. Permitido apenas quando a situação é "Criado".',
  })
  @IsOptional()
  @IsInt()
  id_usuario_paciente?: number;
}
