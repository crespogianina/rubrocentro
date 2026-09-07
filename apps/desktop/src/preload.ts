import { contextBridge } from 'electron';

// Puente seguro hacia el renderer (Angular). No exponer `ipcRenderer` ni
// ningún módulo de Node directamente — cada capacidad que el frontend
// necesite del sistema operativo (imprimir, leer info de la app, etc.) se
// agrega acá explícitamente a medida que se construye (ver Stage 9 de
// TASKS.md para impresión).
contextBridge.exposeInMainWorld('rubrocero', {
  version: (): string => process.env.npm_package_version ?? 'dev',
});
