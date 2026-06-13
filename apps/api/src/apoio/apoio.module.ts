import { Module } from '@nestjs/common';
import { ApoioController } from './apoio.controller';
import { ApoioService } from './apoio.service';

@Module({
  controllers: [ApoioController],
  providers: [ApoioService],
})
export class ApoioModule {}
