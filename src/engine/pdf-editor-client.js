// Professional High-Performance PDF Suite Client Engine
// 100% Vietnamese Unicode Compliant, Zero WinAnsi Encoding Errors
class PdfEditorClient {
  constructor() {
    this.pdfBytes = null;
    this.pdfDoc = null;
    this.currentPage = 0;
    this.totalPages = 0;
    this.pagesData = [];
    this.activeTool = 'view'; // 'view' | 'pen' | 'highlighter' | 'whiteout' | 'text'
    this.zoomScale = 1.2;
  }

  async loadPdf(arrayBuffer) {
    this.pdfBytes = new Uint8Array(arrayBuffer);
    if (typeof PDFLib === 'undefined') {
      throw new Error('PDFLib library not loaded');
    }
    this.pdfDoc = await PDFLib.PDFDocument.load(this.pdfBytes, { ignoreEncryption: true });
    this.totalPages = this.pdfDoc.getPageCount();
    this.currentPage = 0;
    return this.totalPages;
  }

  // 1. VIETNAMESE-SAFE WATERMARK ENGINE
  async addWatermarkText(text, options = {}) {
    if (!this.pdfDoc) return;
    const {
      opacity = 0.3,
      angle = 45,
      color = '#ef4444',
      size = 48
    } = options;

    // Create high-resolution Canvas for the watermark text (100% Unicode support)
    const wmCanvas = document.createElement('canvas');
    wmCanvas.width = 1200;
    wmCanvas.height = 400;
    const ctx = wmCanvas.getContext('2d');

    ctx.clearRect(0, 0, wmCanvas.width, wmCanvas.height);
    ctx.font = `bold ${size * 2}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, wmCanvas.width / 2, wmCanvas.height / 2);

    const dataUrl = wmCanvas.toDataURL('image/png');
    const pngBytes = await fetch(dataUrl).then(r => r.arrayBuffer());
    const pngImage = await this.pdfDoc.embedPng(pngBytes);

    const pages = this.pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      const drawWidth = width * 0.9;
      const drawHeight = (drawWidth / wmCanvas.width) * wmCanvas.height;

      page.drawImage(pngImage, {
        x: (width - drawWidth) / 2,
        y: (height - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight,
        opacity: opacity,
        rotate: PDFLib.degrees(angle),
      });
    }
  }

  // 2. IMAGE WATERMARK / LOGO STAMP
  async addWatermarkImage(imageArrayBuffer, options = {}) {
    if (!this.pdfDoc) return;
    const { opacity = 0.35, width = 200, height = 200, angle = 0 } = options;
    
    let embeddedImg;
    try {
      embeddedImg = await this.pdfDoc.embedPng(imageArrayBuffer);
    } catch (e) {
      embeddedImg = await this.pdfDoc.embedJpg(imageArrayBuffer);
    }

    const pages = this.pdfDoc.getPages();
    for (const page of pages) {
      const { width: pW, height: pH } = page.getSize();
      page.drawImage(embeddedImg, {
        x: (pW - width) / 2,
        y: (pH - height) / 2,
        width: width,
        height: height,
        opacity: opacity,
        rotate: PDFLib.degrees(angle)
      });
    }
  }

  // 3. WHITEOUT & OVERLAY TEXT (Ghi đè văn bản)
  async addWhiteoutAndText(pageIndex, x, y, width, height, newText, options = {}) {
    if (!this.pdfDoc) return;
    const { fontSize = 14, color = '#0f172a', bold = true } = options;
    const page = this.pdfDoc.getPage(pageIndex);

    // 1. Draw opaque white rectangle to hide old text
    page.drawRectangle({
      x: x,
      y: y,
      width: width,
      height: height,
      color: PDFLib.rgb(1, 1, 1),
      borderColor: PDFLib.rgb(1, 1, 1),
      borderWidth: 0
    });

    // 2. Render replacement text via Canvas PNG to support full Vietnamese
    const tCanvas = document.createElement('canvas');
    tCanvas.width = width * 2;
    tCanvas.height = height * 2;
    const ctx = tCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tCanvas.width, tCanvas.height);

    ctx.font = `${bold ? 'bold' : 'normal'} ${fontSize * 2}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.fillText(newText, 4, tCanvas.height / 2);

    const imgBytes = await fetch(tCanvas.toDataURL('image/png')).then(r => r.arrayBuffer());
    const textPng = await this.pdfDoc.embedPng(imgBytes);

    page.drawImage(textPng, {
      x: x,
      y: y,
      width: width,
      height: height
    });
  }

  // 4. DRAWN / HIGHLIGHTER OVERLAY
  async addDrawnOverlay(pageIndex, pngDataUrl) {
    if (!this.pdfDoc) return;
    const page = this.pdfDoc.getPage(pageIndex);
    const { width, height } = page.getSize();
    const pngImage = await this.pdfDoc.embedPng(pngDataUrl);

    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
  }

  // 5. SIGNATURE STAMP
  async addSignature(pageIndex, pngDataUrl, x, y, width = 160, height = 70) {
    if (!this.pdfDoc) return;
    const page = this.pdfDoc.getPage(pageIndex);
    const pngImage = await this.pdfDoc.embedPng(pngDataUrl);

    page.drawImage(pngImage, {
      x: x,
      y: y,
      width: width,
      height: height,
    });
  }

  // 6. PAGE OPERATIONS
  async rotatePage(pageIndex, degrees = 90) {
    if (!this.pdfDoc) return;
    const page = this.pdfDoc.getPage(pageIndex);
    const curr = page.getRotation().angle;
    page.setRotation(PDFLib.degrees((curr + degrees + 360) % 360));
    return page.getRotation().angle;
  }

  async rotateAll(degrees = 90) {
    if (!this.pdfDoc) return;
    const count = this.pdfDoc.getPageCount();
    for (let i = 0; i < count; i++) {
      await this.rotatePage(i, degrees);
    }
  }

  async deletePage(pageIndex) {
    if (!this.pdfDoc || this.pdfDoc.getPageCount() <= 1) {
      throw new Error('Tài liệu PDF phải giữ ít nhất 1 trang.');
    }
    this.pdfDoc.removePage(pageIndex);
    this.totalPages = this.pdfDoc.getPageCount();
    if (this.currentPage >= this.totalPages) {
      this.currentPage = this.totalPages - 1;
    }
    return this.totalPages;
  }

  async duplicatePage(pageIndex) {
    if (!this.pdfDoc) return;
    const [copiedPage] = await this.pdfDoc.copyPages(this.pdfDoc, [pageIndex]);
    this.pdfDoc.insertPage(pageIndex + 1, copiedPage);
    this.totalPages = this.pdfDoc.getPageCount();
    return this.totalPages;
  }

  async insertBlankPage(afterIndex) {
    if (!this.pdfDoc) return;
    const page = this.pdfDoc.insertPage(afterIndex + 1, [595.28, 841.89]); // A4
    this.totalPages = this.pdfDoc.getPageCount();
    return this.totalPages;
  }

  async movePage(fromIndex, toIndex) {
    if (!this.pdfDoc) return;
    if (toIndex < 0 || toIndex >= this.pdfDoc.getPageCount()) return;

    const tempDoc = await PDFLib.PDFDocument.create();
    const indices = [];
    for (let i = 0; i < this.pdfDoc.getPageCount(); i++) indices.push(i);
    const [moved] = indices.splice(fromIndex, 1);
    indices.splice(toIndex, 0, moved);

    const copiedPages = await tempDoc.copyPages(this.pdfDoc, indices);
    copiedPages.forEach(p => tempDoc.addPage(p));
    this.pdfDoc = tempDoc;
    this.currentPage = toIndex;
  }

  async mergeWith(otherPdfArrayBuffers) {
    if (!this.pdfDoc) {
      this.pdfDoc = await PDFLib.PDFDocument.create();
    }
    for (const buf of otherPdfArrayBuffers) {
      const docToMerge = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
      const copied = await this.pdfDoc.copyPages(docToMerge, docToMerge.getPageIndices());
      copied.forEach(p => this.pdfDoc.addPage(p));
    }
    this.totalPages = this.pdfDoc.getPageCount();
    return this.totalPages;
  }

  async splitPages(pageIndices) {
    if (!this.pdfDoc) return null;
    const newDoc = await PDFLib.PDFDocument.create();
    const copied = await newDoc.copyPages(this.pdfDoc, pageIndices);
    copied.forEach(p => newDoc.addPage(p));
    return await newDoc.save();
  }

  // 7. DIRECT PRINT
  async printPdf() {
    const blob = await this.exportPdfBlob();
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.focus();
        iframe.contentWindow.print();
        setTimeout(() => iframe.remove(), 60000);
      }, 500);
    };
  }

  async exportPdfBytes() {
    if (!this.pdfDoc) return null;
    return await this.pdfDoc.save();
  }

  async exportPdfBlob() {
    const bytes = await this.exportPdfBytes();
    if (!bytes) return null;
    return new Blob([bytes], { type: 'application/pdf' });
  }

  // 8. BATES PAGE NUMBERING
  async addPageNumbers(format = 'Trang {page} / {total}', position = 'bottom-center') {
    if (!this.pdfDoc) return;
    const pages = this.pdfDoc.getPages();
    const total = pages.length;

    for (let i = 0; i < total; i++) {
      const page = pages[i];
      const pageNum = i + 1;
      const text = format.replace('{page}', pageNum).replace('{total}', total);
      const { width, height } = page.getSize();

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 200, 30);

      const pngBytes = await fetch(canvas.toDataURL('image/png')).then(r => r.arrayBuffer());
      const pngImg = await this.pdfDoc.embedPng(pngBytes);

      const drawW = 120;
      const drawH = (drawW / canvas.width) * canvas.height;
      let x = (width - drawW) / 2;
      let y = 20;

      if (position === 'bottom-right') {
        x = width - drawW - 30;
      } else if (position === 'bottom-left') {
        x = 30;
      }

      page.drawImage(pngImg, {
        x: x,
        y: y,
        width: drawW,
        height: drawH,
        opacity: 0.9
      });
    }
  }

  // 9. PRESET OFFICIAL STAMPS
  async addPresetStamp(stampType, pageIndex = this.currentPage) {
    if (!this.pdfDoc) return;
    const page = this.pdfDoc.getPage(pageIndex);
    const { width, height } = page.getSize();

    const stampConfigs = {
      approved: {
        text: 'ĐÃ DUYỆT',
        sub: 'OFFFICE APPROVED',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.08)'
      },
      confidential: {
        text: 'BẢO MẬT',
        sub: 'CONFIDENTIAL',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.08)'
      },
      draft: {
        text: 'BẢN NHÁP',
        sub: 'DRAFT COPY',
        color: '#64748b',
        bg: 'rgba(100, 116, 139, 0.08)'
      },
      paid: {
        text: 'ĐÃ THANH TOÁN',
        sub: 'PAID IN FULL',
        color: '#0284c7',
        bg: 'rgba(2, 132, 199, 0.08)'
      }
    };

    const cfg = stampConfigs[stampType] || stampConfigs.approved;

    const sCanvas = document.createElement('canvas');
    sCanvas.width = 440;
    sCanvas.height = 180;
    const ctx = sCanvas.getContext('2d');

    // Outer double border
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 6;
    ctx.fillStyle = cfg.bg;
    ctx.beginPath();
    ctx.roundRect(8, 8, 424, 164, 16);
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(16, 16, 408, 148, 10);
    ctx.stroke();

    // Main stamp text
    ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = cfg.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.text, 220, 75);

    // Subtitle
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(cfg.sub, 220, 125);

    const pngBytes = await fetch(sCanvas.toDataURL('image/png')).then(r => r.arrayBuffer());
    const stampImg = await this.pdfDoc.embedPng(pngBytes);

    const sW = 160;
    const sH = (sW / sCanvas.width) * sCanvas.height;
    page.drawImage(stampImg, {
      x: width - sW - 40,
      y: height - sH - 50,
      width: sW,
      height: sH,
      opacity: 0.88,
      rotate: PDFLib.degrees(-8)
    });
  }

  // 10. CREATE BLANK A4 DOCUMENT
  async createBlankDocument() {
    this.pdfDoc = await PDFLib.PDFDocument.create();
    this.pdfDoc.addPage([595.28, 841.89]); // Standard ISO A4
    this.totalPages = 1;
    this.currentPage = 0;
    const bytes = await this.pdfDoc.save();
    this.pdfBytes = bytes;
    return bytes;
  }
}

window.pdfEditorClient = new PdfEditorClient();
