import { Module } from '@nestjs/common';
import { FormulariosController } from './formularios.controller';
import { FormulariosService } from './formularios.service';

@Module({
  controllers: [FormulariosController],
  providers: [FormulariosService],
  exports: [FormulariosService],
})
export class FormulariosModule {}
