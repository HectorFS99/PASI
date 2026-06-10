import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

/**
 * Campos que o próprio usuário pode editar no seu perfil.
 * CPF é intencionalmente omitido — não pode ser alterado.
 */
export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  @IsOptional()
  @IsString()
  @MaxLength(70)
  nome?: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(50)
  email?: string;

  @ApiPropertyOptional({ example: '11988887777' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  tel_celular?: string;

  @ApiPropertyOptional({ example: 'M', description: 'Sexo (1 caractere)' })
  @IsOptional()
  @IsString()
  @Length(1, 1)
  sexo?: string;

  @ApiPropertyOptional({ example: '2015-04-23', description: 'Data de nascimento (ISO)' })
  @IsOptional()
  @IsDateString()
  dt_nascimento?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  nac_estrangeira?: boolean;

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
}
