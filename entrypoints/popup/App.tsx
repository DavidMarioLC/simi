import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { pdfChannel, remotePdfUrl } from '../../lib/pdf-session';

export function App() {
  const [enabled, setEnabled] = useState<boolean>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    browser.storage.local.get('enabled').then(value => { if (active) setEnabled(value.enabled !== false); }).catch(() => { if (active) setError('No se pudo leer la preferencia. Abre de nuevo el popup.'); });
    const changed = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area === 'local' && changes.enabled) setEnabled(changes.enabled.newValue !== false);
    };
    browser.storage.onChanged.addListener(changed);
    return () => { active = false; browser.storage.onChanged.removeListener(changed); };
  }, []);
  async function toggle() {
    if (enabled == null || saving) return;
    setSaving(true);
    setError('');
    try {
      await browser.storage.local.set({ enabled: !enabled });
      setEnabled(!enabled);
    } catch { setError('No se pudo guardar la preferencia. Reintenta.'); }
    finally { setSaving(false); }
  }
  async function openRemote() {
    setError('');
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const url = remotePdfUrl(tab?.url);
      if (!url) { setError('Abre una pestaña con un PDF de internet o utiliza «Abrir PDF local».'); return; }
      const reply = await browser.runtime.sendMessage({ channel: pdfChannel, kind: 'open', url });
      if (reply?.error) setError(reply.error);
    } catch { setError('No se pudo abrir el visor. Reintenta.'); }
  }
  return <main className="w-[300px] bg-slate-50 p-[24px] font-sans text-slate-900">
    <header className="mb-[24px] flex items-center gap-[12px]">
      <span aria-hidden="true" className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-indigo-600 text-[20px] font-semibold text-white">S</span>
      <div><h1 className="text-[22px] font-semibold">Simi</h1><p className="text-[12px] text-slate-500">Inglés → Español</p></div>
    </header>
    <div className="flex items-center justify-between gap-[12px] rounded-[12px] border border-slate-200 bg-white p-[14px]">
      <span className="text-[14px] font-medium">Traducción automática</span>
      <button type="button" role="switch" aria-label="Traducción automática" aria-checked={enabled === true} disabled={enabled == null || saving} onClick={toggle}
        className={`relative h-[24px] w-[42px] shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 ${enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-[left] ${enabled ? 'left-[21px]' : 'left-[3px]'}`} />
      </button>
    </div>
    <p className="mt-[16px] text-[13px] leading-[20px] text-slate-600">Selecciona una palabra, frase o párrafo en una página web. La traducción aparecerá junto al texto.</p>
    <p className="mt-[12px] text-[12px] leading-[18px] text-slate-400">Se traduce en tu dispositivo. La primera activación puede descargar un modelo.</p>
    <div className="mt-[16px] flex flex-col gap-[8px]">
      <button onClick={openRemote} className="rounded-[8px] bg-indigo-600 px-[14px] py-[9px] text-[13px] font-medium text-white">Abrir en Simi</button>
      <button onClick={() => { void browser.tabs.create({ url: browser.runtime.getURL('/pdf.html') }); }} className="rounded-[8px] border border-slate-200 bg-white px-[14px] py-[9px] text-[13px]">Abrir PDF local</button>
    </div>
    {error && <p role="alert" className="mt-[12px] text-[12px] text-red-700">{error}</p>}
  </main>;
}
