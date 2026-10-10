import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { TranslationBubble } from '../components/TranslationBubble';
import { TranslationController } from './translation';
import { positionBubble } from './selection-geometry';

export function mountPdfSelection(container: HTMLElement, host: HTMLElement) {
  const root = createRoot(host);
  let enabled = false, preferenceRevision = 0, dragging = false, frame = 0;
  let captured: { text: string; range: Range } | undefined;
  let panel: HTMLElement | undefined;
  let controller: TranslationController;
  const close = () => { captured = undefined; panel = undefined; controller.close(); };
  const position = (element: HTMLElement) => {
    panel = element;
    const range = captured?.range;
    if (!range?.startContainer.isConnected || !range.endContainer.isConnected) { close(); return; }
    const bounds = container.getBoundingClientRect();
    if (bounds.height <= 16) { close(); return; }
    element.style.setProperty('--simi-bubble-max-height', `${bounds.height}px`);
    element.style.maxHeight = `${bounds.height - 16}px`;
    element.style.overflowY = 'auto';
    const rect = [...range.getClientRects()].find(r => r.width > 0 && r.height > 0 && r.bottom > bounds.top && r.top < bounds.bottom && r.right > bounds.left && r.left < bounds.right);
    if (!rect) { close(); return; }
    positionBubble(element, { left: Math.max(rect.left, bounds.left), right: Math.min(rect.right, bounds.right), top: Math.max(rect.top, bounds.top), bottom: Math.min(rect.bottom, bounds.bottom) }, bounds);
  };
  const reset = () => {
    controller?.dispose(); captured = undefined; panel = undefined;
    controller = new TranslationController(() => typeof Translator === 'undefined' ? undefined : Translator,
      state => root.render(<TranslationBubble state={state} position={position} close={close} activate={() => controller.activate()} retry={() => state.kind === 'unavailable' ? controller.recheck() : controller.retry()} />));
  };
  reset();
  const abort = new AbortController();
  let tab: { id?: number; windowId: number } | undefined;
  const deactivate = () => { close(); controller.suspend(); };
  const activated = (active: { tabId: number; windowId: number }) => {
    if (tab && active.windowId === tab.windowId && active.tabId !== tab.id) deactivate();
  };
  // Las páginas de extensión pueden seguir indicando visibilityState=visible
  // en una pestaña inactiva; el evento de Chrome identifica el cambio real.
  browser.tabs.onActivated.addListener(activated);
  void browser.tabs.getCurrent().then(current => {
    if (abort.signal.aborted || !current) return;
    tab = current;
    if (!current.active) deactivate();
  });
  const listen = (target: EventTarget, name: string, fn: EventListener, capture = false) => target.addEventListener(name, fn, { capture, signal: abort.signal });
  const textLayer = (node: Node | null) => (node instanceof Element ? node : node?.parentElement)?.closest('.textLayer');
  const inside = (event: Event) => host.contains(event.target as Node);
  const finish = (event: Event) => {
    dragging = false;
    if (!enabled || inside(event) || host.contains(document.activeElement)) return;
    const selection = getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount || !textLayer(selection.anchorNode) || !textLayer(selection.focusNode)
      || !container.contains(selection.anchorNode) || !container.contains(selection.focusNode) || !selection.toString().trim()) { close(); return; }
    const range = selection.getRangeAt(0).cloneRange(), text = selection.toString();
    if (captured?.text === text && range.compareBoundaryPoints(Range.START_TO_START, captured.range) === 0 && range.compareBoundaryPoints(Range.END_TO_END, captured.range) === 0) return;
    captured = { text, range };
    void controller.request(text);
  };
  listen(document, 'pointerdown', event => {
    if (inside(event)) { if ((event.target as Element).closest('button')) event.preventDefault(); return; }
    dragging = true; close();
  }, true);
  listen(document, 'pointerup', finish, true);
  listen(document, 'pointercancel', () => { dragging = false; close(); }, true);
  listen(document, 'keydown', event => { if ((event as KeyboardEvent).key === 'Escape') close(); }, true);
  listen(document, 'visibilitychange', () => { if (document.hidden) deactivate(); });
  listen(document, 'keyup', event => { const key = (event as KeyboardEvent).key; if (key === 'Shift' || key.startsWith('Arrow')) finish(event); }, true);
  listen(document, 'selectionchange', () => {
    if (dragging || host.contains(document.activeElement) || !captured) return;
    const selection = getSelection();
    if (!selection || selection.isCollapsed || selection.toString() !== captured.text) close();
  });
  const reposition = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; if (panel && captured) position(panel); });
  };
  listen(container, 'scroll', reposition, true);
  listen(window, 'resize', reposition);
  const mutations = new MutationObserver(reposition);
  mutations.observe(container, { subtree: true, childList: true });
  const preference = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area !== 'local' || !changes.enabled) return;
    preferenceRevision++; enabled = changes.enabled.newValue !== false; close();
    if (!enabled) controller.suspend();
  };
  browser.storage.onChanged.addListener(preference);
  const revision = preferenceRevision;
  void browser.storage.local.get('enabled').then(value => { if (!abort.signal.aborted && revision === preferenceRevision) enabled = value.enabled !== false; });
  return {
    reset,
    close,
    dispose() { abort.abort(); browser.tabs.onActivated.removeListener(activated); mutations.disconnect(); cancelAnimationFrame(frame); browser.storage.onChanged.removeListener(preference); controller.dispose(); root.unmount(); },
  };
}
