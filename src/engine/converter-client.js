// Unified Document Conversion Hub - Hybrid Client & Native Server
// 100% Vietnamese Unicode Compliant - Eliminates WinAnsi encoding errors completely
class ConverterClient {
  constructor() {
    this.serverUrl = 'http://127.0.0.1:4000';
    this.isServerOnline = false;
    this.checkServer();
  }

  async checkServer() {
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 1200);
      const res = await fetch(`${this.serverUrl}/healthz`, { signal: ctrl.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        this.isServerOnline = true;
        this._updateStatusUI(true);
        return true;
      }
    } catch (e) {
      this.isServerOnline = false;
    }
    this._updateStatusUI(false);
    return false;
  }

  _updateStatusUI(online) {
    const el = document.getElementById('server-indicator');
    if (el) {
      if (online) {
        el.className = 'status-pill status-server-on';
        el.innerHTML = '<span class="status-dot"></span><span>Desktop Engine (Siêu Tốc)</span>';
      } else {
        el.className = 'status-pill status-server-client';
        el.innerHTML = '<span class="status-dot"></span><span>Client PWA Engine (Web/Mobile)</span>';
      }
    }
  }

  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  _base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  // 1. WORD TO PDF CONVERSION - 100% UNICODE & VIETNAMESE COMPLIANT
  async convertWordToPdf(file, onProgress) {
    if (onProgress) onProgress(15, 'Đang đọc cấu trúc tệp Word...');
    const arrayBuffer = await file.arrayBuffer();

    // If Desktop Server is active, use Python with registered ArialVN TrueType fonts
    if (this.isServerOnline) {
      if (onProgress) onProgress(45, 'Đang xử lý qua Desktop High-Performance Engine...');
      try {
        const b64 = this._arrayBufferToBase64(arrayBuffer);
        const res = await fetch(`${this.serverUrl}/api/convert/word-to-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_base64: b64, filename: file.name })
        });
        if (res.ok) {
          const json = await res.json();
          if (onProgress) onProgress(100, 'Hoàn thành!');
          return {
            blob: this._base64ToBlob(json.data_base64, 'application/pdf'),
            filename: json.filename
          };
        }
      } catch (err) {
        console.warn('Server conversion unavailable, using High-Fidelity Client Engine:', err);
      }
    }

    // High-Fidelity Canvas-Vector Unicode Renderer (Zero WinAnsi restriction!)
    if (onProgress) onProgress(40, 'Đang giải mã nội dung và bảng biểu...');
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXml = await zip.file('word/document.xml').async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, 'application/xml');

    const bodyNodes = xmlDoc.getElementsByTagName('w:body')[0]?.children || [];
    const elements = [];

    for (let i = 0; i < bodyNodes.length; i++) {
      const node = bodyNodes[i];
      if (node.tagName === 'w:p') {
        const runs = node.getElementsByTagName('w:r');
        let pText = '';
        let isBold = false;
        let isH1 = false;
        
        const pStyle = node.getElementsByTagName('w:pStyle')[0];
        if (pStyle && pStyle.getAttribute('w:val') && pStyle.getAttribute('w:val').toLowerCase().includes('heading')) {
          isH1 = true;
        }

        for (let j = 0; j < runs.length; j++) {
          const r = runs[j];
          if (r.getElementsByTagName('w:b').length > 0) isBold = true;
          const tNodes = r.getElementsByTagName('w:t');
          for (let k = 0; k < tNodes.length; k++) {
            pText += tNodes[k].textContent;
          }
        }

        if (pText.trim() || pText === '') {
          elements.push({ type: 'p', text: pText, bold: isBold, isH1: isH1 });
        }
      } else if (node.tagName === 'w:tbl') {
        // Table extraction
        const rowNodes = node.getElementsByTagName('w:tr');
        const tableRows = [];
        for (let r = 0; r < rowNodes.length; r++) {
          const cellNodes = rowNodes[r].getElementsByTagName('w:tc');
          const rowData = [];
          for (let c = 0; c < cellNodes.length; c++) {
            const cellText = Array.from(cellNodes[c].getElementsByTagName('w:t')).map(t => t.textContent).join('');
            rowData.push(cellText.trim());
          }
          if (rowData.length > 0) tableRows.push(rowData);
        }
        if (tableRows.length > 0) {
          elements.push({ type: 'table', rows: tableRows });
        }
      }
    }

    if (onProgress) onProgress(70, 'Đang kết xuất tệp PDF sắc nét...');

    // Render pages onto High-DPI Canvas (A4: 1240 x 1754 at 150 DPI)
    const PAGE_W = 1240;
    const PAGE_H = 1754;
    const MARGIN = 90;
    const USABLE_W = PAGE_W - (MARGIN * 2);

    const pages = [];
    let currentCanvas = document.createElement('canvas');
    currentCanvas.width = PAGE_W;
    currentCanvas.height = PAGE_H;
    let ctx = currentCanvas.getContext('2d');
    
    // Fill white page background
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

    for (const item of elements) {
      if (item.type === 'p') {
        if (!item.text.trim()) {
          curY += 16;
          continue;
        }

        const isH = item.isH1;
        const fontSize = isH ? 30 : 20;
        const lineHeight = isH ? 42 : 30;
        ctx.font = `${isH || item.bold ? 'bold' : 'normal'} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
        ctx.fillStyle = isH ? '#0f172a' : '#1e293b';

        // Word wrap
        const words = item.text.split(' ');
        let currentLine = '';

        for (const w of words) {
          const testLine = currentLine ? `${currentLine} ${w}` : w;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > USABLE_W && currentLine) {
            if (curY + lineHeight > PAGE_H - MARGIN) newPage();
            ctx.fillText(currentLine, MARGIN, curY);
            curY += lineHeight;
            currentLine = w;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) {
          if (curY + lineHeight > PAGE_H - MARGIN) newPage();
          ctx.fillText(currentLine, MARGIN, curY);
          curY += lineHeight + 8;
        }
      } else if (item.type === 'table') {
        const rows = item.rows;
        const colCount = Math.max(...rows.map(r => r.length), 1);
        const colW = USABLE_W / colCount;
        const rowH = 38;

        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          if (curY + rowH > PAGE_H - MARGIN) newPage();
          const rowData = rows[rIdx];
          const isHead = (rIdx === 0);

          for (let cIdx = 0; cIdx < colCount; cIdx++) {
            const cellX = MARGIN + (cIdx * colW);
            const val = rowData[cIdx] || '';

            ctx.fillStyle = isHead ? '#f1f5f9' : (rIdx % 2 === 0 ? '#f8fafc' : '#ffffff');
            ctx.fillRect(cellX, curY, colW, rowH);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.strokeRect(cellX, curY, colW, rowH);

            ctx.font = `${isHead ? 'bold' : 'normal'} 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
            ctx.fillStyle = '#0f172a';
            ctx.fillText(val.substring(0, 35), cellX + 10, curY + 24);
          }
          curY += rowH;
        }
        curY += 16;
      }
    }
    pages.push(currentCanvas);

    if (onProgress) onProgress(88, 'Đang đóng gói file PDF hoàn chỉnh...');

    // Embed canvases into PDF-Lib
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const pCanvas = pages[pIdx];
      const imgDataUrl = pCanvas.toDataURL('image/jpeg', 0.95);
      const imgBytes = await fetch(imgDataUrl).then(r => r.arrayBuffer());
      const embeddedJpg = await pdfDoc.embedJpg(imgBytes);

      const pdfPage = pdfDoc.addPage([595.28, 841.89]);
      pdfPage.drawImage(embeddedJpg, {
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89
      });
    }

    if (onProgress) onProgress(100, 'Hoàn thành!');
    const pdfBytes = await pdfDoc.save();
    const stem = file.name.replace(/\.[^/.]+$/, "");
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${stem}.pdf`
    };
  }

  // 2. PDF TO WORD CONVERSION
  async convertPdfToWord(file, onProgress) {
    if (onProgress) onProgress(15, 'Đang mở tệp PDF...');
    const arrayBuffer = await file.arrayBuffer();

    if (this.isServerOnline) {
      if (onProgress) onProgress(45, 'Đang phân tích cấu trúc văn bản qua Desktop Engine...');
      try {
        const b64 = this._arrayBufferToBase64(arrayBuffer);
        const res = await fetch(`${this.serverUrl}/api/convert/pdf-to-word`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_base64: b64, filename: file.name })
        });
        if (res.ok) {
          const json = await res.json();
          if (onProgress) onProgress(100, 'Hoàn thành!');
          return {
            blob: this._base64ToBlob(json.data_base64, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
            filename: json.filename
          };
        }
      } catch (err) {
        console.warn('Server error, falling back to client conversion:', err);
      }
    }

    // Client-side PDF to Word conversion using pdfjs-dist & docx.iife.js
    if (onProgress) onProgress(40, 'Đang trích xuất văn bản và layout...');
    
    let extractedPages = [];
    if (window.pdfjsLib) {
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      
      for (let pIdx = 1; pIdx <= numPages; pIdx++) {
        if (onProgress) onProgress(40 + Math.floor((pIdx / numPages) * 35), `Trích xuất trang ${pIdx}/${numPages}...`);
        const page = await pdf.getPage(pIdx);
        const textContent = await page.getTextContent();
        
        const lineMap = new Map();
        for (const item of textContent.items) {
          const y = Math.round(item.transform[5]);
          if (!lineMap.has(y)) lineMap.set(y, []);
          lineMap.get(y).push(item);
        }

        const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
        const pageLines = [];

        for (const y of sortedY) {
          const items = lineMap.get(y);
          items.sort((a, b) => a.transform[4] - b.transform[4]);
          const lineStr = items.map(it => it.str).join(' ').trim();
          if (lineStr) pageLines.push(lineStr);
        }
        extractedPages.push(pageLines);
      }
    } else {
      throw new Error('PDF.js library is required for client PDF reading');
    }

    if (onProgress) onProgress(85, 'Đang tạo tệp Word (.docx)...');
    
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;
    const docChildren = [];

    for (let pIdx = 0; pIdx < extractedPages.length; pIdx++) {
      const lines = extractedPages[pIdx];
      for (const line of lines) {
        if (line.length < 50 && (line === line.toUpperCase() || line.endsWith(':'))) {
          docChildren.push(new Paragraph({
            text: line,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }));
        } else {
          docChildren.push(new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 120 }
          }));
        }
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: docChildren.length > 0 ? docChildren : [new Paragraph("Tài liệu trống")]
      }]
    });

    const docxBlob = await Packer.toBlob(doc);
    if (onProgress) onProgress(100, 'Hoàn thành!');
    const stem = file.name.replace(/\.[^/.]+$/, "");
    return {
      blob: docxBlob,
      filename: `${stem}.docx`
    };
  }

  // 3. PDF TO EXCEL CONVERSION
  async convertPdfToExcel(file, onProgress) {
    if (onProgress) onProgress(15, 'Đang mở tệp PDF...');
    const arrayBuffer = await file.arrayBuffer();

    if (this.isServerOnline) {
      if (onProgress) onProgress(45, 'Đang nhận diện bảng biểu qua Desktop Engine...');
      try {
        const b64 = this._arrayBufferToBase64(arrayBuffer);
        const res = await fetch(`${this.serverUrl}/api/convert/pdf-to-excel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_base64: b64, filename: file.name })
        });
        if (res.ok) {
          const json = await res.json();
          if (onProgress) onProgress(100, 'Hoàn thành!');
          return {
            blob: this._base64ToBlob(json.data_base64, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
            filename: json.filename
          };
        }
      } catch (err) {
        console.warn('Server error, falling back to client conversion:', err);
      }
    }

    if (onProgress) onProgress(40, 'Đang trích xuất dữ liệu dạng bảng...');
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const sheets = [];

    for (let pIdx = 1; pIdx <= numPages; pIdx++) {
      if (onProgress) onProgress(40 + Math.floor((pIdx / numPages) * 35), `Phân tích trang ${pIdx}/${numPages}...`);
      const page = await pdf.getPage(pIdx);
      const textContent = await page.getTextContent();
      
      const lineMap = new Map();
      for (const item of textContent.items) {
        const y = Math.round(item.transform[5]);
        if (!lineMap.has(y)) lineMap.set(y, []);
        lineMap.get(y).push(item);
      }

      const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
      const grid = [];

      for (const y of sortedY) {
        const items = lineMap.get(y);
        items.sort((a, b) => a.transform[4] - b.transform[4]);
        
        const rowCells = [];
        let currCell = '';
        let lastX = null;

        for (const it of items) {
          const x = it.transform[4];
          if (lastX !== null && (x - lastX > 40)) {
            rowCells.push(currCell.trim());
            currCell = it.str;
          } else {
            currCell += (currCell ? ' ' : '') + it.str;
          }
          lastX = x + (it.width || 20);
        }
        if (currCell.trim()) rowCells.push(currCell.trim());
        if (rowCells.length > 0) grid.push(rowCells);
      }

      sheets.push({
        name: `Trang_${pIdx}`,
        data: grid.length > 0 ? grid : [['(Không có dữ liệu)']]
      });
    }

    if (onProgress) onProgress(85, 'Đang đóng gói sổ tính Excel (.xlsx)...');
    const xlsxBlob = await window.excelEngine.createXlsxBlob(sheets);
    if (onProgress) onProgress(100, 'Hoàn thành!');
    const stem = file.name.replace(/\.[^/.]+$/, "");
    return {
      blob: xlsxBlob,
      filename: `${stem}.xlsx`
    };
  }

  // 4. EXCEL TO PDF CONVERSION
  async convertExcelToPdf(file, onProgress) {
    if (onProgress) onProgress(20, 'Đang đọc sổ tính Excel...');
    const arrayBuffer = await file.arrayBuffer();

    if (this.isServerOnline) {
      if (onProgress) onProgress(50, 'Đang kết xuất PDF qua Desktop Engine...');
      try {
        const b64 = this._arrayBufferToBase64(arrayBuffer);
        const res = await fetch(`${this.serverUrl}/api/convert/excel-to-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_base64: b64, filename: file.name })
        });
        if (res.ok) {
          const json = await res.json();
          if (onProgress) onProgress(100, 'Hoàn thành!');
          return {
            blob: this._base64ToBlob(json.data_base64, 'application/pdf'),
            filename: json.filename
          };
        }
      } catch (err) {}
    }

    // Client-side fallback using Canvas high-DPI rendering
    const grid = await window.excelEngine.parseXlsx(arrayBuffer);
    const canvas = document.createElement('canvas');
    canvas.width = 1754; // A4 Landscape
    canvas.height = 1240;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1754, 1240);

    const margin = 60;
    const maxCols = Math.min(Math.max(...grid.map(r => r.length), 1), 8);
    const colW = (1754 - margin * 2) / maxCols;
    const rowH = 40;
    let curY = margin;

    for (let rIdx = 0; rIdx < grid.length && curY < 1240 - margin; rIdx++) {
      const row = grid[rIdx];
      const isHeader = (rIdx === 0);

      for (let cIdx = 0; cIdx < maxCols; cIdx++) {
        const x = margin + (cIdx * colW);
        const val = String(row[cIdx] || '');

        ctx.fillStyle = isHeader ? '#1e293b' : (rIdx % 2 === 0 ? '#f8fafc' : '#ffffff');
        ctx.fillRect(x, curY, colW, rowH);
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(x, curY, colW, rowH);

        ctx.font = `${isHeader ? 'bold' : 'normal'} 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
        ctx.fillStyle = isHeader ? '#ffffff' : '#0f172a';
        ctx.fillText(val.substring(0, 24), x + 10, curY + 26);
      }
      curY += rowH;
    }

    const pdfDoc = await PDFLib.PDFDocument.create();
    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const imgBytes = await fetch(imgDataUrl).then(r => r.arrayBuffer());
    const embeddedJpg = await pdfDoc.embedJpg(imgBytes);
    const page = pdfDoc.addPage([841.89, 595.28]);
    page.drawImage(embeddedJpg, { x: 0, y: 0, width: 841.89, height: 595.28 });

    const pdfBytes = await pdfDoc.save();
    if (onProgress) onProgress(100, 'Hoàn thành!');
    const stem = file.name.replace(/\.[^/.]+$/, "");
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${stem}.pdf`
    };
  }

  // 5. IMAGE TO PDF
  async convertImageToPdf(file, onProgress) {
    if (onProgress) onProgress(30, 'Đang nạp hình ảnh...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.create();

    let image;
    if (file.type.includes('png')) {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      image = await pdfDoc.embedJpg(arrayBuffer);
    }

    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });

    if (onProgress) onProgress(100, 'Hoàn thành!');
    const pdfBytes = await pdfDoc.save();
    const stem = file.name.replace(/\.[^/.]+$/, "");
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${stem}.pdf`
    };
  }
}

window.converter = new ConverterClient();
