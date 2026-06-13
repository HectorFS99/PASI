import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { SENHA_MENSAGEM, SENHA_REGEX } from '../../common/constants';

export class CreateProfissionalDto {
  @ApiProperty({ example: 'Maria Souza' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(70)
  nome: string;

  @ApiProperty({ example: '12345678901', description: 'CPF somente números' })
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 dígitos numéricos' })
  cpf: string;

  @ApiProperty({ example: 'maria@email.com' })
  @IsEmail()
  @MaxLength(50)
  email: string;

  @ApiProperty({ example: '11999998888', description: 'Telefone celular' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  tel_celular: string;

  @ApiProperty({ example: 1, description: 'FK para profissao (id_profissao)' })
  @IsInt()
  id_profissao: number;

  @ApiProperty({
    example: 1,
    description: 'FK para unidade_atendimento (id_unidade_atendimento)',
  })
  @IsInt()
  id_unidade_atendimento: number;

  @ApiProperty({ example: 'F', description: 'Sexo (1 caractere)' })
  @IsString()
  @Length(1, 1)
  sexo: string;

  @ApiProperty({ example: 'Senha@123' })
  @Matches(SENHA_REGEX, { message: SENHA_MENSAGEM })
  senha: string;
}
