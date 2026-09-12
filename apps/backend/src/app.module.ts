import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validarEnv } from './config/env.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { IdentidadModule } from './identidad/identidad.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validarEnv }),
    PrismaModule,
    IdentidadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
