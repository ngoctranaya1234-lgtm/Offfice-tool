// Run with the local server on port 4000: node scripts/smoke_browser.cjs
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtempSync, writeFileSync, existsSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const chrome = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome');
const urlArg = process.argv.find(value => value.startsWith('--url='));
const appUrl = (urlArg ? urlArg.slice(6) : 'http://127.0.0.1:4000').replace(/\/$/, '');
const profile = mkdtempSync(join(tmpdir(), 'offfice-smoke-'));
const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-extensions', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  let tabs;
  let port;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const portFile = join(profile, 'DevToolsActivePort');
      if (existsSync(portFile)) port = Number(readFileSync(portFile, 'utf8').split(/\r?\n/)[0]);
      if (port) { tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (tabs.some(tab => tab.type === 'page')) break; }
    } catch {}
    await pause(200);
  }
  const page = tabs?.find(tab => tab.type === 'page');
  assert.ok(page, 'Chrome debugging endpoint did not open');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  const exceptions = [];
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(`${message.params.exceptionDetails.text}: ${message.params.exceptionDetails.exception?.description || ''}`);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
  };
  function send(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(`${result.exceptionDetails.text}: ${result.result.description || ''}`);
    return result.result.value;
  }
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: `${appUrl}/#workspace` });
  await pause(2500);
  const status = await evaluate("document.getElementById('workspace-save-status').textContent");
  assert.equal(status, 'Tự lưu đã bật', `Workspace did not initialize: ${status}`);
  assert.equal(await evaluate("document.getElementById('view-workspace').classList.contains('active')"), true);
  await evaluate("window.switchTab('word'); const editor = document.getElementById('word-editor-body'); editor.innerHTML = '<p>Browser smoke draft</p>'; editor.dispatchEvent(new Event('input', { bubbles: true }));");
  await pause(1800);
  await evaluate("window.switchTab('workspace')");
  await pause(300);
  assert.equal(await evaluate("document.getElementById('workspace-draft-count').textContent"), '1');
  await send('Page.reload', { ignoreCache: true });
  await pause(2500);
  assert.equal(await evaluate("document.getElementById('word-editor-body').textContent.includes('Browser smoke draft')"), true, 'Draft did not recover after reload');
  await evaluate("window.switchTab('sheet'); window.sheetStudio.setCellValue(0, 0, '42'); window.switchTab('slides'); document.querySelector('#view-slides button[onclick*=addTextElement]').click();");
  await pause(1800);
  await send('Page.reload', { ignoreCache: true });
  await pause(2500);
  assert.equal(await evaluate('window.sheetStudio.data[0][0]'), 42, 'Sheet draft did not recover');
  assert.equal(await evaluate('window.slidesStudio.slides[0].elements.length'), 1, 'Slides draft did not recover');
  assert.equal(await evaluate("document.getElementById('workspace-draft-count').textContent"), '3');
  await evaluate("window.switchTab('sheet'); const sheetInput = document.getElementById('sheet-open-input'); Object.defineProperty(sheetInput, 'files', { configurable: true, value: [new File(['Name,Value\\nA,7'], 'sample.csv', { type: 'text/csv' })] }); sheetInput.dispatchEvent(new Event('change'));");
  await pause(1200);
  assert.equal(await evaluate('window.sheetStudio.data[0][0]'), 'Name', 'CSV import did not populate the sheet');
  assert.equal(await evaluate('window.sheetStudio.data[1][1]'), '7');
  await evaluate("window.switchTab('workspace')");
  await evaluate("document.dispatchEvent(new CustomEvent('workspace:conversion', { detail: { type: 'word-to-pdf', inputName: 'smoke.docx', filename: 'smoke.pdf', blob: new Blob(['PDF data'], {type:'application/pdf'}) } }))");
  await pause(500);
  assert.equal(await evaluate("document.getElementById('workspace-history-count').textContent"), '1');
  await evaluate("(async () => { window.switchTab('pdf'); await window.createBlankPdf(true); await window.downloadEditedPdf(); window.switchTab('workspace'); })()");
  await pause(500);
  assert.equal(await evaluate("document.getElementById('workspace-history-count').textContent"), '2', 'Edited PDF was not recorded');
  await evaluate("const search = document.getElementById('workspace-search'); search.value = 'absent'; search.dispatchEvent(new Event('input'));");
  await pause(300);
  assert.equal(await evaluate("document.getElementById('workspace-history').textContent.includes('Không tìm thấy')"), true);
  await evaluate("window.__qaBackup = null; const originalCreateObjectURL = URL.createObjectURL; URL.createObjectURL = function(blob) { if (blob.type === 'application/zip') window.__qaBackup = blob; return originalCreateObjectURL.call(this, blob); }; document.getElementById('workspace-export').click();");
  await pause(900);
  assert.equal(await evaluate('window.__qaBackup instanceof Blob && window.__qaBackup.size > 0'), true, 'Backup UI did not create a ZIP');
  await evaluate("new Promise(resolve => { const req = indexedDB.open('offfice-workspace', 1); req.onsuccess = () => { const tx = req.result.transaction('items', 'readwrite'); tx.objectStore('items').clear(); tx.oncomplete = resolve; }; })");
  await evaluate("window.confirm = () => true; const input = document.getElementById('workspace-import'); Object.defineProperty(input, 'files', { configurable: true, value: [new File([window.__qaBackup], 'backup.zip', { type: 'application/zip' })] }); input.dispatchEvent(new Event('change'));");
  await pause(1200);
  assert.equal(await evaluate("document.getElementById('workspace-draft-count').textContent"), '3', 'Backup did not restore drafts');
  assert.equal(await evaluate("document.getElementById('workspace-history-count').textContent"), '2', 'Backup did not restore outputs');
  if (process.argv.includes('--visual')) {
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await evaluate("document.getElementById('workspace-search').value = ''; document.getElementById('workspace-search').dispatchEvent(new Event('input'));");
    await pause(250);
    for (const tab of ['workspace', 'convert', 'pdf', 'word', 'sheet', 'slides']) {
      await evaluate(`window.switchTab('${tab}')`);
      await pause(250);
      const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      writeFileSync(join(tmpdir(), `offfice-${tab}-qa.png`), Buffer.from(screenshot.data, 'base64'));
    }
    await evaluate("window.switchTab('pdf'); window.openWatermarkModal()");
    await pause(200);
    let screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(join(tmpdir(), 'offfice-watermark-modal-qa.png'), Buffer.from(screenshot.data, 'base64'));
    await evaluate("document.getElementById('watermark-modal').classList.add('hidden'); window.openSignatureModal()");
    await pause(200);
    screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(join(tmpdir(), 'offfice-signature-modal-qa.png'), Buffer.from(screenshot.data, 'base64'));
    await evaluate("document.getElementById('signature-modal').classList.add('hidden')");
    for (const modal of ['whiteout-modal', 'merge-modal', 'split-modal', 'sheet-chart-modal']) {
      await evaluate(`document.getElementById('${modal}').classList.remove('hidden')`);
      await pause(150);
      screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      writeFileSync(join(tmpdir(), `offfice-${modal}-qa.png`), Buffer.from(screenshot.data, 'base64'));
      await evaluate(`document.getElementById('${modal}').classList.add('hidden')`);
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate("window.switchTab('workspace')");
    await pause(250);
    screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(join(tmpdir(), 'offfice-workspace-mobile-qa.png'), Buffer.from(screenshot.data, 'base64'));
  }
  assert.deepEqual(exceptions, []);
  console.log('Browser smoke passed: draft recovery, PDF history, search, ZIP backup/restore, no page exceptions.');
  ws.close();
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => browser.kill());
