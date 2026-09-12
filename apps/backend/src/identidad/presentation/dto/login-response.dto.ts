import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  usuarioId!: string;

  @ApiProperty({ example: 'admin' })
  rol!: string;
}
