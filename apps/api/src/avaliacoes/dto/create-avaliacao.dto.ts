import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAvaliacaoDto {
  @ApiProperty({
    example: 'Respostas indicam sinais moderados de ansiedade. Encaminhar para psicólogo.',
    description: 'Observação final do avaliador (obrigatória)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  observacao: string;
}
