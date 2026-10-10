import { useLayoutEffect, useRef } from 'react';
import type { TranslationState } from '../lib/translation';
import { BrandIcon } from './BrandIcon';

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
  return <section ref={ref} id="simi-bubble" role="region" aria-label="Traducción al español" aria-description="Del inglés al español"
    className="pointer-events-auto fixed box-border grid w-max max-w-[min(320px,calc(100vw-16px))] grid-cols-[16px_minmax(0,1fr)_26px] items-start gap-[8px] rounded-[12px] border border-[#E5E5E5] bg-white p-[10px] font-sans text-[14px] leading-[20px] text-simi-ink shadow-[0_2px_8px_rgb(0_0_0/0.10)]">
    <BrandIcon className="mt-[5px] h-[16px] w-[16px] rounded-[4px]" />
    <div className="min-w-0 max-h-[min(320px,calc(var(--simi-bubble-max-height,100vh)-48px))] overflow-y-auto overscroll-contain [overflow-wrap:anywhere]">
      <div role="status" aria-live="polite" aria-atomic="true">
        {state.kind === 'translated'
          ? <p data-testid="translation-result" className="max-h-[min(320px,calc(var(--simi-bubble-max-height,100vh)-48px))] overflow-y-auto overscroll-contain whitespace-pre-wrap py-[1.5px] text-[15px] leading-[23px]">{state.text}</p>
          : <p className="whitespace-pre-wrap py-[3px] text-slate-600">{status}</p>}
      </div>
      {state.kind === 'downloading' && <progress aria-label="Descarga del modelo" value={state.progress} max={1} className="mt-[8px] block h-[5px] w-full accent-simi-brand" />}
      {(state.kind === 'activation-required' || state.kind === 'error' || (state.kind === 'unavailable' && state.retryable)) && <>
        <button onClick={state.kind === 'activation-required' ? activate : retry} className="mt-[8px] max-w-full cursor-pointer rounded-[8px] bg-simi-action px-[14px] py-[8px] text-[13px] font-medium text-white hover:bg-simi-action-hover active:bg-simi-action-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-simi-focus">
          {state.kind === 'activation-required' ? 'Activar traducción' : 'Reintentar'}
        </button>
        {state.kind === 'activation-required' && <p className="mt-[8px] text-[12px] leading-[17px] text-slate-400">La primera vez puede descargarse un modelo.</p>}
      </>}
    </div>
    <button aria-label="Cerrar traducción" onClick={close} className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-[6px] text-[18px] text-slate-400 hover:bg-simi-soft active:bg-simi-soft hover:text-simi-ink active:text-simi-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-simi-focus">×</button>
  </section>;
}
