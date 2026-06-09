import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@exemplo.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}
