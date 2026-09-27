// Local, private workspace. Files stay in this browser unless the user exports a backup.
(function (root) {
  const KINDS = ['word', 'sheet', 'slides'];
  const TYPES = ['word-to-pdf', 'pdf-to-word', 'pdf-to-excel', 'excel-to-pdf', 'img-to-pdf', 'pdf-to-img', 'compress-pdf', 'pdf-edited'];
  const MAX_RESULT = 20 * 1024 * 1024;
  const MAX_TOTAL = 100 * 1024 * 1024;

  function fail(message) { throw new Error(message); }
  function cleanName(value) {
    return String(value || 'Tài liệu').replace(/[\\/\x00-\x1f<>:"|?*]/g, '_').trim().slice(0, 120) || 'Tài liệu';
  }
  function safeColor(value, fallback) {
    return typeof value === 'string' && (/^#[\da-f]{3,8}$/i.test(value) || /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0?\.\d+|1))?\s*\)$/i.test(value)) ? value : fallback;
  }
  function finite(value, fallback, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  }
  function normalizeDraft(kind, data) {
    if (!KINDS.includes(kind) || !data || typeof data !== 'object') fail('Bản nháp không hợp lệ.');
    if (kind === 'word') {
      if (typeof data.html !== 'string' || data.html.length > 1500000) fail('Văn bản vượt giới hạn lưu cục bộ.');
      return { html: data.html };
    }
    if (kind === 'sheet') {
      const rows = Number(data.rows), cols = Number(data.cols);
      if (!Number.isInteger(rows) || rows < 1 || rows > 500 || !Number.isInteger(cols) || cols < 1 || cols > 100 || !Array.isArray(data.data) || data.data.length !== rows) fail('Cấu trúc bảng tính không hợp lệ.');
      const cells = data.data.map(row => {
        if (!Array.isArray(row) || row.length > cols) fail('Dòng bảng tính không hợp lệ.');
        return row.map(cell => {
          if (typeof cell !== 'string' && typeof cell !== 'number') fail('Giá trị ô không hợp lệ.');
          if (String(cell).length > 2000 || !Number.isFinite(Number(cell)) && typeof cell === 'number') fail('Giá trị ô quá dài.');
          return cell;
        });
      });
      const styles = {};
      for (const [key, style] of Object.entries(data.styles || {})) {
        if (!/^\d+_\d+$/.test(key) || !style || typeof style !== 'object') continue;
        const [r, c] = key.split('_').map(Number);
        if (r >= rows || c >= cols) continue;
        styles[key] = {
          bold: style.bold === true,
          italic: style.italic === true,
          color: safeColor(style.color, ''),
          bg: safeColor(style.bg, ''),
          align: ['left', 'center', 'right'].includes(style.align) ? style.align : ''
        };
      }
      return { rows, cols, data: cells, styles };
    }
    if (!Array.isArray(data.slides) || data.slides.length < 1 || data.slides.length > 100) fail('Số slide không hợp lệ.');
    const slides = data.slides.map((slide, index) => {
      if (!slide || !Array.isArray(slide.elements) || slide.elements.length > 100) fail('Nội dung slide không hợp lệ.');
      return {
        id: `restored_${index}`,
        theme: 'custom',
        bg: safeColor(slide.bg, '#0f172a'),
        elements: slide.elements.map(element => {
          if (!element || !['text', 'heading', 'badge', 'image'].includes(element.type)) fail('Đối tượng slide không hợp lệ.');
          const common = { type: element.type, x: finite(element.x, 60, 0, 1200), y: finite(element.y, 60, 0, 680) };
          if (element.type === 'image') {
            if (typeof element.src !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(element.src) || element.src.length > 7000000) fail('Ảnh slide không hợp lệ.');
            return { ...common, src: element.src, width: finite(element.width, 240, 1, 1200) };
          }
          if (typeof element.text !== 'string' || element.text.length > 10000) fail('Văn bản slide không hợp lệ.');
          return { ...common, text: element.text, size: finite(element.size, 18, 8, 96), color: safeColor(element.color, '#f8fafc'), bg: safeColor(element.bg, '#164e63'), bold: element.bold === true };
        })
      };
    });
    const result = { slides, currentSlideIndex: Math.round(finite(data.currentSlideIndex, 0, 0, slides.length - 1)) };
    if (JSON.stringify(result).length > 20 * 1024 * 1024) fail('Bài trình chiếu vượt giới hạn lưu cục bộ 20 MB.');
    return result;
  }

  function requestDone(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Không thể truy cập bộ nhớ trình duyệt.'));
    });
  }

  function excessHistory(history) {
    let count = 0, total = 0;
    return history.filter(entry => {
      if (count >= 30 || total + entry.size > MAX_TOTAL) return true;
      count++;
      total += entry.size;
      return false;
    });
  }

  class WorkspaceStore {
    constructor(indexedDb = root.indexedDB) { this.indexedDb = indexedDb; this.dbPromise = null; }
    open() {
      if (!this.indexedDb) return Promise.reject(new Error('Trình duyệt không hỗ trợ lưu cục bộ.'));
      if (!this.dbPromise) {
        this.dbPromise = new Promise((resolve, reject) => {
          const request = this.indexedDb.open('offfice-workspace', 1);
          request.onupgradeneeded = () => request.result.createObjectStore('items', { keyPath: 'id' });
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error || new Error('Không thể mở không gian làm việc.'));
          request.onblocked = () => reject(new Error('Hãy đóng các tab ứng dụng khác rồi thử lại.'));
        }).catch(error => { this.dbPromise = null; throw error; });
      }
      return this.dbPromise;
    }
    async get(id) { const db = await this.open(); return requestDone(db.transaction('items').objectStore('items').get(id)); }
    async all() { const db = await this.open(); return requestDone(db.transaction('items').objectStore('items').getAll()); }
    async write(method, value) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('items', 'readwrite');
        transaction.objectStore('items')[method](value);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error('Không thể ghi dữ liệu.'));
        transaction.onabort = () => reject(transaction.error || new Error('Không thể hoàn tất ghi dữ liệu.'));
      });
    }
    async put(item) { return this.write('put', item); }
    async remove(id) { return this.write('delete', id); }
    async saveDraft(kind, data) {
      const normalized = normalizeDraft(kind, data);
      return this.put({ id: `draft:${kind}`, kind: 'draft', studio: kind, updatedAt: Date.now(), data: normalized });
    }
    async addConversion(type, inputName, filename, blob) {
      if (!TYPES.includes(type) || !(blob instanceof Blob) || !blob.size || blob.size > MAX_RESULT) fail('Kết quả quá lớn để lưu lịch sử (giới hạn 20 MB).');
      const item = { id: `history:${root.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`, kind: 'history', type, inputName: cleanName(inputName), filename: cleanName(filename), size: blob.size, updatedAt: Date.now(), blob };
      await this.put(item);
      const history = (await this.all()).filter(entry => entry.kind === 'history').sort((a, b) => b.updatedAt - a.updatedAt);
      await Promise.all(excessHistory(history).map(entry => this.remove(entry.id)));
      return item;
    }
    async exportBackup() {
      if (!root.JSZip) fail('Không thể tạo ZIP: thư viện chưa tải.');
      const zip = new root.JSZip();
      const items = await this.all();
      const records = [];
      for (const item of items) {
        if (item.kind === 'draft') records.push({ id: item.id, kind: 'draft', studio: item.studio, updatedAt: item.updatedAt, data: normalizeDraft(item.studio, item.data) });
        if (item.kind === 'history' && item.blob instanceof Blob) {
          const path = `files/${item.id.slice(8)}.bin`;
          zip.file(path, new Uint8Array(await item.blob.arrayBuffer()));
          records.push({ id: item.id, kind: 'history', type: item.type, inputName: item.inputName, filename: item.filename, updatedAt: item.updatedAt, size: item.size, path, mime: item.blob.type });
        }
      }
      zip.file('workspace.json', JSON.stringify({ format: 'offfice-workspace', version: 1, records }));
      return new Blob([await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })], { type: 'application/zip' });
    }
    async importBackup(file) {
      if (!root.JSZip || !(file instanceof Blob) || file.size > 100 * 1024 * 1024) fail('Tệp sao lưu không hợp lệ hoặc vượt 100 MB.');
      const zip = await root.JSZip.loadAsync(new Uint8Array(await file.arrayBuffer()));
      const manifestFile = zip.file('workspace.json');
      if (!manifestFile) fail('Thiếu workspace.json trong bản sao lưu.');
      if (manifestFile._data?.uncompressedSize > 5 * 1024 * 1024) fail('Danh mục sao lưu quá lớn.');
      const manifestText = await manifestFile.async('string');
      if (manifestText.length > 5 * 1024 * 1024) fail('Danh mục sao lưu quá lớn.');
      const manifest = JSON.parse(manifestText);
      if (manifest.format !== 'offfice-workspace' || manifest.version !== 1 || !Array.isArray(manifest.records) || manifest.records.length > 33) fail('Định dạng bản sao lưu không được hỗ trợ.');
      const records = [];
      const ids = new Set();
      let totalBytes = 0;
      for (const raw of manifest.records) {
        if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || ids.has(raw.id)) fail('Mục sao lưu bị trùng hoặc không hợp lệ.');
        ids.add(raw.id);
        const updatedAt = finite(raw.updatedAt, Date.now(), 0, Date.now());
        if (raw.kind === 'draft' && raw.id === `draft:${raw.studio}`) {
          records.push({ id: raw.id, kind: 'draft', studio: raw.studio, updatedAt, data: normalizeDraft(raw.studio, raw.data) });
        } else if (raw.kind === 'history' && /^history:[\w-]+$/.test(raw.id) && TYPES.includes(raw.type) && raw.path === `files/${raw.id.slice(8)}.bin` && zip.file(raw.path)) {
          const entry = zip.file(raw.path);
          if (entry._data?.uncompressedSize > MAX_RESULT) fail('Kết quả trong bản sao lưu vượt giới hạn.');
          const bytes = await entry.async('uint8array');
          if (!bytes.length || bytes.length > MAX_RESULT) fail('Kết quả trong bản sao lưu vượt giới hạn.');
          totalBytes += bytes.length;
          if (totalBytes > MAX_TOTAL) fail('Tổng dữ liệu kết quả vượt 100 MB.');
          records.push({ id: raw.id, kind: 'history', type: raw.type, inputName: cleanName(raw.inputName), filename: cleanName(raw.filename), updatedAt, size: bytes.length, blob: new Blob([bytes], { type: typeof raw.mime === 'string' ? raw.mime.slice(0, 100) : '' }) });
        } else fail('Bản sao lưu có dữ liệu không hợp lệ.');
      }
      const db = await this.open();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('items', 'readwrite');
        const store = tx.objectStore('items');
        for (const record of records) store.put(record);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Không thể khôi phục dữ liệu.'));
        tx.onabort = () => reject(tx.error || new Error('Khôi phục đã bị hủy.'));
      });
      const history = (await this.all()).filter(entry => entry.kind === 'history').sort((a, b) => b.updatedAt - a.updatedAt);
      await Promise.all(excessHistory(history).map(entry => this.remove(entry.id)));
      return records.length;
    }
  }
  root.WorkspaceStore = WorkspaceStore;
  WorkspaceStore.normalizeDraft = normalizeDraft;
  if (typeof module !== 'undefined') module.exports = { WorkspaceStore, normalizeDraft, cleanName };
})(typeof window === 'undefined' ? globalThis : window);
