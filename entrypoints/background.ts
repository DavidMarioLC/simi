import { isNotebookMessage, notebookChannel, viewerUrl } from '../lib/notebooks';

export default defineBackground(() => {
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
