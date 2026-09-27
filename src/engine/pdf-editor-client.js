// Client-side PDF Editor Engine powered by PDF-Lib & Canvas
// Runs 100% in browser on PC, iOS Safari, Android Chrome with zero server dependency
class PdfEditorClient {
  constructor() {
    this.pdfBytes = null;
    this.pdfDoc = null;
    this.currentPage = 0;
    this.totalPages = 0;
    this.pagesData = []; // { index, rotation, canvasUrl }
    this.drawings = []; // array of { page, type: 'text'|'image'|'freehand', ... }
  }

  async loadPdf(arrayBuffer) {
    this.pdfBytes = new Uint8Array(arrayBuffer);
    if (typeof PDFLib === 'undefined') {
      throw new Error('PDFLib library not loaded');
    }
    this.pdfDoc = await PDFLib.PDFDocument.load(this.pdfBytes);
    this.totalPages = this.pdfDoc.getPageCount();
    this.currentPage = 0;
    this.drawings = [];
    return this.totalPages;
  }

  async getPageThumbnails(canvasRenderer) {
    // Generate page index list
    const list = [];
    for (let i = 0; i < this.totalPages; i++) {
      const page = this.pdfDoc.getPage(i);
      list.push({
        index: i,
        width: page.getWidth(),
        height: page.getHeight(),
        rotation: page.getRotation().angle
      });
    }
    this.pagesData = list;
    return list;
  }

  async rotatePage(pageIndex, degrees = 90) {
    if (!this.pdfDoc) return;
    const page = this.pdfDoc.getPage(pageIndex);
    const curr = page.getRotation().angle;
    page.setRotation(PDFLib.degrees((curr + degrees) % 360));
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
      throw new Error('Không thể xóa toàn bộ trang. File PDF phải có ít nhất 1 trang.');
    }
    this.pdfDoc.removePage(pageIndex);
    this.totalPages = this.pdfDoc.getPageCount();
    if (this.currentPage >= this.totalPages) {
      this.currentPage = this.totalPages - 1;
    }
    return this.totalPages;
  }

  async movePage(fromIndex, toIndex) {
    if (!this.pdfDoc) return;
    if (toIndex < 0 || toIndex >= this.pdfDoc.getPageCount()) return;
    
    // PDF-Lib allows copying pages
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

  async addWatermarkText(text, options = {}) {
    if (!this.pdfDoc) return;
    const {
      opacity = 0.3,
      angle = 45,
      color = '#ef4444',
      size = 40
    } = options;

    const font = await this.pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    
    // Parse hex color
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;

    const pages = this.pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, size);
      const textHeight = font.heightAtSize(size);

      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size: size,
        font: font,
        color: PDFLib.rgb(r, g, b),
        opacity: opacity,
        rotate: PDFLib.degrees(angle),
      });
    }
  }

  async addTextToPage(pageIndex, text, x, y, options = {}) {
    if (!this.pdfDoc) return;
    const {
      size = 14,
      color = '#000000',
      bold = false
    } = options;

    const page = this.pdfDoc.getPage(pageIndex);
    const fontName = bold ? PDFLib.StandardFonts.HelveticaBold : PDFLib.StandardFonts.Helvetica;
    const font = await this.pdfDoc.embedFont(fontName);

    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;

    page.drawText(text, {
      x: x,
      y: y,
      size: size,
      font: font,
      color: PDFLib.rgb(r, g, b),
    });
  }

  async addSignature(pageIndex, pngDataUrl, x, y, width = 140, height = 60) {
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

  async mergeWith(otherPdfArrayBuffers) {
    if (!this.pdfDoc) {
      this.pdfDoc = await PDFLib.PDFDocument.create();
    }
    for (const buf of otherPdfArrayBuffers) {
      const docToMerge = await PDFLib.PDFDocument.load(buf);
      const copied = await this.pdfDoc.copyPages(docToMerge, docToMerge.getPageIndices());
      copied.forEach(p => this.pdfDoc.addPage(p));
    }
    this.totalPages = this.pdfDoc.getPageCount();
  }

  async splitPages(pageIndices) {
    if (!this.pdfDoc) return null;
    const newDoc = await PDFLib.PDFDocument.create();
    const copied = await newDoc.copyPages(this.pdfDoc, pageIndices);
    copied.forEach(p => newDoc.addPage(p));
    return await newDoc.save();
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
}

window.pdfEditorClient = new PdfEditorClient();
