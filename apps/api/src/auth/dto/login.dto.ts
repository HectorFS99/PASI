import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'maria@email.com',
    description: 'E-mail ou CPF (somente números) do usuário',
  })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @IsNotEmpty()
  senha: string;
}
