import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAtendimentoDto {
  @ApiPropertyOptional({ example: 'Triagem inicial do paciente João' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  descricao?: string;

  @ApiProperty({ example: 2, description: 'id_usuario do paciente atendido' })
  @IsInt()
  id_usuario_paciente: number;

  @ApiProperty({
    example: [1, 2],
    description: 'IDs dos formulários atribuídos ao atendimento',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  formularios: number[];
}
