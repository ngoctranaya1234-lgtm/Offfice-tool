// Workspace dashboard, draft recovery, conversion history, and ZIP backup.
document.addEventListener('DOMContentLoaded', async () => {
  const store = new window.WorkspaceStore();
  const labels = { word: 'Văn bản Word', sheet: 'Bảng tính Excel', slides: 'Bài trình chiếu' };
  const typeLabels = { 'word-to-pdf': 'Word → PDF', 'pdf-to-word': 'PDF → Word', 'pdf-to-excel': 'PDF → Excel', 'excel-to-pdf': 'Excel → PDF', 'img-to-pdf': 'Ảnh → PDF', 'pdf-to-img': 'PDF → Ảnh', 'compress-pdf': 'Nén PDF', 'pdf-edited': 'PDF đã sửa' };
  const timers = new Map();
  const lastSaved = new Map();
  const $ = id => document.getElementById(id);
  const notice = $('workspace-notice');
  const toast = $('workspace-toast');
  const status = $('workspace-save-status');
  let available = false;
  let importing = false;
  let toastTimer = null;

  function showNotice(message, error = false) {
    notice.textContent = message;
    notice.classList.remove('hidden');
    notice.classList.toggle('is-error', error);
    if (!$('view-workspace').classList.contains('active')) {
      toast.textContent = message;
      toast.classList.remove('hidden');
      toast.classList.toggle('is-error', error);
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.add('hidden'), 7000);
    }
  }
  function setStatus(message, error = false) {
    status.textContent = message;
    status.classList.toggle('is-error', error);
  }
  function bytes(size) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  function date(value) { return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); }
  function button(label, icon, action, className = 'btn-secondary') {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = className;
    const svg = document.createElement('i');
    svg.setAttribute('data-lucide', icon);
    const span = document.createElement('span');
    span.textContent = label;
    element.append(svg, span);
    element.addEventListener('click', action);
    return element;
  }
  function sanitizeWord(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    const allowed = new Set(['P', 'DIV', 'SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'H1', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'IMG']);
    const blocked = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'FORM', 'INPUT', 'BUTTON', 'LINK', 'META']);
    const styleProps = new Set(['text-align', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'color', 'background-color', 'border-left', 'padding', 'margin', 'line-height']);
    function clean(node) {
      for (const child of Array.from(node.children)) {
        if (blocked.has(child.tagName)) { child.remove(); continue; }
        clean(child);
        if (!allowed.has(child.tagName)) { child.replaceWith(...Array.from(child.childNodes)); continue; }
        const imageSource = child.tagName === 'IMG' ? child.getAttribute('src') : null;
        if (child.tagName === 'IMG' && (!imageSource || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(imageSource) || imageSource.length > 1500000)) { child.remove(); continue; }
        const styles = [];
        for (const property of Array.from(child.style)) {
          const value = child.style.getPropertyValue(property);
          if (styleProps.has(property) && !/url\s*\(|expression\s*\(|[<>]/i.test(value)) styles.push(`${property}:${value}`);
        }
        for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name);
        if (styles.length) child.setAttribute('style', styles.join(';'));
        if (imageSource) child.setAttribute('src', imageSource);
        if (child.tagName === 'TABLE') child.className = 'doc-table';
      }
    }
    clean(template.content);
    return template.innerHTML;
  }
  function snapshot(kind) {
    if (kind === 'word') {
      const editor = $('word-editor-body');
      return editor && (editor.innerText.trim() || editor.querySelector('img')) ? { html: sanitizeWord(editor.innerHTML) } : null;
    }
    if (kind === 'sheet' && window.sheetStudio) {
      const sheet = window.sheetStudio;
      const hasData = sheet.data.some(row => row.some(cell => cell !== ''));
      if (!hasData && sheet.rows === 30 && sheet.cols === 12 && !Object.keys(sheet.styles).length) return null;
      return { rows: sheet.rows, cols: sheet.cols, data: sheet.data, styles: sheet.styles };
    }
    if (kind === 'slides' && window.slidesStudio) {
      const slides = window.slidesStudio;
      if (slides.slides.length === 1 && !slides.slides[0].elements.length && slides.slides[0].bg === '#0f172a') return null;
      return { slides: slides.slides, currentSlideIndex: slides.currentSlideIndex };
    }
    return null;
  }
  async function save(kind) {
    if (!available) return;
    timers.delete(kind);
    try {
      const data = snapshot(kind);
      const encoded = JSON.stringify(data);
      if (encoded === lastSaved.get(kind)) return;
      setStatus('Đang tự lưu...');
      if (data) await store.saveDraft(kind, data);
      else await store.remove(`draft:${kind}`);
      lastSaved.set(kind, encoded);
      setStatus(`Đã tự lưu lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`);
      if ($('view-workspace').classList.contains('active')) await render();
    } catch (error) {
      setStatus('Không thể tự lưu', true);
      showNotice(`Không thể lưu bản nháp: ${error.message}. Hãy xuất tệp trước khi rời trang.`, true);
    }
  }
  function queueSave(kind) {
    if (!available || !labels[kind]) return;
    clearTimeout(timers.get(kind));
    timers.set(kind, setTimeout(() => save(kind), 900));
  }
  function restoreOne(item) {
    const data = window.WorkspaceStore.normalizeDraft(item.studio, item.data);
    if (item.studio === 'word') {
      $('word-editor-body').innerHTML = sanitizeWord(data.html);
      window.wordStudio.updateStats();
    } else if (item.studio === 'sheet') {
      Object.assign(window.sheetStudio, data);
      window.sheetStudio.activeCell = { r: 0, c: 0 };
      window.sheetStudio.renderGrid();
      window.sheetStudio.selectCell(0, 0);
    } else {
      window.slidesStudio.slides = data.slides;
      window.slidesStudio.currentSlideIndex = data.currentSlideIndex;
      window.slidesStudio.render();
    }
    lastSaved.set(item.studio, JSON.stringify(snapshot(item.studio)));
  }
  async function restoreDrafts() {
    const items = await store.all();
    for (const item of items.filter(entry => entry.kind === 'draft')) {
      try { restoreOne(item); }
      catch (error) { showNotice(`Không thể mở bản nháp ${labels[item.studio] || item.studio}: ${error.message}`, true); }
    }
  }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function render() {
    const draftsEl = $('workspace-drafts');
    const historyEl = $('workspace-history');
    draftsEl.setAttribute('aria-busy', 'true');
    historyEl.setAttribute('aria-busy', 'true');
    try {
      const items = await store.all();
      const drafts = items.filter(item => item.kind === 'draft');
      const history = items.filter(item => item.kind === 'history').sort((a, b) => b.updatedAt - a.updatedAt);
      $('workspace-draft-count').textContent = drafts.length;
      $('workspace-history-count').textContent = history.length;
      $('workspace-history-size').textContent = bytes(history.reduce((sum, item) => sum + item.size, 0));
      draftsEl.replaceChildren();
      for (const kind of ['word', 'sheet', 'slides']) {
        const item = drafts.find(draft => draft.studio === kind);
        const card = document.createElement('article');
        card.className = 'surface-card workspace-draft';
        const text = document.createElement('div');
        const heading = document.createElement('h4');
        heading.textContent = labels[kind];
        const detail = document.createElement('p');
        detail.textContent = item ? `Lưu lần cuối ${date(item.updatedAt)}` : 'Chưa có bản nháp';
        text.append(heading, detail);
        card.append(text);
        if (item) {
          const actions = document.createElement('div');
          actions.className = 'workspace-row-actions';
          actions.append(button('Mở', 'arrow-up-right', () => {
            try { restoreOne(item); window.switchTab(kind); }
            catch (error) { showNotice(`Không thể mở bản nháp: ${error.message}`, true); }
          }));
          actions.append(button('Xóa bản lưu', 'trash-2', async () => {
            if (!confirm(`Xóa bản lưu ${labels[kind]} trên thiết bị này?`)) return;
            try {
              await store.remove(item.id);
              lastSaved.delete(kind);
              await render();
              showNotice('Đã xóa bản lưu. Nội dung đang mở vẫn còn cho đến khi bạn sửa tiếp.');
            } catch (error) { showNotice(`Không thể xóa bản lưu: ${error.message}`, true); }
          }, 'btn-quiet'));
          card.append(actions);
        }
        draftsEl.append(card);
      }
      const query = $('workspace-search').value.trim().toLocaleLowerCase('vi-VN');
      const filter = $('workspace-filter').value;
      const visible = history.filter(item => (filter === 'all' || item.type === filter) && (!query || `${item.filename} ${item.inputName}`.toLocaleLowerCase('vi-VN').includes(query)));
      historyEl.replaceChildren();
      if (!visible.length) {
        const empty = document.createElement('div');
        empty.className = 'surface-card workspace-empty';
        empty.textContent = history.length ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có kết quả chuyển đổi. Hãy chuyển đổi một tệp để bắt đầu lịch sử.';
        historyEl.append(empty);
      }
      for (const item of visible) {
        const row = document.createElement('article');
        row.className = 'surface-card workspace-history-row';
        const body = document.createElement('div');
        body.className = 'workspace-history-info';
        const title = document.createElement('h4');
        title.textContent = item.filename;
        const detail = document.createElement('p');
        detail.textContent = `${typeLabels[item.type] || item.type} · Từ ${item.inputName} · ${date(item.updatedAt)} · ${bytes(item.size)}`;
        body.append(title, detail);
        const actions = document.createElement('div');
        actions.className = 'workspace-row-actions';
        actions.append(button('Tải lại', 'download', () => download(item.blob, item.filename)));
        actions.append(button('Xóa', 'trash-2', async () => {
          if (!confirm(`Xóa kết quả ${item.filename} khỏi lịch sử?`)) return;
          try { await store.remove(item.id); await render(); showNotice('Đã xóa kết quả khỏi thiết bị.'); }
          catch (error) { showNotice(`Không thể xóa kết quả: ${error.message}`, true); }
        }, 'btn-quiet'));
        row.append(body, actions);
        historyEl.append(row);
      }
      window.lucide?.createIcons();
    } catch (error) { showNotice(`Không thể tải không gian làm việc: ${error.message}`, true); }
    finally { draftsEl.removeAttribute('aria-busy'); historyEl.removeAttribute('aria-busy'); }
  }

  try {
    await store.open();
    await restoreDrafts();
    available = true;
    setStatus('Tự lưu đã bật');
    await render();
  } catch (error) {
    setStatus('Không có bộ nhớ cục bộ', true);
    showNotice(`Không thể mở bộ nhớ: ${error.message}. Bạn vẫn có thể xuất tệp từ từng công cụ.`, true);
    $('workspace-export').disabled = true;
    $('workspace-import').disabled = true;
  }
  document.addEventListener('input', event => {
    const studio = event.target.closest?.('#view-word, #view-sheet, #view-slides')?.id?.slice(5);
    if (studio) queueSave(studio);
  }, true);
  document.addEventListener('click', event => {
    const studio = event.target.closest?.('#view-word, #view-sheet, #view-slides')?.id?.slice(5);
    if (studio) setTimeout(() => queueSave(studio), 0);
  }, true);
  document.addEventListener('workspace:dirty', event => queueSave(event.detail?.studio));
  document.addEventListener('workspace:view', () => { toast.classList.add('hidden'); if (available) render(); });
  document.addEventListener('workspace:conversion', async event => {
    if (!available) return;
    const { type, inputName, filename, blob } = event.detail;
    try { await store.addConversion(type, inputName, filename, blob); await render(); }
    catch (error) { showNotice(`Đã chuyển đổi, nhưng không lưu vào lịch sử: ${error.message}`, true); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') for (const kind of timers.keys()) { clearTimeout(timers.get(kind)); save(kind); }
  });
  $('workspace-search').addEventListener('input', render);
  $('workspace-filter').addEventListener('change', render);
  $('workspace-export').addEventListener('click', async event => {
    const control = event.currentTarget;
    control.disabled = true;
    setStatus('Đang tạo bản sao lưu...');
    try {
      for (const kind of Array.from(timers.keys())) { clearTimeout(timers.get(kind)); await save(kind); }
      const blob = await store.exportBackup();
      download(blob, `Offfice-backup-${new Date().toISOString().slice(0, 10)}.zip`);
      showNotice('Đã tạo bản sao lưu ZIP. Hãy cất tệp ở nơi an toàn.');
      setStatus('Tự lưu đã bật');
    } catch (error) { showNotice(`Không thể sao lưu: ${error.message}`, true); setStatus('Sao lưu thất bại', true); }
    finally { control.disabled = false; }
  });
  $('workspace-import').addEventListener('change', async event => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || importing) return;
    if (!confirm('Khôi phục sẽ thay thế bản nháp trùng loại đang lưu trên thiết bị. Tiếp tục?')) { input.value = ''; return; }
    importing = true;
    input.disabled = true;
    setStatus('Đang khôi phục...');
    try {
      const count = await store.importBackup(file);
      await restoreDrafts();
      await render();
      showNotice(`Đã khôi phục ${count} mục từ bản sao lưu.`);
      setStatus('Tự lưu đã bật');
    } catch (error) { showNotice(`Không thể khôi phục: ${error.message}`, true); setStatus('Khôi phục thất bại', true); }
    finally { input.value = ''; input.disabled = false; importing = false; }
  });
});
