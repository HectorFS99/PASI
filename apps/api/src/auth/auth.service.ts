import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const identifier = dto.login.trim();
    const isEmail = identifier.includes('@');

    const usuario = await this.prisma.usuario.findFirst({
      where: isEmail
        ? { email: identifier.toLowerCase() }
        : { cpf: identifier.replace(/\D/g, '') },
    });

    if (!usuario || !usuario.senha_hash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaConfere = await bcrypt.compare(dto.senha, usuario.senha_hash);
    if (!senhaConfere) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      sub: usuario.id_usuario,
      tipo: usuario.id_tipo_usuario,
      email: usuario.email,
    };

    const { senha_hash, ...usuarioSemSenha } = usuario;
    void senha_hash;

    return {
      access_token: await this.jwt.signAsync(payload),
      usuario: usuarioSemSenha,
    };
  }
}
