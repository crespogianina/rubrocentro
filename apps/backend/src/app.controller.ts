import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

// Endpoint de salud — sirve para confirmar que el backend local está arriba
// (por ejemplo, desde el shell de Electron antes de mostrar la ventana).
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getEstado(): { estado: string } {
    return this.appService.getEstado();
  }
}
