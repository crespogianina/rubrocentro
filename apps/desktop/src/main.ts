import { app, BrowserWindow } from 'electron';
import { ChildProcess, spawn } from 'node:child_process';
import * as path from 'node:path';

// RubroCero — shell de escritorio.
// Responsabilidad de este proceso (ver docs/ARQUITECTURA.md, sección "Backend"):
//   1. Levantar el backend NestJS local como proceso hijo, escuchando en 127.0.0.1.
//   2. Mostrar el frontend Angular ya compilado (o el dev server, en desarrollo).
// La ventana NUNCA habla directo con SQLite ni con Prisma — todo pasa por la API HTTP
// del backend, incluso corriendo los dos procesos en la misma máquina (Parte II/III).

const isDev = !app.isPackaged;
let backendProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

function startBackend(): void {
  // TODO (Stage 8 de TASKS.md): apuntar al build real del backend
  // (apps/backend/dist/main.js) una vez empaquetado con electron-builder.
  // En desarrollo, se asume que `pnpm --filter backend dev` ya está corriendo
  // por separado — no lo relanzamos acá para no duplicar procesos mientras se
  // itera. Cuando exista el build de producción, este spawn queda así:
  //
  // backendProcess = spawn(process.execPath, [path.join(__dirname, '../../backend/dist/main.js')], {
  //   env: { ...process.env, PORT: '3000' },
  //   stdio: 'ignore',
  // });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      // Nunca aflojar esto (ver docs/ARQUITECTURA.md, sección "Seguridad"):
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    // TODO: puerto real del dev server de Angular (`pnpm --filter frontend dev`).
    mainWindow.loadURL('http://localhost:4200');
  } else {
    // TODO (Stage 8): apuntar al build de producción del frontend.
    mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/frontend/browser/index.html'));
  }
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  backendProcess?.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  backendProcess?.kill();
});
