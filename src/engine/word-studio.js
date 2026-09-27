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

  setLineSpacing(spacing) {
    if (window.sound) window.sound.click();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    let node = selection.anchorNode;
    while (node && node !== this.editorEl && node.nodeType === 3) {
      node = node.parentNode;
    }
    if (node && node !== this.editorEl) {
      node.style.lineHeight = spacing;
    } else if (this.editorEl) {
      this.editorEl.style.lineHeight = spacing;
    }
  }

  insertCalloutBlock(type = 'quote') {
    if (window.sound) window.sound.click();
    let html = '';
    if (type === 'quote') {
      html = `<blockquote style="border-left: 4px solid var(--accent-cyan); padding: 8px 16px; margin: 12px 0; background: rgba(56, 189, 248, 0.08); border-radius: 0 8px 8px 0; font-style: italic;">"Nhập câu trích dẫn hoặc ý kiến quan trọng tại đây..."</blockquote><p><br></p>`;
    } else if (type === 'warning') {
      html = `<div style="border-left: 4px solid #f59e0b; padding: 10px 16px; margin: 12px 0; background: rgba(245, 158, 11, 0.08); border-radius: 0 8px 8px 0; color: #f8fafc;"><b>⚠️ Lưu ý quan trọng:</b> Nhập nội dung cảnh báo tại đây...</div><p><br></p>`;
    } else if (type === 'success') {
      html = `<div style="border-left: 4px solid #10b981; padding: 10px 16px; margin: 12px 0; background: rgba(16, 185, 129, 0.08); border-radius: 0 8px 8px 0; color: #f8fafc;"><b>✓ Hoàn thành:</b> Nhập ghi chú xác nhận tại đây...</div><p><br></p>`;
    } else {
      html = `<div style="border-left: 4px solid #38bdf8; padding: 10px 16px; margin: 12px 0; background: rgba(56, 189, 248, 0.08); border-radius: 0 8px 8px 0; color: #f8fafc;"><b>ℹ️ Thông tin:</b> Nhập nội dung hướng dẫn tại đây...</div><p><br></p>`;
    }
    document.execCommand('insertHTML', false, html);
    this.updateStats();
  }

  insertSymbol(symbol) {
    if (window.sound) window.sound.click();
    document.execCommand('insertText', false, symbol);
    this.updateStats();
  }

  clearFormatting() {
    if (window.sound) window.sound.click();
    document.execCommand('removeFormat', false, null);
    this.updateStats();
  }

  insertAdministrativeTemplate(type) {
    if (window.sound) window.sound.success();
    let templateHtml = '';

    if (type === 'don_xin_phep') {
      templateHtml = `
        <div style="text-align: center; font-weight: bold; margin-bottom: 1.5rem;">
          <p style="font-size: 15px; margin: 0; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p style="font-size: 14px; margin: 4px 0 0 0; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</p>
        </div>
        <h2 style="text-align: center; margin: 1.5rem 0 1rem 0; font-size: 20px;">ĐƠN XIN PHÉP NGHỈ VIỆC / TẠM VẮNG</h2>
        <p><b>Kính gửi:</b> Ban Giám đốc và Phòng Hành chính Nhân sự</p>
        <p>Tên tôi là: ................................................................................................................</p>
        <p>Chức vụ / Bộ phận: .....................................................................................................</p>
        <p>Nay tôi làm đơn này xin phép được nghỉ từ ngày .../.../202... đến hết ngày .../.../202...</p>
        <p>Lý do xin nghỉ: ...........................................................................................................</p>
        <p>Công việc trong thời gian nghỉ tôi xin bàn giao cho: ........................................................</p>
        <p>Kính mong Ban Giám đốc xem xét và phê duyệt. Tôi xin chân thành cảm ơn!</p>
        <div style="display: flex; justify-content: space-between; margin-top: 2.5rem;">
          <div style="text-align: center;"><b>NGƯỜI DUYỆT</b><br><br><br><br><i>(Ký và ghi rõ họ tên)</i></div>
          <div style="text-align: center;"><i>Ngày ..... tháng ..... năm 202...</i><br><b>NGƯỜI LÀM ĐƠN</b><br><br><br><br><i>(Ký và ghi rõ họ tên)</i></div>
        </div>
        <p><br></p>
      `;
    } else if (type === 'hop_dong') {
      templateHtml = `
        <div style="text-align: center; font-weight: bold; margin-bottom: 1.5rem;">
          <p style="font-size: 15px; margin: 0; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p style="font-size: 14px; margin: 4px 0 0 0; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</p>
        </div>
        <h2 style="text-align: center; margin: 1.5rem 0 0.5rem 0; font-size: 20px;">HỢP ĐỒNG CUNG CẤP DỊCH VỤ</h2>
        <p style="text-align: center; font-style: italic; margin-bottom: 1.5rem;">Số: ....../202.../HĐDV</p>
        <p>Hôm nay, ngày ..... tháng ..... năm 202..., tại trụ sở Công ty, chúng tôi gồm có:</p>
        <p><b>BÊN A (BÊN SỬ DỤNG DỊCH VỤ):</b></p>
        <p>Đại diện bởi: ..................................................... Chức vụ: ...........................................</p>
        <p>Địa chỉ: ............................................................. Mã số thuế: ......................................</p>
        <p><b>BÊN B (BÊN CUNG CẤP DỊCH VỤ):</b></p>
        <p>Đại diện bởi: ..................................................... Chức vụ: ...........................................</p>
        <p>Địa chỉ: ............................................................. Mã số thuế: ......................................</p>
        <p>Hai bên cùng thống nhất ký kết hợp đồng dịch vụ với các điều khoản sau:</p>
        <p><b>Điều 1: Nội dung công việc và phạm vi thực hiện</b><br>Bên B cam kết cung cấp đầy đủ các dịch vụ theo tiêu chuẩn...</p>
        <p><b>Điều 2: Giá trị hợp đồng và phương thức thanh toán</b><br>Tổng giá trị hợp đồng là: .............................. VNĐ. Thanh toán theo hình thức chuyển khoản.</p>
        <div style="display: flex; justify-content: space-between; margin-top: 2.5rem;">
          <div style="text-align: center;"><b>ĐẠI DIỆN BÊN A</b><br><br><br><br><i>(Ký tên và đóng dấu)</i></div>
          <div style="text-align: center;"><b>ĐẠI DIỆN BÊN B</b><br><br><br><br><i>(Ký tên và đóng dấu)</i></div>
        </div>
        <p><br></p>
      `;
    } else if (type === 'bien_ban') {
      templateHtml = `
        <div style="text-align: center; font-weight: bold; margin-bottom: 1.5rem;">
          <p style="font-size: 15px; margin: 0; text-transform: uppercase;">CÔNG TY / ĐƠN VỊ: ........................................</p>
          <p style="font-size: 14px; margin: 4px 0 0 0;">PHÒNG BAN: .................................................</p>
        </div>
        <h2 style="text-align: center; margin: 1.5rem 0 1rem 0; font-size: 20px;">BIÊN BẢN CUỘC HỌP NỘI BỘ</h2>
        <p><b>Thời gian:</b> ..... giờ ..... ngày ..... tháng ..... năm 202...</p>
        <p><b>Địa điểm:</b> Phòng họp ..........................................................................................</p>
        <p><b>Thành phần tham dự:</b><br>- Chủ tọa: ............................................................. Thư ký: .................................................<br>- Các thành viên tham dự: Đủ .../... thành viên.</p>
        <p><b>Nội dung chính cuộc họp:</b><br>1. Đánh giá tiến độ công việc tuần qua.<br>2. Thảo luận các giải pháp tháo gỡ vướng mắc kỹ thuật.<br>3. Phân công nhiệm vụ tuần tiếp theo.</p>
        <p>Cuộc họp kết thúc vào lúc ..... giờ cùng ngày. Biên bản đã được thông qua và nhất trí 100%.</p>
        <div style="display: flex; justify-content: space-between; margin-top: 2.5rem;">
          <div style="text-align: center;"><b>THƯ KÝ CUỘC HỌP</b><br><br><br><br><i>(Ký và ghi rõ họ tên)</i></div>
          <div style="text-align: center;"><b>CHỦ TỌA</b><br><br><br><br><i>(Ký và ghi rõ họ tên)</i></div>
        </div>
        <p><br></p>
      `;
    }

    if (templateHtml && this.editorEl) {
      this.editorEl.innerHTML = templateHtml;
      this.updateStats();
    }
  }

  togglePrintPreview() {
    if (window.sound) window.sound.click();
    const container = document.querySelector('.word-editor-paper');
    if (container) {
      container.classList.toggle('word-print-preview-mode');
    }
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

  insertHorizontalRule() {
    if (window.sound) window.sound.click();
    document.execCommand('insertHorizontalRule');
    this.updateStats();
  }

  async insertImageFile(file) {
    if (!file) return;
    if (window.sound) window.sound.success();
    const reader = new FileReader();
    reader.onload = (e) => {
      this.exec('insertImage', e.target.result);
    };
    reader.readAsDataURL(file);
  }

  setFont(fontName) {
    if (window.sound) window.sound.click();
    this.exec('fontName', fontName);
  }

  setFontSize(size) {
    if (window.sound) window.sound.click();
    this.exec('fontSize', size);
  }

  setTextColor(color) {
    if (window.sound) window.sound.click();
    this.exec('foreColor', color);
  }

  setHighlightColor(color) {
    if (window.sound) window.sound.click();
    this.exec('hiliteColor', color);
  }

  exportHtml(filename = 'Tai_lieu.html') {
    if (window.sound) window.sound.success();
    const bodyHtml = this.editorEl ? this.editorEl.innerHTML : '';
    const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${filename.replace(/\.[^/.]+$/, "")}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    img { max-width: 100%; border-radius: 8px; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportMarkdown(filename = 'Tai_lieu.md') {
    if (window.sound) window.sound.success();
    let md = '';
    const nodes = this.editorEl ? Array.from(this.editorEl.children) : [];
    if (nodes.length === 0 && this.editorEl) {
      md = this.editorEl.innerText;
    } else {
      nodes.forEach(node => {
        const text = node.innerText.trim();
        if (!text) return;
        if (node.tagName === 'H1') md += `# ${text}\n\n`;
        else if (node.tagName === 'H2') md += `## ${text}\n\n`;
        else if (node.tagName === 'H3') md += `### ${text}\n\n`;
        else if (node.tagName === 'UL') {
          Array.from(node.querySelectorAll('li')).forEach(li => {
            md += `- ${li.innerText.trim()}\n`;
          });
          md += '\n';
        } else if (node.tagName === 'OL') {
          Array.from(node.querySelectorAll('li')).forEach((li, idx) => {
            md += `${idx + 1}. ${li.innerText.trim()}\n`;
          });
          md += '\n';
        } else {
          md += `${text}\n\n`;
        }
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  replaceText(findStr, replaceStr, replaceAll = false) {
    if (!findStr || !this.editorEl) return 0;
    if (window.sound) window.sound.click();
    let html = this.editorEl.innerHTML;
    let count = 0;
    if (replaceAll) {
      const regex = new RegExp(findStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = html.match(regex);
      count = matches ? matches.length : 0;
      html = html.replace(regex, replaceStr);
    } else {
      const regex = new RegExp(findStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (regex.test(html)) {
        html = html.replace(regex, replaceStr);
        count = 1;
      }
    }
    this.editorEl.innerHTML = html;
    this.updateStats();
    return count;
  }

  printDocument() {
    if (window.sound) window.sound.click();
    const content = this.editorEl ? this.editorEl.innerHTML : '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>In Tài Liệu - Offfice tool</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Times New Roman", serif; font-size: 14pt; line-height: 1.6; color: #000; background: #fff; padding: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
          th, td { border: 1px solid #333; padding: 8px 12px; text-align: left; }
          th { background: #f0f0f0; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  }

  toggleZenMode() {
    if (window.sound) window.sound.tabSwitch();
    const wrap = document.querySelector('.word-editor-container');
    if (wrap) {
      wrap.classList.toggle('zen-mode-active');
      const isZen = wrap.classList.contains('zen-mode-active');
      const btn = document.getElementById('word-zen-btn');
      if (btn) {
        btn.classList.toggle('active', isZen);
        btn.title = isZen ? 'Thoát toàn màn hình (Esc)' : 'Soạn thảo toàn màn hình (Zen Mode)';
      }
    }
  }
}

window.wordStudio = new WordStudio();
