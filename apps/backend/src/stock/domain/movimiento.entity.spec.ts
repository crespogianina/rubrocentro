import { describe, expect, it } from 'vitest';
import { Movimiento } from './movimiento.entity.js';

// Sin caso de uso todavía (Stage 2, PR base) — se testean acá las
// invariantes de la entidad, que Task 5/6 (RegistrarMovimiento, AjustarStock)
// van a reutilizar sin tener que reimplementarlas.

function propsValidas() {
  return {
    id: 'mov-1',
    varianteId: 'var-1',
    depositoId: 'dep-1',
    tipo: 'venta' as const,
    cantidad: 1,
    motivo: null,
    usuarioId: 'user-1',
    referenciaTipo: null,
    referenciaId: null,
  };
}

describe('Movimiento', () => {
  it('crea un movimiento válido con fecha por defecto', () => {
    const movimiento = Movimiento.crear(propsValidas());

    expect(movimiento.tipo).toBe('venta');
    expect(movimiento.cantidad).toBe(1);
    expect(movimiento.toProps().fecha).toBeInstanceOf(Date);
  });

  it('rechaza una cantidad menor o igual a cero', () => {
    expect(() => Movimiento.crear({ ...propsValidas(), cantidad: 0 })).toThrow();
    expect(() => Movimiento.crear({ ...propsValidas(), cantidad: -5 })).toThrow();
  });

  it('rechaza un movimiento sin variante, depósito o usuario', () => {
    expect(() => Movimiento.crear({ ...propsValidas(), varianteId: '  ' })).toThrow();
    expect(() => Movimiento.crear({ ...propsValidas(), depositoId: '' })).toThrow();
    expect(() => Movimiento.crear({ ...propsValidas(), usuarioId: ' ' })).toThrow();
  });

  it('rechaza un ajuste (alta o baja) sin motivo', () => {
    expect(() => Movimiento.crear({ ...propsValidas(), tipo: 'ajuste_alta', motivo: null })).toThrow();
    expect(() => Movimiento.crear({ ...propsValidas(), tipo: 'ajuste_baja', motivo: '   ' })).toThrow();
  });

  it('acepta un ajuste con motivo', () => {
    const movimientoAlta = Movimiento.crear({
      ...propsValidas(),
      tipo: 'ajuste_alta',
      motivo: 'Conteo físico encontró más unidades de las registradas',
    });
    const movimientoBaja = Movimiento.crear({
      ...propsValidas(),
      tipo: 'ajuste_baja',
      motivo: 'Rotura detectada en control de stock',
    });

    expect(movimientoAlta.tipo).toBe('ajuste_alta');
    expect(movimientoBaja.tipo).toBe('ajuste_baja');
  });
});
