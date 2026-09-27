const { test } = require('node:test');
const assert = require('node:assert/strict');
const JSZip = require('../libs/jszip.min.js');
const { WorkspaceStore, normalizeDraft, cleanName } = require('../src/engine/workspace-store.js');
globalThis.JSZip = JSZip;

class MemoryStore extends WorkspaceStore {
  constructor() { super(null); this.items = new Map(); }
  async all() { return [...this.items.values()]; }
  async put(item) { this.items.set(item.id, item); }
  async remove(id) { this.items.delete(id); }
  async open() {
    return { transaction: () => {
      const transaction = { objectStore: () => ({ put: item => {
        this.items.set(item.id, item);
        queueMicrotask(() => transaction.oncomplete?.());
      } }) };
      return transaction;
    } };
  }
}

test('validates drafts and strips unsafe restored styles', () => {
  const sheet = normalizeDraft('sheet', { rows: 1, cols: 1, data: [['=SUM(A1:A2)']], styles: { '0_0': { color: 'red;position:absolute', bg: 'rgba(255, 255, 255, 0.08)', bold: true } } });
  assert.equal(sheet.styles['0_0'].color, '');
  assert.equal(sheet.styles['0_0'].bg, 'rgba(255, 255, 255, 0.08)');
  assert.equal(sheet.data[0][0], '=SUM(A1:A2)');
  assert.throws(() => normalizeDraft('sheet', { rows: 2, cols: 1, data: [['x']] }), /Cấu trúc/);
  assert.throws(() => normalizeDraft('slides', { slides: [{ elements: [{ type: 'image', src: 'javascript:alert(1)' }] }] }), /Ảnh slide/);
  assert.equal(cleanName('../evil.pdf'), '.._evil.pdf');
});

test('retains latest 30 outputs and round-trips drafts and binary results through backup', async () => {
  const store = new MemoryStore();
  await store.saveDraft('word', { html: '<p>Chào bạn</p>' });
  for (let index = 0; index < 31; index++) {
    await store.addConversion('word-to-pdf', `input-${index}.docx`, `out-${index}.pdf`, new Blob([`pdf-${index}`], { type: 'application/pdf' }));
  }
  assert.equal((await store.all()).filter(item => item.kind === 'history').length, 30);
  const zip = await store.exportBackup();
  const second = new MemoryStore();
  assert.equal(await second.importBackup(zip), 31);
  const imported = await second.all();
  assert.equal(imported.find(item => item.id === 'draft:word').data.html, '<p>Chào bạn</p>');
  assert.equal(await imported.find(item => item.filename === 'out-30.pdf').blob.text(), 'pdf-30');
});

test('rejects malformed backup without writing records', async () => {
  const zip = new JSZip();
  zip.file('workspace.json', JSON.stringify({ format: 'offfice-workspace', version: 1, records: [{ id: 'draft:slides', kind: 'draft', studio: 'slides', data: { slides: [{ elements: [{ type: 'image', src: 'https://evil.example/x' }] }] } }] }));
  const store = new MemoryStore();
  await assert.rejects(store.importBackup(new Blob([await zip.generateAsync({ type: 'uint8array' })])), /Ảnh slide/);
  assert.equal((await store.all()).length, 0);
});
