import { notebookChannel, viewerUrl, type Geometry, type NotebookMessage, type NotebookReply } from '../lib/notebooks';

export default defineContentScript({
  matches: ['https://notebooks.githubusercontent.com/view/ipynb*'],
  allFrames: true,
  main(ctx) {
    if (window === window.top || window.parent !== window.top || !viewerUrl(location.href)) return;
    const token = crypto.randomUUID();
    let revision = 0;
    let dragging = false;
    let captured: { text: string; range: Range; revision: number; generation: number } | undefined;
    let ticket: Promise<NotebookReply> | undefined;
    let animation = 0;
    const send = (message: Omit<NotebookMessage, 'channel' | 'token'>): Promise<NotebookReply> =>
      browser.runtime.sendMessage({ ...message, channel: notebookChannel, token }).then(reply => reply ?? { accepted: false }).catch(() => ({ accepted: false }));
    const hello = () => send({ kind: 'hello', revision });
    void hello();
    const geometry = (range: Range): Geometry => ({ width: innerWidth, height: innerHeight,
      rects: [...range.getClientRects()].map(r => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })) });
    const begin = () => {
      captured = undefined;
      const current = ++revision;
      const actionTime = Date.now();
      // Enviar el inicio antes de esperar: incluso un clic sin selección cierra la burbuja.
      ticket = send({ kind: 'begin', revision: current, actionTime }).then(async reply => {
        if (reply.accepted || !ctx.isValid || current !== revision) return reply;
        const registered = await hello();
        return registered.accepted && ctx.isValid && current === revision
          ? send({ kind: 'begin', revision: current, actionTime }) : { accepted: false };
      });
    };
    const close = () => {
      const previous = captured;
      const pending = ticket;
      captured = undefined; ticket = undefined; ++revision;
      if (previous) void send({ kind: 'close', revision, generation: previous.generation });
      else if (pending) {
        const current = revision;
        void pending.then(reply => {
          if (ctx.isValid && current === revision && reply.accepted) return send({ kind: 'close', revision: current, generation: reply.generation });
        });
      }
    };
    const editable = (node: Node | null) => !!(node instanceof Element ? node : node?.parentElement)
      ?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
    const finish = async () => {
      dragging = false;
      const selection = getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount || editable(selection.anchorNode)
        || editable(selection.focusNode) || editable(document.activeElement) || !selection.toString().trim()) { close(); return; }
      const text = selection.toString(), range = selection.getRangeAt(0).cloneRange();
      if (captured?.text === text && captured.range.compareBoundaryPoints(Range.START_TO_START, range) === 0
        && captured.range.compareBoundaryPoints(Range.END_TO_END, range) === 0) return;
      if (!ticket) begin();
      const current = revision, pending = ticket!;
      ticket = undefined;
      const reply = await pending;
      if (!ctx.isValid || current !== revision || !reply.accepted || reply.generation == null) return;
      captured = { text, range, revision: current, generation: reply.generation };
      const result = await send({ kind: 'selection', revision: current, generation: reply.generation, text, geometry: geometry(range) });
      if (!result.accepted && captured?.revision === current) captured = undefined;
    };
    ctx.addEventListener(document, 'pointerdown', () => { dragging = true; begin(); }, true);
    ctx.addEventListener(document, 'pointerup', () => { void finish(); }, true);
    ctx.addEventListener(document, 'pointercancel', () => { dragging = false; close(); }, true);
    ctx.addEventListener(document, 'keydown', event => {
      const key = (event as KeyboardEvent).key;
      if (key === 'Escape') close();
      else if ((key === 'Shift' || key.startsWith('Arrow')) && !ticket) begin();
    }, true);
    ctx.addEventListener(document, 'keyup', event => {
      const key = (event as KeyboardEvent).key;
      if (key === 'Shift' || key.startsWith('Arrow')) void finish();
    }, true);
    ctx.addEventListener(document, 'selectionchange', () => {
      if (dragging || !captured) return;
      const selection = getSelection();
      if (!selection || selection.isCollapsed || selection.toString() !== captured.text) close();
    });
    const reposition = () => {
      if (animation) return;
      animation = ctx.requestAnimationFrame(() => {
        animation = 0;
        if (!captured) return;
        if (!captured.range.startContainer.isConnected || !captured.range.endContainer.isConnected) { close(); return; }
        void send({ kind: 'geometry', revision: captured.revision, generation: captured.generation, geometry: geometry(captured.range) });
      });
    };
    ctx.addEventListener(document, 'scroll', reposition, { capture: true, passive: true });
    ctx.addEventListener(window, 'resize', reposition);
    ctx.addEventListener(window, 'pagehide', close);
    const observer = new ResizeObserver(reposition);
    observer.observe(document.documentElement);
    const mutations = new MutationObserver(reposition);
    mutations.observe(document.body, { subtree: true, childList: true, characterData: true });
    ctx.onInvalidated(() => { observer.disconnect(); mutations.disconnect(); });
  },
});
