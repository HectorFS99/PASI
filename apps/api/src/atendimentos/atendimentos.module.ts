import { Module } from '@nestjs/common';
import { AtendimentosController } from './atendimentos.controller';
import { AtendimentosService } from './atendimentos.service';

@Module({
  controllers: [AtendimentosController],
  providers: [AtendimentosService],
  exports: [AtendimentosService],
})
export class AtendimentosModule {}
