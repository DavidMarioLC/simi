import { isNotebookMessage, matchesNotebook, notebookChannel, type Geometry, type NotebookSender, type NotebookReply } from './notebooks';

interface Registration { frame: HTMLIFrameElement; source: NotebookSender; token: string; revision: number; pagePath: string }

export class NotebookHost {
  private generation = 0;
  private registration?: Registration;
  private active = false;
  private actionTime = 0;
  constructor(private readonly callbacks: {
    enabled: () => boolean;
    close: () => void;
    select: (text: string, frame: HTMLIFrameElement, geometry: Geometry) => void;
    position: (geometry: Geometry) => void;
  }) {}

  invalidate() { ++this.generation; this.active = false; this.actionTime = Date.now(); }

  private findFrame(url: string) {
    if (!matchesNotebook(location.href, url)) return;
    return [...document.querySelectorAll('iframe')].find(frame => frame.src === url);
  }

  check() {
    if (this.registration && (this.registration.pagePath !== location.pathname || this.findFrame(this.registration.source.url) !== this.registration.frame)) {
      this.registration = undefined;
      this.callbacks.close();
    }
  }

  private receive = (value: unknown, sender: { id?: string }): NotebookReply | undefined => {
    if (!value || typeof value !== 'object') return;
    const envelope = value as { channel?: unknown; relay?: unknown; message?: unknown; source?: NotebookSender };
    if (sender.id !== browser.runtime.id || envelope.channel !== notebookChannel || envelope.relay !== true
      || !isNotebookMessage(envelope.message)) return;
    const m = envelope.message, source = envelope.source;
    if (!source || typeof source.url !== 'string' || !Number.isInteger(source.frameId) || source.frameId <= 0
      || typeof source.documentId !== 'string') return { accepted: false };
    const frame = this.findFrame(source.url);
    if (!frame || !this.callbacks.enabled()) return { accepted: false };
    if (m.kind === 'hello') {
      const old = this.registration;
      if (!old || old.frame !== frame || old.source.documentId !== source.documentId || old.token !== m.token) {
        if (this.active) this.callbacks.close();
        this.registration = { frame, source, token: m.token, revision: -1, pagePath: location.pathname };
      }
      return { accepted: true };
    }
    const registration = this.registration;
    if (!registration || registration.frame !== frame || registration.source.documentId !== source.documentId
      || registration.source.frameId !== source.frameId || registration.token !== m.token) return { accepted: false };
    if (m.kind === 'begin') {
      if (m.revision <= registration.revision || m.actionTime! < this.actionTime) return { accepted: false };
      this.callbacks.close();
      this.actionTime = m.actionTime!;
      registration.revision = m.revision;
      this.active = true;
      return { accepted: true, generation: this.generation };
    }
    if (!this.active || m.generation !== this.generation || m.revision < registration.revision) return { accepted: false };
    if (m.kind === 'close') this.callbacks.close();
    else if (m.revision !== registration.revision) return { accepted: false };
    else if (m.kind === 'selection') this.callbacks.select(m.text!, frame, m.geometry!);
    else this.callbacks.position(m.geometry!);
    return { accepted: true, generation: this.generation };
  };

  mount() {
    // Los mensajes de tabs.sendMessage se responden de forma asíncrona en Chrome.
    const listener = (value: unknown, sender: { id?: string }) => {
      const reply = this.receive(value, sender);
      if (reply) return Promise.resolve(reply);
    };
    browser.runtime.onMessage.addListener(listener);
    return () => { this.invalidate(); browser.runtime.onMessage.removeListener(listener); };
  }
}
