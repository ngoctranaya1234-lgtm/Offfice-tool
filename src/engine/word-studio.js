// Word Document Studio - Rich Text Editor with real .docx and .pdf generation
class WordStudio {
  constructor() {
    this.editorEl = null;
    this.statsEl = null;
  }

  init(editorElementId, statsElementId) {
    this.editorEl = document.getElementById(editorElementId);
    this.statsEl = document.getElementById(statsElementId);
    
    if (this.editorEl) {
      this.editorEl.addEventListener('input', () => this.updateStats());
      this.editorEl.addEventListener('keyup', () => this.updateStats());
      this.updateStats();
    }
  }

  exec(command, value = null) {
    if (window.sound) window.sound.click();
    document.execCommand(command, false, value);
    if (this.editorEl) this.editorEl.focus();
    this.updateStats();
  }

  insertHeading(level) {
    if (window.sound) window.sound.click();
    document.execCommand('formatBlock', false, `<h${level}>`);
    if (this.editorEl) this.editorEl.focus();
  }

  insertTable(rows = 3, cols = 3) {
    if (window.sound) window.sound.click();
    let html = '<table class="doc-table"><tbody>';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += r === 0 ? '<th>Tiêu đề</th>' : '<td>Nội dung</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    document.execCommand('insertHTML', false, html);
    this.updateStats();
  }

  updateStats() {
    if (!this.editorEl || !this.statsEl) return;
    const text = this.editorEl.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const readTime = Math.ceil(words / 200);
    this.statsEl.innerHTML = `<span><b>${words}</b> từ</span> • <span><b>${chars}</b> ký tự</span> • <span>~<b>${readTime}</b> phút đọc</span>`;
  }

  async loadDocxFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXml = await zip.file('word/document.xml').async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, 'application/xml');

    let html = '';
    const pNodes = xmlDoc.getElementsByTagName('w:p');

    for (let i = 0; i < pNodes.length; i++) {
      const p = pNodes[i];
      let pHtml = '';
      const runs = p.getElementsByTagName('w:r');

      let isH1 = false;
      const pStyle = p.getElementsByTagName('w:pStyle')[0];
      if (pStyle && pStyle.getAttribute('w:val') && pStyle.getAttribute('w:val').toLowerCase().includes('heading')) {
        isH1 = true;
      }

      for (let j = 0; j < runs.length; j++) {
        const r = runs[j];
        const isBold = r.getElementsByTagName('w:b').length > 0;
        const isItalic = r.getElementsByTagName('w:i').length > 0;
        const isUnderline = r.getElementsByTagName('w:u').length > 0;
        
        let runText = '';
        const tNodes = r.getElementsByTagName('w:t');
        for (let k = 0; k < tNodes.length; k++) {
          runText += tNodes[k].textContent;
        }

        if (runText) {
          let formatted = runText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          if (isBold) formatted = `<b>${formatted}</b>`;
          if (isItalic) formatted = `<i>${formatted}</i>`;
          if (isUnderline) formatted = `<u>${formatted}</u>`;
          pHtml += formatted;
        }
      }

      if (isH1) {
        html += `<h2>${pHtml || '<br>'}</h2>`;
      } else {
        html += `<p>${pHtml || '<br>'}</p>`;
      }
    }

    if (this.editorEl) {
      this.editorEl.innerHTML = html || '<p>Tài liệu trống</p>';
      this.updateStats();
    }
  }

  async exportDocx(filename = 'Tai_lieu.docx') {
    if (window.sound) window.sound.success();
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;
    const children = [];

    // Parse paragraphs from editor
    let nodes = Array.from(this.editorEl.children);
    if (nodes.length === 0 && this.editorEl.innerText.trim()) {
      const p = document.createElement('p');
      p.innerText = this.editorEl.innerText.trim();
      nodes = [p];
    }
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const text = node.innerText.trim();
      if (!text) continue;

      if (node.tagName === 'H1' || node.tagName === 'H2') {
        children.push(new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 }
        }));
      } else if (node.tagName === 'H3') {
        children.push(new Paragraph({
          text: text,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 80 }
        }));
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: text, size: 23 })],
          spacing: { after: 140 }
        }));
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children.length > 0 ? children : [new Paragraph("Tài liệu mới")]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportPdf(filename = 'Tai_lieu.pdf') {
    if (window.sound) window.sound.success();

    const PAGE_W = 1240;
    const PAGE_H = 1754;
    const MARGIN = 100;
    const USABLE_W = PAGE_W - (MARGIN * 2);

    const pages = [];
    let currentCanvas = document.createElement('canvas');
    currentCanvas.width = PAGE_W;
    currentCanvas.height = PAGE_H;
    let ctx = currentCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    let curY = MARGIN;

    function newPage() {
      pages.push(currentCanvas);
      currentCanvas = document.createElement('canvas');
      currentCanvas.width = PAGE_W;
      currentCanvas.height = PAGE_H;
      ctx = currentCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, PAGE_W, PAGE_H);
      curY = MARGIN;
    }

    let nodes = Array.from(this.editorEl.children);
    if (nodes.length === 0 && this.editorEl.innerText.trim()) {
      const p = document.createElement('p');
      p.innerText = this.editorEl.innerText.trim();
      nodes = [p];
    }
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const text = node.innerText.trim();
      if (!text) {
        curY += 16;
        continue;
      }

      const isH1 = node.tagName === 'H1';
      const isH2 = node.tagName === 'H2';
      const isH3 = node.tagName === 'H3';
      const fontSize = isH1 ? 32 : (isH2 ? 26 : (isH3 ? 22 : 18));
      const lineHeight = isH1 ? 44 : (isH2 ? 36 : 28);
      const isBold = isH1 || isH2 || isH3 || node.querySelector('b');

      ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
      ctx.fillStyle = isH1 ? '#0f172a' : '#1e293b';

      const words = text.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = ctx.measureText(testLine).width;
        if (textWidth > USABLE_W && currentLine) {
          if (curY + lineHeight > PAGE_H - MARGIN) newPage();
          ctx.fillText(currentLine, MARGIN, curY);
          curY += lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        if (curY + lineHeight > PAGE_H - MARGIN) newPage();
        ctx.fillText(currentLine, MARGIN, curY);
        curY += lineHeight + 8;
      }
    }
    pages.push(currentCanvas);

    const pdfDoc = await PDFLib.PDFDocument.create();
    for (const pCanvas of pages) {
      const imgDataUrl = pCanvas.toDataURL('image/jpeg', 0.95);
      const imgBytes = await fetch(imgDataUrl).then(r => r.arrayBuffer());
      const img = await pdfDoc.embedJpg(imgBytes);
      const page = pdfDoc.addPage([595.28, 841.89]);
      page.drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

window.wordStudio = new WordStudio();
