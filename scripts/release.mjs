import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function versionFromTag(tag) {
  if (typeof tag !== 'string' || !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) {
    throw new Error('El tag debe tener formato vX.Y.Z, sin ceros iniciales ni sufijos.');
  }
  const version = tag.slice(1);
  const numbers = version.split('.').map(Number);
  if (numbers.some(n => n > 65535) || numbers.every(n => n === 0)) {
    throw new Error('La versión debe ser distinta de 0.0.0 y sus componentes no deben superar 65535.');
  }
  return version;
}

export function releaseNotes(changelog, version) {
  const sections = [...changelog.matchAll(/^##[ \t]+\[([^\]\r\n]+)\][^\r\n]*\r?$/gm)];
  const matches = sections.filter(section => section[1] === version);
  if (matches.length !== 1) throw new Error(`Debe existir un único bloque de notas para ${version}.`);
  const section = matches[0];
  const start = section.index + section[0].length;
  // Cualquier encabezado de nivel 2 termina el bloque, incluso si no usa corchetes.
  const remaining = changelog.slice(start);
  const end = remaining.search(/^##[ \t]+/m);
  const notes = (end === -1 ? remaining : remaining.slice(0, end)).trim();
  const content = notes.replace(/<!--[\s\S]*?-->/g, '').replace(/^#+[^\r\n]*$/gm, '').trim();
  if (!content) throw new Error(`Las notas de ${version} están vacías.`);
  return `${notes}\n`;
}

export function validateMetadata(tag, root = process.cwd()) {
  const version = versionFromTag(tag);
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
  if (pkg.version !== version || lock.version !== version || lock.packages?.['']?.version !== version) {
    throw new Error('El tag, package.json y las versiones raíz de package-lock.json deben coincidir.');
  }
  return { version, notes: releaseNotes(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), version) };
}

const execute = (command, args, options = {}) => execFileSync(command, args, { maxBuffer: 64 * 1024 * 1024, ...options });
export const zipName = version => `simi-${version}-chrome.zip`;

function filesBelow(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true }).flatMap(entry => {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? filesBelow(root, name) : [name];
  });
}

export function validateArchive(archive, version, buildRoot, run = execute) {
  const entries = run('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split(/\r?\n/);
  if (entries.some(name => !name || name.startsWith('/') || name.includes('\\') || name.split('/').includes('..')) || new Set(entries).size !== entries.length) {
    throw new Error('El ZIP contiene rutas inválidas o duplicadas.');
  }
  const files = entries.filter(name => !name.endsWith('/'));
  const readEntry = name => run('unzip', ['-p', archive, name]);
  if (!files.includes('manifest.json')) throw new Error('El ZIP debe contener manifest.json en su raíz.');
  const manifest = JSON.parse(readEntry('manifest.json').toString('utf8'));
  if (manifest.version !== version || manifest.manifest_version !== 3) {
    throw new Error('El manifiesto del ZIP no corresponde a la versión objetivo de Manifest V3.');
  }
  for (const name of ['popup.html', 'pdf.html', 'background.js', 'pdfjs/LICENSE', ...[16, 32, 48, 128].map(size => `icon/${size}.png`)]) {
    if (!files.includes(name)) throw new Error(`Falta un recurso en el ZIP: ${name}`);
  }
  for (const folder of ['cmaps', 'standard_fonts', 'wasm']) {
    if (!files.some(name => name.startsWith(`pdfjs/${folder}/`))) throw new Error(`Faltan recursos PDF.js: ${folder}`);
  }
  if (buildRoot) {
    const built = filesBelow(buildRoot).sort();
    if (JSON.stringify([...files].sort()) !== JSON.stringify(built)) throw new Error('El ZIP y la carpeta compilada contienen archivos distintos.');
    for (const name of files) {
      if (!readEntry(name).equals(readFileSync(join(buildRoot, name)))) throw new Error(`El ZIP difiere del build probado: ${name}`);
    }
  }
  return manifest;
}

export function bundleRelease(tag, destination, root = process.cwd()) {
  const { version, notes } = validateMetadata(tag, root);
  const output = join(root, '.output');
  const archives = readdirSync(output).filter(name => name.endsWith('.zip'));
  const expected = zipName(version);
  if (archives.length !== 1 || archives[0] !== expected) throw new Error(`Se esperaba únicamente .output/${expected}; elimina ZIPs anteriores antes de empaquetar.`);
  const archive = join(output, expected);
  validateArchive(archive, version, join(output, 'chrome-mv3'));
  // Una carpeta nueva evita incluir archivos residuales en el artefacto de entrega.
  mkdirSync(destination, { recursive: false });
  copyFileSync(archive, join(destination, expected));
  writeFileSync(join(destination, 'notes.md'), notes);
  return { version, archive: join(destination, expected) };
}

export function publishRelease(tag, bundle, repository, run = execute) {
  const version = versionFromTag(tag);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '')) throw new Error('GITHUB_REPOSITORY debe identificar propietario/repositorio.');
  const archive = join(bundle, zipName(version));
  const notesFile = join(bundle, 'notes.md');
  const files = readdirSync(bundle).sort();
  if (JSON.stringify(files) !== JSON.stringify(['notes.md', zipName(version)].sort()) || !readFileSync(notesFile, 'utf8').trim()) {
    throw new Error('El artefacto debe contener únicamente el ZIP esperado y notas no vacías.');
  }
  validateArchive(archive, version, undefined, run);
  // Consultar todas las páginas evita confundir un fallo HTTP (incluido 404 del
  // repositorio) con la ausencia de una Release. Cualquier error detiene el proceso.
  const tags = run('gh', ['api', '--paginate', `repos/${repository}/releases`, '--jq', '.[].tag_name'], { encoding: 'utf8' }).split(/\r?\n/);
  if (tags.includes(tag)) throw new Error(`Ya existe una Release para ${tag}; no se sobrescribirá.`);
  run('gh', ['release', 'create', tag, archive, '--repo', repository, '--verify-tag', '--title', `Simi ${version}`, '--notes-file', notesFile], { stdio: 'inherit' });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command, tag, directory, ...extra] = process.argv.slice(2);
    if (extra.length) throw new Error('Demasiados argumentos.');
    if (command === 'validate' && !directory) {
      const { version } = validateMetadata(tag);
      console.log(`Metadatos válidos para ${version}.`);
    } else if (command === 'bundle' && directory) {
      const { archive } = bundleRelease(tag, resolve(directory));
      console.log(`Paquete de entrega validado: ${archive}`);
    } else if (command === 'publish' && directory) {
      publishRelease(tag, resolve(directory), process.env.GITHUB_REPOSITORY);
    } else {
      throw new Error('Uso: node scripts/release.mjs validate <tag> | bundle <tag> <carpeta-nueva> | publish <tag> <carpeta>');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
