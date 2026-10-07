export const notebookChannel = 'simi-notebook-v1';

export interface Rect { left: number; top: number; right: number; bottom: number }
export interface Geometry { rects: Rect[]; width: number; height: number }
export type NotebookMessage = {
  channel: typeof notebookChannel;
  kind: 'hello' | 'begin' | 'selection' | 'geometry' | 'close';
  token: string;
  revision: number;
  generation?: number;
  actionTime?: number;
  text?: string;
  geometry?: Geometry;
};
export interface NotebookSender { url: string; frameId: number; documentId: string }
export interface NotebookReply { accepted: boolean; generation?: number }

export function viewerUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    if (url.origin === 'https://notebooks.githubusercontent.com' && url.pathname === '/view/ipynb') return url;
  } catch { /* No admitir URLs inválidas. */ }
}

export function matchesNotebook(page: string, viewer: string): boolean {
  try {
    const top = new URL(page);
    const frame = viewerUrl(viewer);
    const path = decodeURIComponent(top.pathname);
    const match = path.match(/^\/([^/]+)\/([^/]+)\/blob\/(.+\.ipynb)$/i);
    if (top.origin !== 'https://github.com' || !match || !frame) return false;
    const notebookPath = frame.searchParams.get('path');
    return frame.searchParams.get('nwo') === `${match[1]}/${match[2]}`
      && !!notebookPath && notebookPath.toLowerCase().endsWith('.ipynb')
      && match[3]!.endsWith(`/${notebookPath}`);
  } catch { return false; }
}

export function isGeometry(value: unknown): value is Geometry {
  if (!value || typeof value !== 'object') return false;
  const g = value as Geometry;
  return Number.isFinite(g.width) && g.width > 0 && Number.isFinite(g.height) && g.height > 0
    && Array.isArray(g.rects) && g.rects.every(r => r && ['left', 'top', 'right', 'bottom'].every(k => Number.isFinite(r[k as keyof Rect])) && r.right >= r.left && r.bottom >= r.top);
}

export function isNotebookMessage(value: unknown): value is NotebookMessage {
  if (!value || typeof value !== 'object') return false;
  const m = value as NotebookMessage;
  if (m.channel !== notebookChannel || typeof m.token !== 'string' || !m.token || m.token.length > 100
    || !Number.isSafeInteger(m.revision) || m.revision < 0) return false;
  if (m.kind === 'hello') return true;
  if (m.kind === 'begin') return Number.isSafeInteger(m.actionTime) && m.actionTime! > 0;
  if (!Number.isSafeInteger(m.generation) || m.generation! < 0) return false;
  if (m.kind === 'close') return true;
  if (!isGeometry(m.geometry)) return false;
  return m.kind === 'geometry' || (m.kind === 'selection' && typeof m.text === 'string' && !!m.text.trim());
}

export function intersect(a: Rect, b: Rect): Rect | undefined {
  const r = { left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) };
  if (r.right > r.left && r.bottom > r.top) return r;
}

/** Coordenadas del contenido del visor, recortadas por el frame y sus ancestros. */
export function notebookRect(frame: HTMLIFrameElement, geometry: Geometry): Rect | undefined {
  if (!frame.isConnected || !frame.offsetWidth || !frame.offsetHeight) return;
  const box = frame.getBoundingClientRect();
  const sx = box.width / frame.offsetWidth, sy = box.height / frame.offsetHeight;
  const left = box.left + frame.clientLeft * sx, top = box.top + frame.clientTop * sy;
  let clip = intersect({ left, top, right: left + frame.clientWidth * sx, bottom: top + frame.clientHeight * sy },
    { left: 0, top: 0, right: innerWidth, bottom: innerHeight });
  for (let el: Element | null = frame; el && clip; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (style.visibility !== 'visible' || style.display === 'none') return;
    if (el === frame) continue;
    const b = el.getBoundingClientRect();
    const x = /hidden|clip|scroll|auto/.test(style.overflowX);
    const y = /hidden|clip|scroll|auto/.test(style.overflowY);
    clip = intersect(clip, { left: x ? b.left : clip.left, right: x ? b.right : clip.right, top: y ? b.top : clip.top, bottom: y ? b.bottom : clip.bottom });
  }
  if (!clip) return;
  const viewport = { left: 0, top: 0, right: geometry.width, bottom: geometry.height };
  for (const rect of geometry.rects) {
    const local = intersect(rect, viewport);
    if (!local) continue;
    const visible = intersect({ left: left + local.left * sx, right: left + local.right * sx, top: top + local.top * sy, bottom: top + local.bottom * sy }, clip);
    if (visible) return visible;
  }
}
