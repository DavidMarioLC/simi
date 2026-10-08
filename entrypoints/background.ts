import { isNotebookMessage, notebookChannel, viewerUrl } from '../lib/notebooks';
import { pdfChannel, remotePdfUrl } from '../lib/pdf-session';

export default defineBackground(() => {
  const destinations = new Map<string, { tabId: number; url: string; expires: number }>();
  const viewer = browser.runtime.getURL('/pdf.html');
  browser.tabs.onRemoved.addListener(tabId => {
    for (const [token, item] of destinations) if (item.tabId === tabId) destinations.delete(token);
  });
  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.channel !== pdfChannel || sender.id !== browser.runtime.id) return;
    return (async () => {
      for (const [token, item] of destinations) if (item.expires < Date.now()) destinations.delete(token);
      if (message.kind === 'open' && sender.url === browser.runtime.getURL('/popup.html')) {
        const url = remotePdfUrl(message.url);
        if (!url) return { error: 'La pestaña no contiene una dirección HTTP/HTTPS admitida.' };
        const token = crypto.randomUUID();
        // Crear inactiva, registrar destino y luego activar: evita que el handshake se adelante.
        const tab = await browser.tabs.create({ url: `${viewer}#${token}`, active: false });
        if (tab.id == null) return { error: 'No se pudo abrir el visor.' };
        destinations.set(token, { tabId: tab.id, url, expires: Date.now() + 60_000 });
        setTimeout(() => destinations.delete(token), 60_000);
        await browser.tabs.update(tab.id, { active: true });
        return { opened: true };
      }
      if (message.kind === 'consume' && sender.frameId === 0 && sender.url?.split('#')[0] === viewer) {
        const item = destinations.get(message.token);
        if (!item || item.tabId !== sender.tab?.id) return { pending: true };
        destinations.delete(message.token);
        return { url: item.url };
      }
    })();
  });
  // Relay sin almacenamiento: cada entrega se valida también en el documento principal.
  browser.runtime.onMessage.addListener((message, sender) => {
    if (!isNotebookMessage(message) || sender.id !== browser.runtime.id || !sender.tab?.id
      || !sender.frameId || !sender.documentId || !sender.url || !viewerUrl(sender.url)) return;
    return browser.tabs.sendMessage(sender.tab.id, {
      channel: notebookChannel, relay: true, message,
      source: { url: sender.url, frameId: sender.frameId, documentId: sender.documentId },
    }, { frameId: 0 }).catch(() => ({ accepted: false }));
  });
});
