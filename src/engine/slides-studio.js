// Presentation / Slides Studio - Presentation Creator with Fullscreen Slideshow & PPTX/PDF Export
class SlidesStudio {
  constructor() {
    this.slides = [];
    this.currentSlideIndex = 0;
    this.canvasEl = null;
    this.thumbListEl = null;
  }

  init(canvasId, thumbListId) {
    this.canvasEl = document.getElementById(canvasId);
    this.thumbListEl = document.getElementById(thumbListId);

    // Initial default slides
    this.slides = [
      {
        id: 's1',
        theme: 'dark-cyber',
        bg: '#0f172a',
        elements: [
          { type: 'heading', text: 'OFFFICE TOOL PRO', x: 80, y: 140, size: 36, color: '#38bdf8', bold: true },
          { type: 'subheading', text: 'Bo Cong Cu Van Phong Da Nen Tang & Sieu Toc', x: 80, y: 200, size: 20, color: '#94a3b8' },
          { type: 'badge', text: 'Chuyen Doi Word • PDF • Excel', x: 80, y: 260, size: 14, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
        ]
      },
      {
        id: 's2',
        theme: 'emerald',
        bg: '#064e3b',
        elements: [
          { type: 'heading', text: 'TINH NANG DOT PHA', x: 80, y: 100, size: 30, color: '#34d399', bold: true },
          { type: 'text', text: '• Chuyen doi 2 chieu Word sang PDF & PDF sang Word', x: 80, y: 170, size: 18, color: '#e2e8f0' },
          { type: 'text', text: '• Trich xuat bang bieu PDF thanh Excel chinh xac', x: 80, y: 220, size: 18, color: '#e2e8f0' },
          { type: 'text', text: '• Chinh sua PDF: Chu ky, Dong dau, Ghep / Tach trang', x: 80, y: 270, size: 18, color: '#e2e8f0' }
        ]
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
      elements: [
        { type: 'heading', text: 'Tieu de Slide moi', x: 80, y: 120, size: 32, color: '#f8fafc', bold: true },
        { type: 'text', text: 'Nhap noi dung thuyet trinh tai day...', x: 80, y: 180, size: 18, color: '#94a3b8' }
      ]
    };
    this.slides.push(newSlide);
    this.currentSlideIndex = this.slides.length - 1;
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

    if (type === 'heading') {
      slide.elements.push({ type: 'heading', text: 'Tiêu Đề Mới', x: 80, y: 240, size: 28, color: '#f8fafc', bold: true });
    } else if (type === 'badge') {
      slide.elements.push({ type: 'badge', text: 'Nhãn Điểm Nhấn', x: 80, y: 260, size: 14, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' });
    } else {
      slide.elements.push({ type: 'text', text: 'Đoạn văn bản mới cần trình bày...', x: 80, y: 280, size: 16, color: '#cbd5e1' });
    }
    this.renderCanvas();
  }

  setTheme(bgColor) {
    if (window.sound) window.sound.click();
    const slide = this.getCurrentSlide();
    if (slide) {
      slide.bg = bgColor;
      this.render();
    }
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
      html += `
        <div class="slide-thumb ${active ? 'thumb-active' : ''}" onclick="slidesStudio.selectSlide(${idx})">
          <div class="thumb-header">
            <span>Slide ${idx + 1}</span>
          </div>
          <div class="thumb-preview" style="background:${s.bg}">
            <div class="thumb-title-text">${title}</div>
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
    let html = '';

    slide.elements.forEach((el, idx) => {
      let extra = '';
      if (el.type === 'badge') {
        extra = `background: ${el.bg}; padding: 4px 12px; border-radius: 999px; display: inline-block;`;
      }
      html += `
        <div class="slide-element" 
             data-idx="${idx}" 
             style="position: absolute; left: ${el.x}px; top: ${el.y}px; color: ${el.color}; font-size: ${el.size}px; font-weight: ${el.bold ? 'bold' : 'normal'}; ${extra}"
             contenteditable="true">
          ${el.text}
        </div>
      `;
    });

    this.canvasEl.innerHTML = html;

    // Attach text update listeners
    const elNodes = this.canvasEl.querySelectorAll('.slide-element');
    elNodes.forEach(node => {
      node.addEventListener('blur', () => {
        const idx = parseInt(node.getAttribute('data-idx'), 10);
        slide.elements[idx].text = node.innerText.trim();
        this.renderThumbnails();
      });
    });
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
      let extra = '';
      if (el.type === 'badge') {
        extra = `background: ${el.bg}; padding: 6px 18px; border-radius: 999px; display: inline-block;`;
      }
      html += `
        <div style="position: absolute; left: ${el.x * 1.5}px; top: ${el.y * 1.5}px; color: ${el.color}; font-size: ${el.size * 1.4}px; font-weight: ${el.bold ? 'bold' : 'normal'}; ${extra}">
          ${el.text}
        </div>
      `;
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
        slide.addText(el.text, {
          x: el.x / 96,
          y: el.y / 96,
          fontSize: el.size,
          color: el.color.replace('#', ''),
          bold: !!el.bold
        });
      });
    });

    await pptx.writeFile({ fileName: filename });
  }
}

window.slidesStudio = new SlidesStudio();
