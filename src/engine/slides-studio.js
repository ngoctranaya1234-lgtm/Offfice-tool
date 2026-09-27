// Presentation / Slides Studio - Presentation Creator with Fullscreen Slideshow & PPTX/PDF Export
class SlidesStudio {
  escapeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  constructor() {
    this.slides = [];
    this.currentSlideIndex = 0;
    this.canvasEl = null;
    this.thumbListEl = null;
  }

  init(canvasId, thumbListId) {
    this.canvasEl = document.getElementById(canvasId);
    this.thumbListEl = document.getElementById(thumbListId);

    // Start with a clean blank presentation slide (no demo/mock content)
    this.slides = [
      {
        id: 's1',
        theme: 'dark-cyber',
        bg: '#0f172a',
        elements: []
      }
    ];

    this.currentSlideIndex = 0;
    this.render();
  }

  getCurrentSlide() {
    return this.slides[this.currentSlideIndex];
  }

  addSlide() {
    if (window.sound) window.sound.click();
    const newSlide = {
      id: 's_' + Date.now(),
      theme: 'dark-cyber',
      bg: '#0f172a',
      elements: []
    };
    this.slides.push(newSlide);
    this.currentSlideIndex = this.slides.length - 1;
    this.render();
  }

  duplicateCurrentSlide() {
    if (window.sound) window.sound.click();
    const cur = this.getCurrentSlide();
    if (!cur) return;
    const cloned = JSON.parse(JSON.stringify(cur));
    cloned.id = 's_' + Date.now();
    this.slides.splice(this.currentSlideIndex + 1, 0, cloned);
    this.currentSlideIndex++;
    this.render();
  }

  deleteCurrentSlide() {
    if (this.slides.length <= 1) return;
    if (window.sound) window.sound.click();
    this.slides.splice(this.currentSlideIndex, 1);
    if (this.currentSlideIndex >= this.slides.length) {
      this.currentSlideIndex = this.slides.length - 1;
    }
    this.render();
  }

  addTextElement(type = 'text') {
    if (window.sound) window.sound.click();
    const slide = this.getCurrentSlide();
    if (!slide) return;

    const isLightBg = this._isLightColor(slide.bg);
    const textColor = isLightBg ? '#0f172a' : '#f8fafc';
    const subColor = isLightBg ? '#475569' : '#cbd5e1';

    const count = slide.elements.length;
    const offset = 60 + (count * 45);

    if (type === 'heading') {
      slide.elements.push({
        type: 'heading',
        text: 'Tiêu Đề Trình Chiếu',
        x: 60,
        y: Math.min(offset, 320),
        size: 32,
        color: textColor,
        bold: true
      });
    } else if (type === 'badge') {
      slide.elements.push({
        type: 'badge',
        text: 'CHỦ ĐỀ CHÍNH',
        x: 60,
        y: Math.min(offset, 320),
        size: 13,
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.18)'
      });
    } else {
      slide.elements.push({
        type: 'text',
        text: 'Nội dung chi tiết trình bày các luận điểm hoặc phân tích...',
        x: 60,
        y: Math.min(offset, 350),
        size: 18,
        color: subColor
      });
    }
    this.renderCanvas();
    this.renderThumbnails();
  }

  async handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      alert('Chọn ảnh PNG, JPG hoặc WebP dưới 5 MB.');
      e.target.value = '';
      return;
    }
    if (window.sound) window.sound.click();

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const maxW = 320;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        const slide = this.getCurrentSlide();
        if (slide) {
          slide.elements.push({
            type: 'image',
            src: dataUrl,
            x: 480,
            y: 80,
            width: w,
            height: h
          });
          this.renderCanvas();
          this.renderThumbnails();
          document.dispatchEvent(new CustomEvent('workspace:dirty', { detail: { studio: 'slides' } }));
        }
      };
      img.onerror = () => alert('Không thể đọc ảnh. Hãy chọn tệp ảnh khác.');
      img.src = dataUrl;
    };
    reader.onerror = () => alert('Không thể mở tệp ảnh. Hãy thử lại.');
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  setTheme(bgColor) {
    if (window.sound) window.sound.click();
    const slide = this.getCurrentSlide();
    if (slide) {
      slide.bg = bgColor;
      // Adjust text colors if switching between dark and light
      const isLight = this._isLightColor(bgColor);
      slide.elements.forEach(el => {
        if (el.type === 'heading' || el.type === 'text') {
          if (isLight && (el.color === '#f8fafc' || el.color === '#cbd5e1')) {
            el.color = (el.type === 'heading') ? '#0f172a' : '#475569';
          } else if (!isLight && (el.color === '#0f172a' || el.color === '#475569')) {
            el.color = (el.type === 'heading') ? '#f8fafc' : '#cbd5e1';
          }
        }
      });
      this.render();
    }
  }

  _isLightColor(hex) {
    if (!hex || hex === '#ffffff') return true;
    if (hex === '#0f172a' || hex === '#064e3b' || hex === '#1e1b4b' || hex === '#701a75') return false;
    return false;
  }

  render() {
    this.renderThumbnails();
    this.renderCanvas();
  }

  renderThumbnails() {
    if (!this.thumbListEl) return;
    let html = '';
    this.slides.forEach((s, idx) => {
      const active = (idx === this.currentSlideIndex);
      const title = s.elements.find(e => e.type === 'heading')?.text || `Slide ${idx + 1}`;
      const isLight = this._isLightColor(s.bg);
      html += `
        <div class="slide-thumb ${active ? 'thumb-active' : ''}" role="button" tabindex="0" aria-label="Mở slide ${idx + 1}" onclick="slidesStudio.selectSlide(${idx})" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); slidesStudio.selectSlide(${idx}); }">
          <div class="thumb-header">
            <span>Slide ${idx + 1}</span>
          </div>
          <div class="thumb-preview" style="background:${s.bg}">
            <div class="thumb-title-text" style="color: ${isLight ? '#0f172a' : '#f8fafc'}">${this.escapeText(title)}</div>
          </div>
        </div>
      `;
    });
    this.thumbListEl.innerHTML = html;
  }

  selectSlide(index) {
    if (window.sound) window.sound.tabSwitch();
    this.currentSlideIndex = index;
    this.render();
  }

  renderCanvas() {
    if (!this.canvasEl) return;
    const slide = this.getCurrentSlide();
    if (!slide) return;

    this.canvasEl.style.backgroundColor = slide.bg;

    if (slide.elements.length === 0) {
      this.canvasEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); opacity: 0.6; pointer-events: none; user-select: none;">
          <p style="font-size: 1.05rem; margin-bottom: 0.4rem; font-weight: 500;">Trang trình chiếu trống</p>
          <span style="font-size: 0.8rem;">Bấm "+ Tiêu Đề", "+ Đoạn Văn", "+ Nhãn Nổi Bật" hoặc "+ Chèn Ảnh" ở trên để bắt đầu</span>
        </div>
      `;
      return;
    }

    let html = '';
    slide.elements.forEach((el, idx) => {
      if (el.type === 'image') {
        html += `
          <div class="slide-element slide-image-wrap" data-idx="${idx}" style="position: absolute; left: ${el.x}px; top: ${el.y}px;">
            <img src="${el.src}" style="width: ${el.width}px; height: auto; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.35); pointer-events: none;" />
            <button class="slide-el-del" onclick="event.stopPropagation(); window.slidesStudio.removeElement(${idx})" title="Xóa đối tượng">×</button>
          </div>
        `;
      } else {
        let extra = '';
        if (el.type === 'badge') {
          extra = `background: ${el.bg}; padding: 4px 14px; border-radius: 999px; display: inline-block; font-weight: 600; letter-spacing: 0.05em;`;
        }
        html += `
          <div class="slide-element" 
               data-idx="${idx}" 
               style="position: absolute; left: ${el.x}px; top: ${el.y}px; color: ${el.color}; font-size: ${el.size}px; font-weight: ${el.bold ? 'bold' : 'normal'}; line-height: 1.4; ${extra}"
               contenteditable="true">
            ${this.escapeText(el.text)}
          </div>
        `;
      }
    });

    this.canvasEl.innerHTML = html;

    // Attach text update listeners
    const elNodes = this.canvasEl.querySelectorAll('.slide-element[contenteditable="true"]');
    elNodes.forEach(node => {
      node.addEventListener('blur', () => {
        const idx = parseInt(node.getAttribute('data-idx'), 10);
        if (slide.elements[idx]) {
          slide.elements[idx].text = node.innerText.trim();
          this.renderThumbnails();
          document.dispatchEvent(new CustomEvent('workspace:dirty', { detail: { studio: 'slides' } }));
        }
      });
    });
  }

  removeElement(idx) {
    if (window.sound) window.sound.click();
    const slide = this.getCurrentSlide();
    if (slide && slide.elements[idx]) {
      slide.elements.splice(idx, 1);
      this.renderCanvas();
      this.renderThumbnails();
    }
  }

  // Fullscreen Presentation Mode
  startPresentation() {
    if (window.sound) window.sound.success();
    const modal = document.getElementById('presentation-modal');
    const container = document.getElementById('presentation-content');
    if (!modal || !container) return;

    modal.classList.remove('hidden');
    this._renderPresentationSlide(this.currentSlideIndex);

    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        if (this.currentSlideIndex < this.slides.length - 1) {
          this.currentSlideIndex++;
          this._renderPresentationSlide(this.currentSlideIndex);
        }
      } else if (e.key === 'ArrowLeft') {
        if (this.currentSlideIndex > 0) {
          this.currentSlideIndex--;
          this._renderPresentationSlide(this.currentSlideIndex);
        }
      } else if (e.key === 'Escape') {
        this.exitPresentation();
        window.removeEventListener('keydown', onKey);
      }
    };
    window.addEventListener('keydown', onKey);
    this._presentationKeyHandler = onKey;
  }

  _renderPresentationSlide(idx) {
    const container = document.getElementById('presentation-content');
    const indicator = document.getElementById('presentation-indicator');
    const slide = this.slides[idx];
    if (!container || !slide) return;

    container.style.backgroundColor = slide.bg;
    let html = '';
    slide.elements.forEach(el => {
      if (el.type === 'image') {
        html += `
          <div style="position: absolute; left: ${el.x * 1.5}px; top: ${el.y * 1.5}px;">
            <img src="${el.src}" style="width: ${el.width * 1.5}px; height: auto; border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.5);" />
          </div>
        `;
      } else {
        let extra = '';
        if (el.type === 'badge') {
          extra = `background: ${el.bg}; padding: 6px 20px; border-radius: 999px; display: inline-block; font-weight: 600;`;
        }
        html += `
          <div style="position: absolute; left: ${el.x * 1.5}px; top: ${el.y * 1.5}px; color: ${el.color}; font-size: ${el.size * 1.4}px; font-weight: ${el.bold ? 'bold' : 'normal'}; line-height: 1.4; ${extra}">
            ${this.escapeText(el.text)}
          </div>
        `;
      }
    });
    container.innerHTML = html;
    if (indicator) {
      indicator.innerText = `${idx + 1} / ${this.slides.length}`;
    }
  }

  exitPresentation() {
    const modal = document.getElementById('presentation-modal');
    if (modal) modal.classList.add('hidden');
    if (this._presentationKeyHandler) {
      window.removeEventListener('keydown', this._presentationKeyHandler);
    }
    this.render();
  }

  // Export to high-resolution A4/16:9 PDF
  async exportPdf(filename = 'Thuyet_trinh.pdf') {
    if (window.sound) window.sound.success();
    if (typeof PDFLib === 'undefined') {
      alert('PDF-Lib library not loaded');
      return;
    }

    const pdfDoc = await PDFLib.PDFDocument.create();
    const W = 1280;
    const H = 720;

    for (let i = 0; i < this.slides.length; i++) {
      const slide = this.slides[i];
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = slide.bg;
      ctx.fillRect(0, 0, W, H);

      // Elements
      for (const el of slide.elements) {
        const scale = 1.45;
        const x = el.x * scale;
        const y = el.y * scale;

        if (el.type === 'image') {
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, x, y, el.width * scale, (el.height || el.width) * scale);
              resolve();
            };
            img.onerror = resolve;
            img.src = el.src;
          });
        } else if (el.type === 'badge') {
          ctx.font = `600 ${Math.round(el.size * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          const textW = ctx.measureText(el.text).width;
          const padX = 18;
          const padY = 8;
          const badgeH = (el.size * scale) + padY * 2;

          ctx.fillStyle = el.bg || 'rgba(56, 189, 248, 0.2)';
          ctx.beginPath();
          ctx.roundRect(x, y - (el.size * scale), textW + padX * 2, badgeH, 999);
          ctx.fill();

          ctx.fillStyle = el.color;
          ctx.fillText(el.text, x + padX, y + padY * 0.5);
        } else {
          ctx.font = `${el.bold ? 'bold ' : ''}${Math.round(el.size * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.fillStyle = el.color;
          ctx.fillText(el.text, x, y + (el.size * scale) * 0.85);
        }
      }

      // Convert canvas to JPG
      const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const imgBytes = await fetch(imgDataUrl).then(r => r.arrayBuffer());
      const embeddedJpg = await pdfDoc.embedJpg(imgBytes);

      // 16:9 standard PDF slide page: 960 x 540 pt
      const page = pdfDoc.addPage([960, 540]);
      page.drawImage(embeddedJpg, { x: 0, y: 0, width: 960, height: 540 });
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

  // Export to standard Microsoft PowerPoint .pptx
  async exportPptx(filename = 'Thuyet_trinh.pptx') {
    if (window.sound) window.sound.success();
    if (typeof PptxGenJS === 'undefined') {
      alert('PptxGenJS library not loaded');
      return;
    }
    const pptx = new PptxGenJS();

    this.slides.forEach(s => {
      const slide = pptx.addSlide();
      slide.background = { color: s.bg.replace('#', '') };

      s.elements.forEach(el => {
        if (el.type === 'image') {
          slide.addImage({
            data: el.src,
            x: el.x / 96,
            y: el.y / 96,
            w: el.width / 96,
            h: (el.height || el.width) / 96
          });
        } else {
          slide.addText(el.text, {
            x: el.x / 96,
            y: el.y / 96,
            fontSize: el.size,
            color: el.color.replace('#', ''),
            bold: !!el.bold
          });
        }
      });
    });

    await pptx.writeFile({ fileName: filename });
  }
}

window.slidesStudio = new SlidesStudio();
