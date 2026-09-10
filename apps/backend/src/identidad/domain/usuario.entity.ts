// Entidad de dominio — nunca importa nada de Prisma, Nest ni HTTP.
//
// Sin `crear()`/invariantes de construcción todavía: esta tarea (Stage 2,
// TASKS.md) solo necesita leer un usuario ya persistido para autenticarlo.
// `CrearUsuario` (si hace falta más adelante, para una pantalla de alta de
// usuarios) es la que agregaría esas validaciones — no las adelantamos acá
// sin un caso de uso real que las necesite (ver CLAUDE.md, "No
// overengineering").

export interface UsuarioProps {
  id: string;
  nombre: string;
  usuario: string; // nombre de login, no necesariamente un email
  passwordHash: string;
  rolNombre: string; // 'admin' | 'encargado' | 'vendedor' | 'tecnico'
  activo: boolean; // false si el usuario tiene deletedAt (soft-delete)
}

export class CredencialesInvalidasError extends Error {}

export class Usuario {
  private constructor(private readonly props: UsuarioProps) {}

  static reconstruir(props: UsuarioProps): Usuario {
    return new Usuario(props);
  }

  get id(): string {
    return this.props.id;
  }

  get usuario(): string {
    return this.props.usuario;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get rolNombre(): string {
    return this.props.rolNombre;
  }

  get activo(): boolean {
    return this.props.activo;
  }

  toProps(): UsuarioProps {
    return { ...this.props };
  }
}
