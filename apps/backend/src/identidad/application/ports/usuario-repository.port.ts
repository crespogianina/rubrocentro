import { Usuario } from '../../domain/usuario.entity.js';

// Puerto (interfaz) — lo implementa un adaptador de infraestructura
// (Stage 3 de TASKS.md: PrismaUsuarioRepository). El caso de uso no sabe ni
// le importa si detrás hay SQLite, Postgres o un mock de test.
export interface UsuarioRepository {
  buscarPorUsuario(usuario: string): Promise<Usuario | null>;
}

export const USUARIO_REPOSITORY = Symbol('UsuarioRepository');
