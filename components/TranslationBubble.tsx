import { useLayoutEffect, useRef } from 'react';
import type { TranslationState } from '../lib/translation';

interface Props {
  state: TranslationState;
  activate: () => void;
  retry: () => void;
  close: () => void;
  position: (element: HTMLElement) => void;
}

const messages = {
  checking: 'Comprobando traducción…',
  'activation-required': 'Activa la traducción local para este documento.',
  preparing: 'Preparando traducción…',
  translating: 'Traduciendo…',
};

export function TranslationBubble({ state, activate, retry, close, position }: Props) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    position(ref.current);
    const observer = new ResizeObserver(() => ref.current && position(ref.current));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [state, position]);
  if (state.kind === 'hidden') return null;
  const status = state.kind === 'translated' ? 'Traducción lista'
    : state.kind === 'error' || state.kind === 'unavailable' ? state.message
    : state.kind === 'downloading' ? `Descargando modelo…${state.progress == null ? '' : ` ${Math.round(state.progress * 100)}%`}`
    : messages[state.kind];
  return <section ref={ref} id="simi-bubble" role="region" aria-label="Traducción al español"
    className="pointer-events-auto fixed box-border w-[320px] max-w-[calc(100vw-16px)] rounded-[16px] border border-slate-200 bg-white p-[16px] font-sans text-[14px] leading-[20px] text-slate-900 shadow-xl">
    <header className="mb-[10px] flex items-center justify-between gap-[12px]">
      <div className="flex items-center gap-[8px]">
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-indigo-50 text-[12px] font-bold text-indigo-600" aria-hidden="true">S</span>
        <span className="text-[12px] font-semibold tracking-wide text-slate-500">INGLÉS <span aria-hidden="true">→</span> ESPAÑOL</span>
      </div>
      <button aria-label="Cerrar traducción" onClick={close} className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-[6px] text-[20px] text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-600">×</button>
    </header>
    <div role="status" aria-live="polite" aria-atomic="true">
      {state.kind === 'translated'
        ? <p data-testid="translation-result" className="max-h-[min(320px,calc(100vh-96px))] overflow-y-auto overscroll-contain whitespace-pre-wrap break-words text-[15px] leading-[23px]">{state.text}</p>
        : <p className="text-slate-600">{status}</p>}
    </div>
    {state.kind === 'downloading' && <progress aria-label="Descarga del modelo" value={state.progress} max={1} className="mt-[12px] h-[5px] w-full accent-indigo-600" />}
    {(state.kind === 'activation-required' || state.kind === 'error') && <>
      <button onClick={state.kind === 'error' ? retry : activate} className="mt-[12px] cursor-pointer rounded-[8px] bg-indigo-600 px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        {state.kind === 'error' ? 'Reintentar' : 'Activar traducción'}
      </button>
      {state.kind === 'activation-required' && <p className="mt-[8px] text-[12px] leading-[17px] text-slate-400">La primera vez puede descargarse un modelo.</p>}
    </>}
  </section>;
}
