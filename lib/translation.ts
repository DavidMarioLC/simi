export type TranslationState =
  | { kind: 'hidden' | 'checking' | 'activation-required' | 'preparing' | 'translating' }
  | { kind: 'downloading'; progress?: number }
  | { kind: 'translated'; text: string }
  | { kind: 'unavailable' | 'error'; message: string; retryable?: boolean };

export type TranslatorFactory = Pick<typeof Translator, 'create' | 'availability'>;
const languages = { sourceLanguage: 'en', targetLanguage: 'es' };

export class TranslationController {
  private translator?: Translator;
  private preparing?: Promise<void>;
  private current?: { id: number; text: string };
  private generation = 0;
  private running = false;
  private disposed = false;
  private lifecycle = 0;
  private preparationAbort?: AbortController;
  private preparationState: TranslationState = { kind: 'preparing' };

  constructor(
    private readonly getFactory: () => TranslatorFactory | undefined,
    private readonly emit: (state: TranslationState) => void,
    private readonly hasActivation = () => navigator.userActivation.isActive,
  ) {}

  private get factory() { return this.getFactory(); }

  async request(text: string) {
    if (this.disposed) return;
    const request = { id: ++this.generation, text };
    this.current = request;
    if (this.translator) {
      this.show({ kind: 'translating' });
      void this.pump();
      return;
    }
    if (this.preparing) {
      this.show(this.preparationState);
      return;
    }
    if (!this.factory) {
      this.show({ kind: 'unavailable', message: 'La traducción nativa no está disponible en este navegador o página.' });
      return;
    }
    this.show({ kind: 'checking' });
    try {
      const availability = await this.factory.availability(languages);
      if (this.current !== request || this.disposed) return;
      if (availability === 'unavailable') {
        this.show({ kind: 'unavailable', retryable: true, message: 'Chrome no tiene disponible el traductor local de inglés a español. Cierra otras pestañas donde hayas usado Simi y reintenta. Si persiste, reinicia Chrome.' });
      } else if (this.hasActivation()) {
        this.activate();
      } else {
        this.show({ kind: 'activation-required' });
      }
    } catch {
      if (this.current === request) this.show({ kind: 'error', message: 'No se pudo comprobar la traducción. Puedes reintentar.' });
    }
  }

  // Se llama directamente desde el clic: no esperar otras operaciones antes de create().
  activate() {
    if (this.disposed || !this.current || !this.factory || this.preparing) return;
    if (this.translator) { void this.request(this.current.text); return; }
    this.preparationState = { kind: 'preparing' };
    this.show(this.preparationState);
    const lifecycle = this.lifecycle;
    const abort = new AbortController();
    this.preparationAbort = abort;
    try {
      const creation = this.factory.create({
        ...languages,
        signal: abort.signal,
        monitor: monitor => monitor.addEventListener('downloadprogress', event => {
          if (lifecycle !== this.lifecycle || this.disposed) return;
          this.preparationState = { kind: 'downloading', progress: Math.max(0, Math.min(1, event.loaded)) };
          this.show(this.preparationState);
        }),
      });
      const preparation = creation.then(translator => {
        if (this.disposed || lifecycle !== this.lifecycle) { translator.destroy(); return; }
        this.translator = translator;
      }).catch(() => {
        if (lifecycle === this.lifecycle) this.show({ kind: 'error', message: 'No se pudo preparar la traducción. Comprueba tu conexión y reintenta.' });
      }).finally(() => {
        if (this.preparing !== preparation) return;
        this.preparing = undefined;
        this.preparationAbort = undefined;
        if (this.translator && !this.disposed) void this.pump();
      });
      this.preparing = preparation;
    } catch {
      this.show({ kind: 'error', message: 'No se pudo preparar la traducción. Puedes reintentar.' });
    }
  }

  retry() {
    if (!this.current) return;
    if (this.translator) void this.request(this.current.text);
    else this.activate();
  }

  recheck() { if (this.current) void this.request(this.current.text); }

  close() {
    this.current = undefined;
    ++this.generation;
    if (!this.disposed) this.emit({ kind: 'hidden' });
  }

  suspend() {
    this.close();
    ++this.lifecycle;
    this.preparationAbort?.abort();
    this.preparationAbort = undefined;
    this.preparing = undefined;
    this.translator?.destroy();
    this.translator = undefined;
  }

  dispose() {
    this.suspend();
    this.disposed = true;
  }

  private show(state: TranslationState) {
    if (!this.disposed && this.current) this.emit(state);
  }

  private async pump() {
    if (this.running || !this.translator || this.disposed) return;
    this.running = true;
    try {
      while (this.current && this.translator && !this.disposed) {
        const request = this.current;
        const translator: Translator = this.translator;
        this.show({ kind: 'translating' });
        try {
          const result = await translator.translate(request.text);
          if (this.current === request) this.show({ kind: 'translated', text: result });
        } catch (error) {
          if (this.current === request) this.show({ kind: 'error', message: 'No se pudo traducir este texto. Reintenta o selecciona un fragmento más corto.' });
          if (error instanceof Error && error.name === 'InvalidStateError' && this.translator === translator) {
            this.translator?.destroy();
            this.translator = undefined;
            if (this.current && this.current !== request) this.show({ kind: 'activation-required' });
          }
        }
        if (this.current === request) break;
      }
    } finally {
      this.running = false;
    }
  }
}
