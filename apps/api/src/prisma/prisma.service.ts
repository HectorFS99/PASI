import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    // Extensão usada nas buscas sem sensibilidade a acentos (unaccent()).
    // Se o usuário do banco não puder criar extensões, as buscas caem no
    // fallback case-insensitive dos services.
    try {
      await this.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS unaccent');
    } catch {
      // sem permissão — segue sem unaccent
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
