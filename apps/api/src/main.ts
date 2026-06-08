import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Prefixo global para todas as rotas: /api/...
  app.setGlobalPrefix('api');

  // CORS liberado para o app mobile consumir a API
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Validação automática dos DTOs em toda a aplicação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove propriedades não declaradas no DTO
      forbidNonWhitelisted: true, // erro se vier propriedade desconhecida
      transform: true, // converte payloads para os tipos do DTO
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Documentação Swagger em /docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PASI API')
    .setDescription('API da plataforma de apoio ao pré-diagnóstico (PASI)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API rodando em http://localhost:${port}/api  (docs em /docs)`);
}
void bootstrap();
