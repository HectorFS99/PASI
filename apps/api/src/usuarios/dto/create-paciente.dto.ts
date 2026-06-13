import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { SENHA_MENSAGEM, SENHA_REGEX } from '../../common/constants';

export class CreatePacienteDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(70)
  nome: string;

  @ApiProperty({ example: '98765432100', description: 'CPF somente números' })
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 dígitos numéricos' })
  cpf: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  @MaxLength(50)
  email: string;

  @ApiProperty({ example: '11988887777' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  tel_celular: string;

  @ApiPropertyOptional({ example: '2015-04-23', description: 'Data de nascimento (ISO)' })
  @IsOptional()
  @IsDateString()
  dt_nascimento?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  nac_estrangeira?: boolean;

  @ApiProperty({ example: 'M', description: 'Sexo (1 caractere)' })
  @IsString()
  @Length(1, 1)
  sexo: string;

  @ApiPropertyOptional({ example: 1, description: 'FK para genero (id_genero)' })
  @IsOptional()
  @IsInt()
  id_genero?: number;

  @ApiPropertyOptional({ example: '01001000' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  cep?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  logradouro?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  numero?: string;

  @ApiPropertyOptional({ example: 'Apto 45' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  complemento?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bairro?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cidade?: string;

  @ApiPropertyOptional({ example: 'SP', description: 'UF (2 caracteres)' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  estado?: string;

  @ApiPropertyOptional({ example: 'Brasil' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  pais?: string;

  @ApiProperty({ example: 'Senha@123' })
  @Matches(SENHA_REGEX, { message: SENHA_MENSAGEM })
  senha: string;
}
