import { test, expect } from '@playwright/test';
import { isNotebookMessage, matchesNotebook, notebookChannel, viewerUrl } from '../lib/notebooks';

const page = 'https://github.com/bokeh/bokeh-notebooks/blob/main/tutorial/06%20-%20Linking%20and%20Interactions.ipynb';
const viewer = 'https://notebooks.githubusercontent.com/view/ipynb?nwo=bokeh%2Fbokeh-notebooks&path=tutorial%2F06+-+Linking+and+Interactions.ipynb#viewer';

test('solo relaciona el visor de un notebook con su repositorio y ruta activa', () => {
  expect(matchesNotebook(page, viewer)).toBe(true);
  expect(matchesNotebook(page.replace('/main/', '/feature/notebooks/'), viewer)).toBe(true);
  for (const [top, frame] of [
    ['https://example.com/blob/main/example.ipynb', viewer],
    [viewer, viewer], [page.replace('.ipynb', '.md'), viewer],
    [page, viewer.replace('bokeh%2Fbokeh-notebooks', 'other%2Frepo')],
    [page, viewer.replace('06+-+', '07+-+')],
    [page, viewer.replace('/view/ipynb?', '/view/ipynb-other?')],
    [page, viewer.replace('notebooks.githubusercontent.com', 'notebooks.githubusercontent.com.evil.test')],
    [page, viewer.replace('https:', 'http:')], [page, 'invalid'],
  ]) expect(matchesNotebook(top!, frame!)).toBe(false);
  expect(viewerUrl(viewer)?.hostname).toBe('notebooks.githubusercontent.com');
});

test('el protocolo rechaza tipos, generaciones y geometría inválidos', () => {
  const selection = { channel: notebookChannel, kind: 'selection', token: 'document', revision: 1, generation: 2,
    text: 'Hello', geometry: { width: 800, height: 600, rects: [{ left: 10, top: 20, right: 100, bottom: 40 }] } };
  expect(isNotebookMessage(selection)).toBe(true);
  for (const change of [{ kind: 'unknown' }, { text: ' ' }, { generation: -1 }, { revision: NaN }, { token: '' },
    { geometry: { width: 0, height: 100, rects: [] } },
    { geometry: { width: 100, height: 100, rects: [{ left: 0, top: 0, right: Infinity, bottom: 20 }] } }]) {
    expect(isNotebookMessage({ ...selection, ...change })).toBe(false);
  }
});
