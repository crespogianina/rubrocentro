// Validación de variables de entorno al arranque (ver auditoría de
// seguridad, TASKS.md). Sin esto el backend podía levantar con JWT_SECRET
// vacío, corto o igual al placeholder commiteado en .env.example, firmando
// tokens falsificables sin ningún aviso. Chequeos a mano en vez de sumar
// Joi como dependencia nueva — el volumen de reglas no lo justifica todavía.

const PLACEHOLDER_JWT_SECRET = 'cambiar-esto-por-un-valor-generado-para-desarrollo';
const JWT_SECRET_LONGITUD_MINIMA = 32;
const EXPIRACION_REGEX = /^\d+(s|m|h|d)$/;

export function validarEnv(config: Record<string, unknown>): Record<string, unknown> {
  const errores: string[] = [];

  const jwtSecret = config.JWT_SECRET;
  if (typeof jwtSecret !== 'string' || jwtSecret.length < JWT_SECRET_LONGITUD_MINIMA) {
    errores.push(`JWT_SECRET debe ser un string de al menos ${JWT_SECRET_LONGITUD_MINIMA} caracteres.`);
  } else if (jwtSecret === PLACEHOLDER_JWT_SECRET) {
    errores.push('JWT_SECRET todavía tiene el valor de ejemplo de .env.example — generá uno propio.');
  }

  const jwtExpiresIn = config.JWT_EXPIRES_IN;
  if (typeof jwtExpiresIn !== 'string' || !EXPIRACION_REGEX.test(jwtExpiresIn)) {
    errores.push("JWT_EXPIRES_IN debe tener formato tipo '45m', '1h' o '7d'.");
  }

  const databaseUrl = config.DATABASE_URL;
  if (typeof databaseUrl !== 'string' || databaseUrl.length === 0) {
    errores.push('DATABASE_URL es requerida.');
  }

  const dolarApiUrl = config.DOLAR_API_URL;
  if (typeof dolarApiUrl !== 'string' || dolarApiUrl.length === 0) {
    errores.push('DOLAR_API_URL es requerida.');
  }

  if (errores.length > 0) {
    throw new Error(`Configuración de entorno inválida:\n- ${errores.join('\n- ')}`);
  }

  return config;
}
