import { spawnSync } from 'node:child_process';
import { chmodSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

if (process.env.CI && process.env.CI !== 'false') {
  console.log('CI: se omite la instalación de hooks locales.');
  process.exit(0);
}

const projectRoot = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const git = (...args) => spawnSync('git', args, { cwd: projectRoot, encoding: 'utf8' });
const root = git('rev-parse', '--show-toplevel');
if (root.status !== 0) {
  console.log('Sin repositorio Git: se omite la instalación de hooks.');
  process.exit(0);
}
if (realpathSync(root.stdout.trim()) !== projectRoot) {
  throw new Error('El proyecto no es la raíz del repositorio Git; instala los hooks manualmente.');
}

const current = git('config', '--get', 'core.hooksPath');
if (current.status !== 0 && current.status !== 1) {
  throw new Error(current.stderr || 'No se pudo leer core.hooksPath.');
}
if (current.status === 0 && current.stdout.trim() !== '.githooks') {
  throw new Error('Ya existe otro core.hooksPath. Revisa esa configuración antes de ejecutar git config --local core.hooksPath .githooks.');
}

for (const hook of ['pre-commit', 'pre-push']) {
  chmodSync(join(projectRoot, '.githooks', hook), 0o755);
}
const installed = git('config', '--local', 'core.hooksPath', '.githooks');
if (installed.status !== 0) {
  throw new Error(installed.stderr || 'No se pudo configurar core.hooksPath.');
}
console.log('Hooks pre-commit y pre-push instalados en .githooks.');
