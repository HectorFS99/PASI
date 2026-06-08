import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
} from 'class-validator';

export class AtribuirFormulariosDto {
  @ApiProperty({
    example: [3],
    description: 'IDs dos formulários a atribuir ao atendimento',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  formularios: number[];
}
