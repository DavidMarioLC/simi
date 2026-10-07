import { createRoot } from 'react-dom/client';
import { TranslationBubble } from '../components/TranslationBubble';
import { TranslationController, type TranslationState } from '../lib/translation';
import '../assets/tailwind.css';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  allFrames: false,
  cssInjectionMode: 'ui',
  async main(ctx) {
    let enabled = (await browser.storage.local.get('enabled')).enabled !== false;
    let captured: { text: string; range: Range } | undefined;
    let element: HTMLElement | undefined;
    let dragging = false;
    let root: ReturnType<typeof createRoot>;
    let frame = 0;

    const close = () => {
      captured = undefined;
      element = undefined;
      controller.close();
    };
    const position = (panel: HTMLElement) => {
      element = panel;
      if (!captured || !captured.range.startContainer.isConnected || !captured.range.endContainer.isConnected) { close(); return; }
      const rect = [...captured.range.getClientRects()].find(r => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth);
      if (!rect) { close(); return; }
      const gap = 8;
      const size = panel.getBoundingClientRect();
      const x = Math.max(gap, Math.min(innerWidth - size.width - gap, rect.left + rect.width / 2 - size.width / 2));
      const above = rect.top - size.height - gap;
      const y = above >= gap ? above : Math.max(gap, Math.min(rect.bottom + gap, innerHeight - size.height - gap));
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      panel.dataset.placement = above >= gap ? 'above' : 'below';
    };
    const render = (state: TranslationState) => {
      if (!ctx.isValid || !root) return;
      root.render(<TranslationBubble state={state} activate={() => controller.activate()} retry={() => controller.retry()} close={close} position={position} />);
    };
    const controller = new TranslationController(() => typeof Translator === 'undefined' ? undefined : Translator, render);
    const ui = await createShadowRootUi(ctx, {
      name: 'simi-translator', position: 'inline', anchor: 'body',
      isolateEvents: true,
      onMount(container, _shadow, host) {
        for (const [key, value] of Object.entries({ position: 'fixed', top: '0', left: '0', width: '0', height: '0', 'z-index': '2147483647', 'pointer-events': 'none' })) host.style.setProperty(key, value, 'important');
        root = createRoot(container);
        render({ kind: 'hidden' });
        return root;
      },
      onRemove(mounted) { controller.dispose(); mounted?.unmount(); },
    });
    ui.mount();
    ui.shadowHost.dataset.ready = 'true';

    const insideUi = (event: Event) => event.composedPath().includes(ui.shadowHost);
    const editable = (node: Node | null) => {
      const element = node instanceof Element ? node : node?.parentElement;
      return !!element?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
    };
    const finishSelection = (event: Event) => {
      dragging = false;
      if (!enabled || !ctx.isValid || insideUi(event) || ui.shadow.activeElement) return;
      const selection = getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount || editable(selection.anchorNode) || editable(selection.focusNode) || editable(document.activeElement)) { close(); return; }
      const text = selection.toString();
      if (!text.trim()) { close(); return; }
      const range = selection.getRangeAt(0).cloneRange();
      if (captured?.text === text && captured.range.startContainer === range.startContainer && captured.range.startOffset === range.startOffset && captured.range.endContainer === range.endContainer && captured.range.endOffset === range.endOffset) return;
      captured = { text, range };
      void controller.request(text);
    };
    ctx.addEventListener(document, 'pointerdown', event => {
      if (insideUi(event)) {
        // Conservar selección al pulsar botones; la navegación por Tab sigue disponible.
        if (event.composedPath().some(n => n instanceof HTMLButtonElement)) event.preventDefault();
        return;
      }
      dragging = true;
      close();
    }, true);
    ctx.addEventListener(document, 'pointerup', finishSelection, true);
    ctx.addEventListener(document, 'pointercancel', () => { dragging = false; close(); }, true);
    ctx.addEventListener(document, 'keyup', event => {
      const key = (event as KeyboardEvent).key;
      if (key === 'Shift' || key.startsWith('Arrow')) finishSelection(event);
    }, true);
    ctx.addEventListener(document, 'keydown', event => {
      if ((event as KeyboardEvent).key === 'Escape') close();
    }, true);
    ctx.addEventListener(ui.shadow, 'keydown', event => {
      if ((event as KeyboardEvent).key === 'Escape') close();
    });
    ctx.addEventListener(document, 'selectionchange', () => {
      if (dragging || ui.shadow.activeElement || !captured) return;
      const selection = getSelection();
      if (!selection || selection.isCollapsed || selection.toString() !== captured.text) close();
    });
    const reposition = () => {
      if (frame) return;
      frame = ctx.requestAnimationFrame(() => { frame = 0; if (element && captured) position(element); });
    };
    ctx.addEventListener(document, 'scroll', event => { if (!insideUi(event)) reposition(); }, { capture: true, passive: true });
    ctx.addEventListener(window, 'resize', reposition);
    ctx.addEventListener(window, 'pagehide', event => { if (event.persisted) close(); else controller.dispose(); });
    let preferenceRevision = 0;
    const onPreference = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area !== 'local' || !changes.enabled) return;
      preferenceRevision++;
      enabled = changes.enabled.newValue !== false;
      close();
    };
    browser.storage.onChanged.addListener(onPreference);
    ctx.onInvalidated(() => browser.storage.onChanged.removeListener(onPreference));
    // Recuperar cambios que hayan ocurrido mientras se cargaban los estilos.
    const revision = preferenceRevision;
    const latest = await browser.storage.local.get('enabled');
    if (ctx.isValid && revision === preferenceRevision) {
      enabled = latest.enabled !== false;
      if (!enabled) close();
    }
  },
});
