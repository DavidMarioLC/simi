export function positionBubble(panel: HTMLElement, rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>,
  bounds = { left: 0, top: 0, right: innerWidth, bottom: innerHeight }) {
  const gap = 8;
  const size = panel.getBoundingClientRect();
  const x = Math.max(bounds.left + gap, Math.min(bounds.right - size.width - gap, (rect.left + rect.right) / 2 - size.width / 2));
  const above = rect.top - size.height - gap;
  const fitsAbove = above >= bounds.top + gap;
  const y = fitsAbove ? above : Math.max(bounds.top + gap, Math.min(rect.bottom + gap, bounds.bottom - size.height - gap));
  panel.style.left = `${x}px`;
  panel.style.top = `${y}px`;
  panel.dataset.placement = fitsAbove ? 'above' : 'below';
}
