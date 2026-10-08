import { test, expect } from '@playwright/test';
import { TranslationController, type TranslationState, type TranslatorFactory } from '../lib/translation';

const tick = () => new Promise(r => setTimeout(r, 0));
function fixture(options: { availability?: Availability; createError?: boolean; translate?: (text: string) => Promise<string> } = {}) {
  const states: TranslationState[] = [];
  let creations = 0;
  let destroyed = 0;
  let monitor: EventTarget;
  const translator = { translate: options.translate ?? (async (text: string) => `ES:${text}`), destroy: () => { destroyed++; } } as Translator;
  const factory: TranslatorFactory = {
    availability: async () => options.availability ?? 'available',
    create: async options => {
      creations++;
      monitor = new EventTarget();
      options.monitor?.(monitor as CreateMonitor);
      if (optionsTest.createError) throw new Error('download failed');
      return translator;
    },
  };
  const optionsTest = options;
  const controller = new TranslationController(() => factory, state => states.push(state), () => false);
  return { controller, states, get creations() { return creations; }, get destroyed() { return destroyed; }, progress: () => {
    const event = new Event('downloadprogress');
    Object.assign(event, { loaded: 0.5 });
    monitor.dispatchEvent(event);
  } };
}

test('API ausente y par no disponible no crean un traductor', async () => {
  const states: TranslationState[] = [];
  await new TranslationController(() => undefined, state => states.push(state)).request('hello');
  expect(states.at(-1)?.kind).toBe('unavailable');
  const f = fixture({ availability: 'unavailable' });
  await f.controller.request('hello');
  expect(f.states.at(-1)?.kind).toBe('unavailable');
  expect(f.creations).toBe(0);
});

for (const availability of ['available', 'downloadable', 'downloading'] as const) {
  test(`activación y reutilización con recursos ${availability}`, async () => {
    const f = fixture({ availability });
    await f.controller.request('hello\nworld');
    expect(f.states.at(-1)?.kind).toBe('activation-required');
    f.controller.activate();
    f.controller.activate();
    f.progress();
    expect(f.states.at(-1)).toEqual({ kind: 'downloading', progress: 0.5 });
    await tick();
    expect(f.states.at(-1)).toEqual({ kind: 'translated', text: 'ES:hello\nworld' });
    await f.controller.request('morning');
    await tick();
    expect(f.states.at(-1)).toEqual({ kind: 'translated', text: 'ES:morning' });
    expect(f.creations).toBe(1);
    f.controller.dispose();
    expect(f.destroyed).toBe(1);
  });
}

test('fallo de descarga ofrece error sin reintentos automáticos', async () => {
  const f = fixture({ createError: true });
  await f.controller.request('hello');
  f.controller.activate();
  await tick();
  expect(f.states.at(-1)?.kind).toBe('error');
  expect(f.creations).toBe(1);
  f.controller.retry();
  await tick();
  expect(f.creations).toBe(2);
});

test('error de traducción permite reintento sin truncar la entrada', async () => {
  let tries = 0;
  const f = fixture({ translate: async text => {
    if (++tries === 1) throw new Error('quota');
    return text;
  } });
  const text = 'hello\nworld'.repeat(100);
  await f.controller.request(text);
  f.controller.activate();
  await tick();
  expect(f.states.at(-1)?.kind).toBe('error');
  f.controller.retry();
  await tick();
  expect(f.states.at(-1)).toEqual({ kind: 'translated', text });
});

test('una selección nueva reemplaza las pendientes y descarta resultados viejos', async () => {
  let complete!: (text: string) => void;
  const inputs: string[] = [];
  const f = fixture({ translate: text => {
    inputs.push(text);
    return new Promise(r => { complete = r; });
  } });
  await f.controller.request('A');
  f.controller.activate();
  await tick();
  await f.controller.request('B');
  await f.controller.request('C');
  complete('resultado A');
  await tick();
  expect(inputs).toEqual(['A', 'C']);
  expect(f.states.some(s => s.kind === 'translated' && s.text === 'resultado A')).toBe(false);
  f.controller.close();
  complete('resultado C');
  await tick();
  expect(f.states.at(-1)?.kind).toBe('hidden');
});

test('cerrar durante preparación no reabre la burbuja', async () => {
  const f = fixture();
  await f.controller.request('hello');
  f.controller.activate();
  f.controller.close();
  await tick();
  expect(f.states.at(-1)?.kind).toBe('hidden');
});

test('suspender libera el traductor y permite preparar uno al volver', async () => {
  const f = fixture();
  await f.controller.request('hello'); f.controller.activate(); await tick();
  f.controller.suspend();
  expect(f.destroyed).toBe(1);
  expect(f.states.at(-1)?.kind).toBe('hidden');
  await f.controller.request('morning');
  expect(f.states.at(-1)?.kind).toBe('activation-required');
  f.controller.activate(); await tick();
  expect(f.creations).toBe(2);
  expect(f.states.at(-1)).toEqual({ kind: 'translated', text: 'ES:morning' });
});

test('indisponibilidad temporal permite volver a comprobar sin crear a ciegas', async () => {
  const states: TranslationState[] = [];
  let availability: Availability = 'unavailable', creations = 0;
  const controller = new TranslationController(() => ({
    availability: async () => availability,
    create: async () => { creations++; return { translate: async (text: string) => `ES:${text}`, destroy() {} } as Translator; },
  }), state => states.push(state), () => true);
  await controller.request('hello');
  expect(states.at(-1)).toMatchObject({ kind: 'unavailable', retryable: true });
  controller.recheck(); await tick();
  expect(creations).toBe(0);
  availability = 'available'; controller.recheck(); await tick();
  expect(states.at(-1)).toEqual({ kind: 'translated', text: 'ES:hello' });
});

test('una preparación suspendida no ocupa recursos ni sustituye la nueva', async () => {
  const states: TranslationState[] = [], completions: ((translator: Translator) => void)[] = [];
  const signals: AbortSignal[] = [];
  let oldDestroyed = 0;
  const controller = new TranslationController(() => ({
    availability: async () => 'available',
    create: options => { signals.push(options.signal!); return new Promise<Translator>(r => completions.push(r)); },
  }), state => states.push(state), () => false);
  await controller.request('old'); controller.activate();
  controller.suspend();
  expect(signals[0]!.aborted).toBe(true);
  await controller.request('new'); controller.activate();
  completions[0]!({ translate: async () => 'old result', destroy() { oldDestroyed++; } } as unknown as Translator);
  await tick();
  expect(oldDestroyed).toBe(1);
  expect(states.at(-1)?.kind).toBe('preparing');
  completions[1]!({ translate: async () => 'new result', destroy() {} } as unknown as Translator);
  await tick();
  expect(states.at(-1)).toEqual({ kind: 'translated', text: 'new result' });
});
