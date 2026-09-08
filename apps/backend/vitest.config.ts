import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  //
  // swc.vite() reemplaza la transformación por defecto de Vitest (esbuild),
  // que no emite metadata de decoradores (`emitDecoratorMetadata`) — sin
  // esto, la inyección de dependencias de Nest recibe `undefined` en los
  // tests para cualquier clase con constructor decorado (@Injectable,
  // @Controller). Ver receta oficial: https://docs.nestjs.com/recipes/swc#vitest
  plugins: [tsconfigPaths(), swc.vite()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
  },
});
