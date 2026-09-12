import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validarEnv } from './config/env.validation.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validarEnv })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
