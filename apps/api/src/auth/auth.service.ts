import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
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

  async esqueceuSenha(dto: ForgotPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Responde sempre com sucesso — não revela se o e-mail existe (segurança)
    if (!usuario) {
      return { message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' };
    }

    const token = randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.usuario.update({
      where: { id_usuario: usuario.id_usuario },
      data: { senha_reset_token: token, senha_reset_expira_em: expira },
    });

    // TODO: enviar e-mail com link de recuperação (configurar SMTP via env vars)
    const link = `${process.env.APP_URL ?? 'http://localhost:3000'}/auth/redefinir-senha?token=${token}`;
    console.log(`[reset-senha] link para ${usuario.email}: ${link}`);

    return { message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' };
  }
}
