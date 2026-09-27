// Unified Document Conversion Hub - Hybrid Client & Native Server
// 100% operational on PC, iOS, Android without fake demos
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

  // 1. WORD TO PDF CONVERSION
  async convertWordToPdf(file, onProgress) {
    if (onProgress) onProgress(15, 'Đang đọc cấu trúc tệp Word...');
    const arrayBuffer = await file.arrayBuffer();

    if (this.isServerOnline) {
      if (onProgress) onProgress(45, 'Đang xử lý qua Desktop Engine...');
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
        console.warn('Server error, falling back to client conversion:', err);
      }
    }

    // Client-side Word to PDF fallback using JSZip + PDF-Lib
    if (onProgress) onProgress(40, 'Đang trích xuất nội dung văn bản...');
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXml = await zip.file('word/document.xml').async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, 'application/xml');

    const paragraphs = xmlDoc.getElementsByTagName('w:p');
    const textLines = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const runs = p.getElementsByTagName('w:r');
      let pText = '';
      let isBold = false;
      let isH1 = false;
      
      const pStyle = p.getElementsByTagName('w:pStyle')[0];
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
        textLines.push({ text: pText, bold: isBold, isH1: isH1 });
      }
    }

    if (onProgress) onProgress(70, 'Đang kết xuất tệp PDF...');
    const pdfDoc = await PDFLib.PDFDocument.create();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const margin = 45;
    let y = 841.89 - margin;
    const lineHeight = 16;
    const maxWidth = 595.28 - (margin * 2);

    for (const item of textLines) {
      if (y < margin + 40) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 841.89 - margin;
      }

      const activeFont = (item.bold || item.isH1) ? fontBold : font;
      const fontSize = item.isH1 ? 16 : 10.5;
      const currentLeading = item.isH1 ? 22 : lineHeight;

      if (!item.text.trim()) {
        y -= 8;
        continue;
      }

      // Word wrapping
      const words = item.text.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = activeFont.widthOfTextAtSize(testLine, fontSize);
        if (textWidth > maxWidth && currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y: y,
            size: fontSize,
            font: activeFont,
            color: PDFLib.rgb(0.1, 0.15, 0.2)
          });
          y -= currentLeading;
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
        page.drawText(currentLine, {
          x: margin,
          y: y,
          size: fontSize,
          font: activeFont,
          color: PDFLib.rgb(0.1, 0.15, 0.2)
        });
        y -= currentLeading + 4;
      }
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
    
    // Check if pdfjsLib is available
    let extractedPages = [];
    if (window.pdfjsLib) {
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      
      for (let pIdx = 1; pIdx <= numPages; pIdx++) {
        if (onProgress) onProgress(40 + Math.floor((pIdx / numPages) * 35), `Trích xuất trang ${pIdx}/${numPages}...`);
        const page = await pdf.getPage(pIdx);
        const textContent = await page.getTextContent();
        
        // Group items by vertical position Y
        const lineMap = new Map();
        for (const item of textContent.items) {
          const y = Math.round(item.transform[5]);
          if (!lineMap.has(y)) lineMap.set(y, []);
          lineMap.get(y).push(item);
        }

        // Sort descending Y (top of page to bottom)
        const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);
        const pageLines = [];

        for (const y of sortedY) {
          const items = lineMap.get(y);
          // Sort items by horizontal position X
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
    
    // Use docx library
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;
    const docChildren = [];

    for (let pIdx = 0; pIdx < extractedPages.length; pIdx++) {
      const lines = extractedPages[pIdx];
      for (const line of lines) {
        // Detect heading
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

    // Client-side PDF to Excel fallback
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
        
        // Group items into columns by X position spacing
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

    // Client-side fallback
    const grid = await window.excelEngine.parseXlsx(arrayBuffer);
    const pdfDoc = await PDFLib.PDFDocument.create();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([841.89, 595.28]); // A4 Landscape for tables
    const margin = 35;
    let y = 595.28 - margin;
    const cellH = 20;

    const maxCols = Math.min(Math.max(...grid.map(r => r.length), 1), 8);
    const colW = (841.89 - margin * 2) / maxCols;

    for (let rIdx = 0; rIdx < grid.length; rIdx++) {
      if (y < margin + 30) {
        page = pdfDoc.addPage([841.89, 595.28]);
        y = 595.28 - margin;
      }

      const row = grid[rIdx];
      const isHeader = (rIdx === 0);

      // Draw cell boxes
      for (let cIdx = 0; cIdx < maxCols; cIdx++) {
        const x = margin + (cIdx * colW);
        const val = String(row[cIdx] || '');

        if (isHeader) {
          page.drawRectangle({
            x: x,
            y: y - cellH,
            width: colW,
            height: cellH,
            color: PDFLib.rgb(0.08, 0.12, 0.2),
            borderColor: PDFLib.rgb(0.2, 0.25, 0.35),
            borderWidth: 0.5
          });
          page.drawText(val.substring(0, 22), {
            x: x + 6,
            y: y - 14,
            size: 9,
            font: fontBold,
            color: PDFLib.rgb(1, 1, 1)
          });
        } else {
          page.drawRectangle({
            x: x,
            y: y - cellH,
            width: colW,
            height: cellH,
            color: (rIdx % 2 === 0) ? PDFLib.rgb(0.97, 0.98, 0.99) : PDFLib.rgb(1, 1, 1),
            borderColor: PDFLib.rgb(0.85, 0.88, 0.92),
            borderWidth: 0.5
          });
          page.drawText(val.substring(0, 22), {
            x: x + 6,
            y: y - 14,
            size: 8.5,
            font: font,
            color: PDFLib.rgb(0.1, 0.15, 0.2)
          });
        }
      }
      y -= cellH;
    }

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
