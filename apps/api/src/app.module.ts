import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AtendimentosModule } from './atendimentos/atendimentos.module';
import { FormulariosModule } from './formularios/formularios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    AtendimentosModule,
    FormulariosModule,
  ],
})
export class AppModule {}
