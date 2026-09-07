import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getEstado(): { estado: string } {
    return { estado: 'ok' };
  }
}
