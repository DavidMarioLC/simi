import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bundleRelease, publishRelease, releaseNotes, validateArchive, validateMetadata, versionFromTag, zipName } from './release.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'simi-release-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const json = (name, value) => writeFileSync(join(root, name), JSON.stringify(value));
  json('package.json', { version: '0.1.0' });
  json('package-lock.json', { version: '0.1.0', packages: { '': { version: '0.1.0' } } });
  writeFileSync(join(root, 'CHANGELOG.md'), '## [Pendiente]\n\n## [0.1.0]\n\n### Cambios\n- Primera entrega.\n\n## [0.0.1]\n- No incluir.\n');
  return { root, json };
}

function archiveFixture(version = '0.1.0') {
  const entries = new Map([
    ['manifest.json', JSON.stringify({ version, manifest_version: 3 })],
    ...['popup.html', 'pdf.html', 'background.js', 'pdfjs/LICENSE', 'pdfjs/cmaps/a', 'pdfjs/standard_fonts/a', 'pdfjs/wasm/a', ...[16, 32, 48, 128].map(size => `icon/${size}.png`)].map(name => [name, `contenido de ${name}`]),
  ]);
  const run = (command, args) => {
    assert.equal(command, 'unzip');
    if (args[0] === '-Z1') return [...entries.keys()].join('\n');
    return Buffer.from(entries.get(args[2]));
  };
  return { entries, run };
}

test('acepta versiones de Chrome con tres componentes y sus límites', () => {
  for (const version of ['0.1.0', '1.0.0', '65535.65535.65535']) assert.equal(versionFromTag(`v${version}`), version);
  for (const tag of [undefined, '0.1.0', 'v0.0.0', 'v01.2.3', 'v1.02.3', 'v1.2.03', 'v1.2', 'v1.2.3.4', 'v1.2.3-beta', 'v65536.0.0', 'v1.2.3\n', 'v1.2.3;echo']) {
    assert.throws(() => versionFromTag(tag), undefined, String(tag));
  }
});

test('extrae solo las notas de la versión solicitada, con CRLF y fecha opcional', () => {
  const notes = releaseNotes('## [Pendiente]\r\n- Después\r\n## [0.1.0] - 2026-10-10\r\n### Cambios\r\n- Hola\r\n## Otra sección\r\n- Fuera\r\n', '0.1.0');
  assert.equal(notes, '### Cambios\r\n- Hola\n');
});

test('rechaza notas inexistentes, vacías o duplicadas', () => {
  for (const text of ['## [0.2.0]\n- Otra versión', '## [0.1.0]\n', '## [0.1.0]\n### Cambios\n<!-- pendiente -->\n', '## [0.1.0]\n- Uno\n## [0.1.0]\n- Dos']) {
    assert.throws(() => releaseNotes(text, '0.1.0'));
  }
});

test('exige coincidencia del tag y las tres referencias de versión', t => {
  const { root, json } = fixture(t);
  assert.deepEqual(validateMetadata('v0.1.0', root), { version: '0.1.0', notes: '### Cambios\n- Primera entrega.\n' });
  assert.throws(() => validateMetadata('v0.2.0', root), /deben coincidir/);
  for (const lock of [{ version: '0.2.0', packages: { '': { version: '0.1.0' } } }, { version: '0.1.0', packages: { '': { version: '0.2.0' } } }, { version: '0.1.0' }]) {
    json('package-lock.json', lock);
    assert.throws(() => validateMetadata('v0.1.0', root), /deben coincidir/);
  }
});

test('valida manifiesto y recursos, y detecta versiones y rutas inválidas', () => {
  const { entries, run } = archiveFixture();
  assert.equal(validateArchive('/fixture.zip', '0.1.0', undefined, run).version, '0.1.0');
  assert.throws(() => validateArchive('/fixture.zip', '0.2.0', undefined, run), /manifiesto/);
  entries.delete('pdfjs/wasm/a');
  assert.throws(() => validateArchive('/fixture.zip', '0.1.0', undefined, run), /wasm/);
  entries.set('../escape', 'x');
  assert.throws(() => validateArchive('/fixture.zip', '0.1.0', undefined, run), /rutas inválidas/);
});

test('detecta manifiesto anidado o ausente', () => {
  const { entries, run } = archiveFixture();
  entries.set('carpeta/manifest.json', entries.get('manifest.json'));
  entries.delete('manifest.json');
  assert.throws(() => validateArchive('/fixture.zip', '0.1.0', undefined, run), /en su raíz/);
});

test('exige que el ZIP coincida byte por byte con la salida compilada', t => {
  const { root } = fixture(t);
  const build = join(root, 'build');
  const { entries, run } = archiveFixture();
  for (const [name, content] of entries) {
    const path = join(build, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, content);
  }
  validateArchive('/fixture.zip', '0.1.0', build, run);
  writeFileSync(join(build, 'background.js'), 'otro build');
  assert.throws(() => validateArchive('/fixture.zip', '0.1.0', build, run), /difiere del build/);
  writeFileSync(join(build, 'extra.js'), 'residuo');
  assert.throws(() => validateArchive('/fixture.zip', '0.1.0', build, run), /archivos distintos/);
});

test('rechaza ZIP ausente, inesperado o selección ambigua antes de crear el bundle', t => {
  const { root } = fixture(t);
  const output = join(root, '.output');
  mkdirSync(output);
  const bundle = join(root, 'bundle');
  assert.throws(() => bundleRelease('v0.1.0', bundle, root), /Se esperaba únicamente/);
  writeFileSync(join(output, 'otro.zip'), 'residuo');
  assert.throws(() => bundleRelease('v0.1.0', bundle, root), /Se esperaba únicamente/);
  writeFileSync(join(output, zipName('0.1.0')), 'residuo');
  assert.throws(() => bundleRelease('v0.1.0', bundle, root), /Se esperaba únicamente/);
});

function publicationFixture(t, api) {
  const { root } = fixture(t);
  const { entries, run: unzip } = archiveFixture();
  // Artefacto controlado; unzip se sustituye para no requerir GitHub ni ZIPs reales.
  const bundle = join(root, 'bundle');
  mkdirSync(bundle);
  writeFileSync(join(bundle, zipName('0.1.0')), 'zip simulado');
  writeFileSync(join(bundle, 'notes.md'), '- Notas con `código` y $(texto) literal.\n');
  const calls = [];
  const run = (command, args, options) => {
    if (command === 'unzip') return unzip(command, args, options);
    assert.equal(command, 'gh');
    calls.push(args);
    return args[0] === 'api' ? api() : '';
  };
  return { bundle, calls, run, entries };
}

test('publica solo tras validación y consulta exitosa, pasando notas como archivo', t => {
  const { bundle, calls, run } = publicationFixture(t, () => 'v0.0.1\nv0.0.2\n');
  publishRelease('v0.1.0', bundle, 'owner/repo', run);
  assert.deepEqual(calls[0], ['api', '--paginate', 'repos/owner/repo/releases', '--jq', '.[].tag_name']);
  assert.deepEqual(calls[1], ['release', 'create', 'v0.1.0', join(bundle, zipName('0.1.0')), '--repo', 'owner/repo', '--verify-tag', '--title', 'Simi 0.1.0', '--notes-file', join(bundle, 'notes.md')]);
  assert.match(readFileSync(join(bundle, 'notes.md'), 'utf8'), /\$\(texto\)/);
});

test('una Release existente detiene el proceso sin mutaciones', t => {
  const { bundle, calls, run } = publicationFixture(t, () => 'v0.1.0\n');
  assert.throws(() => publishRelease('v0.1.0', bundle, 'owner/repo', run), /Ya existe/);
  assert.equal(calls.length, 1);
});

test('errores de red y permisos no se interpretan como ausencia de Release', t => {
  for (const message of ['HTTP 403', 'HTTP 404', 'HTTP 500', 'network failure']) {
    const { bundle, calls, run } = publicationFixture(t, () => { throw new Error(message); });
    assert.throws(() => publishRelease('v0.1.0', bundle, 'owner/repo', run), { message });
    assert.equal(calls.length, 1);
  }
});

test('metadatos, notas o manifiesto inválidos impiden cualquier llamada a GitHub', t => {
  const { bundle, calls, run, entries } = publicationFixture(t, () => '');
  assert.throws(() => publishRelease('v0.2.0', bundle, 'owner/repo', run), /artefacto/);
  entries.set('manifest.json', JSON.stringify({ version: '0.2.0', manifest_version: 3 }));
  assert.throws(() => publishRelease('v0.1.0', bundle, 'owner/repo', run), /manifiesto/);
  writeFileSync(join(bundle, 'notes.md'), ' ');
  assert.throws(() => publishRelease('v0.1.0', bundle, 'owner/repo', run), /artefacto/);
  assert.equal(calls.length, 0);
});
