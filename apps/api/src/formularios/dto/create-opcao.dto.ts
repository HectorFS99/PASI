import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOpcaoDto {
  @ApiProperty({ example: 'Sempre' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  texto_opcao: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Valor/peso numérico da opção (para escalas de pontuação)',
  })
  @IsOptional()
  @IsInt()
  valor_opcao?: number;
}
