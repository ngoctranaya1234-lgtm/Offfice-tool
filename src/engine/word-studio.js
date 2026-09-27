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
    const nodes = this.editorEl.children;
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
    const pdfDoc = await PDFLib.PDFDocument.create();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 841.89]);
    const margin = 50;
    let y = 841.89 - margin;
    const maxWidth = 595.28 - (margin * 2);

    const nodes = this.editorEl.children;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const text = node.innerText.trim();
      if (!text) continue;

      const isHeading = ['H1', 'H2', 'H3'].includes(node.tagName);
      const activeFont = isHeading ? fontBold : font;
      const fontSize = node.tagName === 'H1' ? 18 : (node.tagName === 'H2' ? 14 : 11);
      const leading = isHeading ? 24 : 16;

      if (y < margin + 40) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 841.89 - margin;
      }

      const words = text.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = activeFont.widthOfTextAtSize(testLine, fontSize);
        if (textWidth > maxWidth && currentLine) {
          page.drawText(currentLine, { x: margin, y: y, size: fontSize, font: activeFont, color: PDFLib.rgb(0.1, 0.15, 0.2) });
          y -= leading;
          currentLine = word;
          if (y < margin + 40) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = 841.89 - margin;
          }
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        page.drawText(currentLine, { x: margin, y: y, size: fontSize, font: activeFont, color: PDFLib.rgb(0.1, 0.15, 0.2) });
        y -= leading + 4;
      }
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
