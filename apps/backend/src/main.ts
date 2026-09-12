import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

// Ver docs/ARQUITECTURA.md, sección "Backend": esta API escucha SOLO en
// 127.0.0.1 para el MVP (un local, una instalación) — no hay Windows
// Service ni bind a la LAN todavía (eso es Fase 3, condicional).
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new DomainExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('RubroCero API')
    .setDescription('Ver docs/ARQUITECTURA.md para el diseño completo.')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '127.0.0.1');
}
await bootstrap();
