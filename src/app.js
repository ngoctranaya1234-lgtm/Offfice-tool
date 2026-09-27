// OFFFICE TOOL PRO - MASTER APPLICATION CONTROLLER
// 100% Genuine File Processing, High-Performance Multi-Language Hybrid Engine

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Vector Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Initialize PDF.js worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = './libs/pdf.worker.min.mjs';
  }

  // 3. Tab Navigation Handling
  const tabs = document.querySelectorAll('.nav-tab, .mobile-nav-item');
  const views = document.querySelectorAll('.tab-view');

  window.switchTab = function(tabId) {
    if (window.sound) window.sound.tabSwitch();
    tabs.forEach(t => {
      if (t.getAttribute('data-tab') === tabId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    views.forEach(v => {
      if (v.id === `view-${tabId}`) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    if (tabId === 'pdf') {
      if (!loadedPdfArrayBuffer && window.createBlankPdf) {
        window.createBlankPdf(true);
      }
    }
    if (tabId === 'sheet' && window.sheetStudio) {
      window.sheetStudio.renderGrid();
    }
    if (tabId === 'slides' && window.slidesStudio) {
      window.slidesStudio.render();
    }
    if (window.lucide) window.lucide.createIcons();
  };

  tabs.forEach(t => {
    t.addEventListener('click', () => {
      const tabId = t.getAttribute('data-tab');
      window.switchTab(tabId);
    });
  });

  // 4. Platform Selector (Auto / iOS / Android / Desktop)
  const platformSelect = document.getElementById('platform-selector');
  if (platformSelect && window.platform) {
    platformSelect.value = window.platform.currentMode;
    platformSelect.addEventListener('change', (e) => {
      window.platform.applyMode(e.target.value);
    });
  }

  // 5. Sound Mute Toggle
  const muteBtn = document.getElementById('sound-mute-btn');
  if (muteBtn && window.sound) {
    const updateMuteUI = () => {
      const isMuted = window.sound.isMuted();
      muteBtn.innerHTML = isMuted ? 
        '<i data-lucide="volume-x"></i><span class="mute-btn-text">Bật âm</span>' : 
        '<i data-lucide="volume-2"></i><span class="mute-btn-text">Tắt âm</span>';
      if (window.lucide) window.lucide.createIcons();
    };
    updateMuteUI();
    muteBtn.addEventListener('click', () => {
      window.sound.toggleMute();
      updateMuteUI();
    });
  }

  // =========================================================================
  // 6. CONVERTER HUB LOGIC (100% UNICODE & VIETNAMESE GUARANTEED)
  // =========================================================================
  let selectedConvertType = 'word-to-pdf';
  let activeConvertFile = null;

  const convertCards = document.querySelectorAll('.convert-card');
  const dropzone = document.getElementById('convert-dropzone');
  const fileInput = document.getElementById('convert-file-input');
  const fileInfoCard = document.getElementById('file-info-card');
  const convertActionBtn = document.getElementById('start-convert-btn');
  const progressWrap = document.getElementById('convert-progress-wrap');
  const progressFill = document.getElementById('convert-progress-fill');
  const progressLabel = document.getElementById('convert-progress-label');
  const downloadCard = document.getElementById('convert-download-card');
  const downloadBtn = document.getElementById('convert-download-btn');

  window.selectConvertType = function(type) {
    if (window.sound) window.sound.click();
    selectedConvertType = type;
    convertCards.forEach(c => {
      if (c.getAttribute('data-type') === type) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });

    const acceptMap = {
      'word-to-pdf': '.docx,.doc',
      'pdf-to-word': '.pdf',
      'pdf-to-excel': '.pdf',
      'excel-to-pdf': '.xlsx,.xls',
      'img-to-pdf': '.png,.jpg,.jpeg,.webp',
      'pdf-to-img': '.pdf',
      'compress-pdf': '.pdf'
    };
    if (fileInput) {
      fileInput.accept = acceptMap[type] || '*';
      fileInput.multiple = (type === 'img-to-pdf');
    }
  };

  convertCards.forEach(card => {
    card.addEventListener('click', () => {
      window.selectConvertType(card.getAttribute('data-type'));
    });
  });

  let activeConvertFiles = null;

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleConvertFiles(e.dataTransfer.files);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleConvertFiles(e.target.files);
      }
    });
  }

  function handleConvertFiles(files) {
    if (window.sound) window.sound.swoop();
    activeConvertFiles = Array.from(files);
    activeConvertFile = files[0];

    if (fileInfoCard) {
      fileInfoCard.classList.remove('hidden');
      if (files.length > 1) {
        document.getElementById('file-info-name').innerText = `Đã chọn ${files.length} tệp (${files[0].name}, ...)`;
        const totalSize = Array.from(files).reduce((acc, f) => acc + f.size, 0);
        document.getElementById('file-info-size').innerText = `Tổng dung lượng: ${(totalSize / 1024).toFixed(1)} KB`;
      } else {
        document.getElementById('file-info-name').innerText = files[0].name;
        document.getElementById('file-info-size').innerText = `${(files[0].size / 1024).toFixed(1)} KB`;
      }
    }
    if (downloadCard) downloadCard.classList.add('hidden');
    if (progressWrap) progressWrap.classList.add('hidden');
    if (convertActionBtn) convertActionBtn.disabled = false;
  }

  if (convertActionBtn) {
    convertActionBtn.addEventListener('click', async () => {
      if (!activeConvertFile) return;
      if (window.sound) window.sound.click();

      convertActionBtn.disabled = true;
      progressWrap.classList.remove('hidden');
      downloadCard.classList.add('hidden');

      const updateProgress = (pct, label) => {
        progressFill.style.width = `${pct}%`;
        progressLabel.innerText = label;
      };

      try {
        let result = null;
        if (selectedConvertType === 'word-to-pdf') {
          result = await window.converter.convertWordToPdf(activeConvertFile, updateProgress);
        } else if (selectedConvertType === 'pdf-to-word') {
          result = await window.converter.convertPdfToWord(activeConvertFile, updateProgress);
        } else if (selectedConvertType === 'pdf-to-excel') {
          result = await window.converter.convertPdfToExcel(activeConvertFile, updateProgress);
        } else if (selectedConvertType === 'excel-to-pdf') {
          result = await window.converter.convertExcelToPdf(activeConvertFile, updateProgress);
        } else if (selectedConvertType === 'img-to-pdf') {
          result = await window.converter.convertImageToPdf(activeConvertFiles || activeConvertFile, updateProgress);
        } else if (selectedConvertType === 'pdf-to-img') {
          result = await window.converter.convertPdfToImages(activeConvertFile, updateProgress);
        } else if (selectedConvertType === 'compress-pdf') {
          result = await window.converter.compressPdf(activeConvertFile, updateProgress);
        }

        if (result && result.blob) {
          if (window.sound) window.sound.success();
          downloadCard.classList.remove('hidden');
          document.getElementById('download-file-name').innerText = result.filename;

          downloadBtn.onclick = () => {
            const url = URL.createObjectURL(result.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename;
            a.click();
            URL.revokeObjectURL(url);
          };
        }
      } catch (err) {
        if (window.sound) window.sound.error();
        alert('Lỗi chuyển đổi: ' + err.message);
        console.error(err);
      } finally {
        convertActionBtn.disabled = false;
      }
    });
  }

  // =========================================================================
  // 7. SUPERCHARGED PDF STUDIO & EDITOR
  // =========================================================================
  const pdfUploadInput = document.getElementById('pdf-editor-upload');
  const pdfThumbsContainer = document.getElementById('pdf-thumbs-list');
  const pdfMainCanvas = document.getElementById('pdf-viewport-canvas');
  const pdfDrawingCanvas = document.getElementById('pdf-drawing-canvas');
  let loadedPdfArrayBuffer = null;
  let pdfZoomLevel = 1.2;
  let activePdfTool = 'view'; // 'view' | 'pen' | 'highlighter'

  // Drawing overlay canvas context
  let drawCtx = pdfDrawingCanvas ? pdfDrawingCanvas.getContext('2d') : null;
  let isPdfDrawing = false;

  // Zoom control
  window.zoomPdf = function(delta) {
    if (window.sound) window.sound.click();
    pdfZoomLevel = Math.max(0.5, Math.min(2.5, pdfZoomLevel + delta));
    document.getElementById('pdf-zoom-val').innerText = `${Math.round(pdfZoomLevel * 100)}%`;
    renderMainPage(window.pdfEditorClient.currentPage + 1);
  };

  // PDF Tool Selector
  window.setPdfTool = function(tool) {
    if (window.sound) window.sound.click();
    activePdfTool = tool;
    document.querySelectorAll('.pdf-tool-btn').forEach(btn => btn.classList.remove('active'));
    const target = document.getElementById(`pdf-tool-${tool}`);
    if (target) target.classList.add('active');

    if (pdfDrawingCanvas) {
      if (tool === 'view') {
        pdfDrawingCanvas.style.pointerEvents = 'none';
        pdfDrawingCanvas.style.cursor = 'default';
      } else {
        pdfDrawingCanvas.style.pointerEvents = 'auto';
        pdfDrawingCanvas.style.cursor = tool === 'highlighter' ? 'text' : 'crosshair';
      }
    }
  };

  // Setup Drawing Overlay Events
  if (pdfDrawingCanvas) {
    const getPos = (e) => {
      const rect = pdfDrawingCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scaleX = pdfDrawingCanvas.width / rect.width;
      const scaleY = pdfDrawingCanvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    let startX = 0, startY = 0;
    let canvasSnapshot = null;

    function drawArrow(ctx, fromx, fromy, tox, toy) {
      const headlen = 16;
      const dx = tox - fromx;
      const dy = toy - fromy;
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.moveTo(fromx, fromy);
      ctx.lineTo(tox, toy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tox, toy);
      ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }

    function showInteractiveTextPopover(clientX, clientY, pos) {
      document.querySelectorAll('.pdf-text-editor-popover').forEach(el => el.remove());

      const container = document.getElementById('pdf-canvas-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const popover = document.createElement('div');
      popover.className = 'pdf-text-editor-popover';

      const popX = Math.max(10, Math.min(rect.width - 280, clientX - rect.left));
      const popY = Math.max(10, Math.min(rect.height - 130, clientY - rect.top));

      popover.style.left = `${popX}px`;
      popover.style.top = `${popY}px`;

      popover.innerHTML = `
        <textarea placeholder="Nhập văn bản tiếng Việt... (Ctrl+Enter để chèn)"></textarea>
        <div class="pdf-text-popover-controls">
          <div style="display: flex; gap: 4px; align-items: center;">
            <select class="platform-select popover-size" style="padding: 2px 4px; font-size: 0.75rem;">
              <option value="16">16px</option>
              <option value="20" selected>20px</option>
              <option value="26">26px</option>
              <option value="34">34px</option>
              <option value="46">46px</option>
            </select>
            <button type="button" class="tool-btn popover-bold-btn" style="width: 24px; height: 24px; font-size: 0.75rem;" title="In đậm"><b>B</b></button>
          </div>
          <div style="display: flex; gap: 4px;">
            <button type="button" class="btn-secondary popover-cancel-btn" style="padding: 3px 8px; font-size: 0.75rem;">Hủy</button>
            <button type="button" class="btn-primary popover-commit-btn" style="padding: 3px 10px; font-size: 0.75rem;">✓ Chèn</button>
          </div>
        </div>
      `;

      container.appendChild(popover);
      const textarea = popover.querySelector('textarea');
      textarea.focus();

      let isBold = false;
      const boldBtn = popover.querySelector('.popover-bold-btn');
      boldBtn.onclick = () => {
        isBold = !isBold;
        boldBtn.style.color = isBold ? 'var(--accent-cyan)' : 'inherit';
      };

      const commit = async () => {
        const textVal = textarea.value.trim();
        popover.remove();
        if (!textVal) return;

        const fontSize = parseInt(popover.querySelector('.popover-size').value, 10);
        const color = document.getElementById('pdf-draw-color')?.value || '#ef4444';

        drawCtx = pdfDrawingCanvas.getContext('2d');
        drawCtx.font = `${isBold ? 'bold' : 'normal'} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        drawCtx.fillStyle = color;
        drawCtx.textBaseline = 'top';

        const lines = textVal.split('\n');
        lines.forEach((line, lIdx) => {
          drawCtx.fillText(line, pos.x, pos.y + lIdx * (fontSize * 1.3));
        });

        try {
          const dataUrl = pdfDrawingCanvas.toDataURL('image/png');
          await window.pdfEditorClient.addDrawnOverlay(window.pdfEditorClient.currentPage, dataUrl);
        } catch (err) {}
        if (window.sound) window.sound.success();
      };

      popover.querySelector('.popover-commit-btn').onclick = commit;
      popover.querySelector('.popover-cancel-btn').onclick = () => popover.remove();
      textarea.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
          ev.preventDefault();
          commit();
        } else if (ev.key === 'Escape') {
          popover.remove();
        }
      });
    }

    const startDraw = (e) => {
      if (activePdfTool === 'view') return;
      const pos = getPos(e);

      if (activePdfTool === 'text') {
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        showInteractiveTextPopover(cx, cy, pos);
        return;
      }

      isPdfDrawing = true;
      startX = pos.x;
      startY = pos.y;
      drawCtx = pdfDrawingCanvas.getContext('2d');
      canvasSnapshot = drawCtx.getImageData(0, 0, pdfDrawingCanvas.width, pdfDrawingCanvas.height);

      const color = document.getElementById('pdf-draw-color')?.value || '#ef4444';
      const width = parseInt(document.getElementById('pdf-draw-width')?.value || '4', 10);

      drawCtx.strokeStyle = activePdfTool === 'highlighter' ? 'rgba(250, 204, 21, 0.45)' : color;
      drawCtx.fillStyle = color;
      drawCtx.lineWidth = activePdfTool === 'highlighter' ? Math.max(width, 18) : width;
      drawCtx.lineCap = activePdfTool === 'highlighter' ? 'square' : 'round';
      drawCtx.lineJoin = 'round';

      if (activePdfTool === 'pen' || activePdfTool === 'highlighter') {
        drawCtx.beginPath();
        drawCtx.moveTo(pos.x, pos.y);
      }
    };

    const draw = (e) => {
      if (!isPdfDrawing || activePdfTool === 'view' || activePdfTool === 'text') return;
      e.preventDefault();
      const pos = getPos(e);

      if (activePdfTool === 'pen' || activePdfTool === 'highlighter') {
        drawCtx.lineTo(pos.x, pos.y);
        drawCtx.stroke();
      } else if (activePdfTool === 'rect') {
        drawCtx.putImageData(canvasSnapshot, 0, 0);
        drawCtx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
      } else if (activePdfTool === 'circle') {
        drawCtx.putImageData(canvasSnapshot, 0, 0);
        const rx = Math.abs(pos.x - startX) / 2;
        const ry = Math.abs(pos.y - startY) / 2;
        const cx = Math.min(startX, pos.x) + rx;
        const cy = Math.min(startY, pos.y) + ry;
        drawCtx.beginPath();
        drawCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        drawCtx.stroke();
      } else if (activePdfTool === 'line') {
        drawCtx.putImageData(canvasSnapshot, 0, 0);
        drawCtx.beginPath();
        drawCtx.moveTo(startX, startY);
        drawCtx.lineTo(pos.x, pos.y);
        drawCtx.stroke();
      } else if (activePdfTool === 'arrow') {
        drawCtx.putImageData(canvasSnapshot, 0, 0);
        drawArrow(drawCtx, startX, startY, pos.x, pos.y);
      }
    };

    const endDraw = async () => {
      if (!isPdfDrawing) return;
      isPdfDrawing = false;
      // Bake drawing overlay into PDF-Lib
      try {
        const dataUrl = pdfDrawingCanvas.toDataURL('image/png');
        await window.pdfEditorClient.addDrawnOverlay(window.pdfEditorClient.currentPage, dataUrl);
      } catch (err) {}
    };

    pdfDrawingCanvas.onmousedown = startDraw;
    pdfDrawingCanvas.onmousemove = draw;
    window.addEventListener('mouseup', endDraw);
    pdfDrawingCanvas.ontouchstart = startDraw;
    pdfDrawingCanvas.ontouchmove = draw;
    window.addEventListener('touchend', endDraw);

    // Alignment Grid Toggle
    window.togglePdfGrid = function() {
      const container = document.getElementById('pdf-canvas-container');
      if (!container) return;
      const isActive = container.classList.toggle('pdf-grid-active');
      if (window.sound) window.sound.click();
      const btn = document.getElementById('pdf-grid-toggle');
      if (btn) btn.classList.toggle('active', isActive);
    };

    // Filter Mode Switcher
    window.setPdfFilter = function(filterName) {
      const container = document.getElementById('pdf-canvas-container');
      if (!container) return;
      if (window.sound) window.sound.click();
      container.classList.remove('pdf-filter-night', 'pdf-filter-scan', 'pdf-filter-sepia');
      if (filterName !== 'none') {
        container.classList.add(`pdf-filter-${filterName}`);
      }
    };

    // Night Mode Toggle
    window.togglePdfNightMode = function() {
      const container = document.getElementById('pdf-canvas-container');
      if (!container) return;
      const isNight = container.classList.toggle('pdf-night-mode');
      if (window.sound) window.sound.click();
      const btn = document.getElementById('pdf-toggle-night');
      if (btn) btn.classList.toggle('active', isNight);
    };

    // Insert Image / Stamp on PDF
    const insertImgUpload = document.getElementById('pdf-insert-image-upload');
    if (insertImgUpload) {
      insertImgUpload.addEventListener('change', async (e) => {
        if (!window.pdfEditorClient.pdfDoc) {
          alert('Vui lòng mở file PDF trước.');
          return;
        }
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          const arrayBuffer = await file.arrayBuffer();
          if (window.sound) window.sound.success();
          await window.pdfEditorClient.addWatermarkImage(arrayBuffer, {
            opacity: 0.95,
            width: 200,
            height: 200,
            angle: 0
          });
          const bytes = await window.pdfEditorClient.exportPdfBytes();
          loadedPdfArrayBuffer = bytes.buffer;
          await renderPdfPages();
        }
      });
    }
  }

  // Clear current page drawings
  window.clearPageDrawings = function() {
    if (pdfDrawingCanvas && drawCtx) {
      if (window.sound) window.sound.click();
      drawCtx.clearRect(0, 0, pdfDrawingCanvas.width, pdfDrawingCanvas.height);
    }
  };

  // Create / Initialize Blank A4 PDF Document
  window.createBlankPdf = async function(silent = false) {
    if (!silent && window.sound) window.sound.swoop();
    const bytes = await window.pdfEditorClient.createBlankDocument();
    loadedPdfArrayBuffer = bytes.buffer;
    await window.pdfEditorClient.loadPdf(loadedPdfArrayBuffer);
    await renderPdfPages();
  };

  // OCR / Extract Page Text
  window.extractCurrentPageText = async function() {
    if (!loadedPdfArrayBuffer || !window.pdfjsLib) {
      alert('Chưa có nội dung trang PDF để trích xuất.');
      return;
    }
    if (window.sound) window.sound.click();
    const pdf = await window.pdfjsLib.getDocument({ data: loadedPdfArrayBuffer.slice(0) }).promise;
    const pageNum = window.pdfEditorClient.currentPage + 1;
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join(' ');
    
    if (!text.trim()) {
      alert(`Trang ${pageNum} là trang trắng hoặc hình ảnh scan, không có văn bản dạng text.`);
      return;
    }

    navigator.clipboard.writeText(text);
    alert(`Đã trích xuất & sao chép thành công văn bản Trang ${pageNum} vào Clipboard:\n\n"${text.substring(0, 180)}..."`);
  };

  // Bates Numbering
  window.applyBatesNumbering = async function(format = 'Trang {page} / {total}', pos = 'bottom-center') {
    if (!window.pdfEditorClient.pdfDoc) return;
    if (window.sound) window.sound.success();
    await window.pdfEditorClient.addPageNumbers(format, pos);
    const bytes = await window.pdfEditorClient.exportPdfBytes();
    loadedPdfArrayBuffer = bytes.buffer;
    await renderPdfPages();
    alert('Đã đánh số trang Bates cho toàn bộ tài liệu PDF!');
  };

  // Preset Stamps
  window.applyPresetStamp = async function(type) {
    if (!window.pdfEditorClient.pdfDoc) return;
    if (window.sound) window.sound.success();
    await window.pdfEditorClient.addPresetStamp(type, window.pdfEditorClient.currentPage);
    const bytes = await window.pdfEditorClient.exportPdfBytes();
    loadedPdfArrayBuffer = bytes.buffer;
    await renderPdfPages();
  };

  // Upload PDF for Editing
  if (pdfUploadInput) {
    pdfUploadInput.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        if (window.sound) window.sound.swoop();
        loadedPdfArrayBuffer = await file.arrayBuffer();
        await window.pdfEditorClient.loadPdf(loadedPdfArrayBuffer);
        await renderPdfPages();
      }
    });
  }

  async function renderPdfPages() {
    if (!loadedPdfArrayBuffer || !window.pdfjsLib) return;
    const pdf = await window.pdfjsLib.getDocument({ data: loadedPdfArrayBuffer.slice(0) }).promise;
    
    // Render thumbnails strip
    if (pdfThumbsContainer) {
      pdfThumbsContainer.innerHTML = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 0.22 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        const thumbCard = document.createElement('div');
        thumbCard.className = `pdf-thumb-card ${p === (window.pdfEditorClient.currentPage + 1) ? 'active' : ''}`;
        thumbCard.innerHTML = `<p style="font-size:0.75rem;margin-bottom:4px;">Trang ${p}</p>`;
        thumbCard.appendChild(canvas);
        thumbCard.onclick = () => {
          renderMainPage(p);
          document.querySelectorAll('.pdf-thumb-card').forEach(c => c.classList.remove('active'));
          thumbCard.classList.add('active');
        };
        pdfThumbsContainer.appendChild(thumbCard);
      }
    }
    renderMainPage(window.pdfEditorClient.currentPage + 1);
  }

  async function renderMainPage(pageNum) {
    if (!loadedPdfArrayBuffer || !pdfMainCanvas || !window.pdfjsLib) return;
    const pdf = await window.pdfjsLib.getDocument({ data: loadedPdfArrayBuffer.slice(0) }).promise;
    if (pageNum > pdf.numPages) pageNum = pdf.numPages;
    if (pageNum < 1) pageNum = 1;

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: pdfZoomLevel });
    
    pdfMainCanvas.width = viewport.width;
    pdfMainCanvas.height = viewport.height;
    await page.render({ canvasContext: pdfMainCanvas.getContext('2d'), viewport }).promise;

    // Synchronize drawing overlay dimensions
    if (pdfDrawingCanvas) {
      pdfDrawingCanvas.width = viewport.width;
      pdfDrawingCanvas.height = viewport.height;
      const ctx = pdfDrawingCanvas.getContext('2d');
      ctx.clearRect(0, 0, viewport.width, viewport.height);
    }

    window.pdfEditorClient.currentPage = pageNum - 1;
    document.getElementById('pdf-current-page-num').innerText = `${pageNum} / ${pdf.numPages}`;
  }

  // --- PAGE EDITING ACTIONS ---
  window.rotateCurrentPage = async function(deg = 90) {
    if (!window.pdfEditorClient.pdfDoc) return;
    if (window.sound) window.sound.click();
    await window.pdfEditorClient.rotatePage(window.pdfEditorClient.currentPage, deg);
    const bytes = await window.pdfEditorClient.exportPdfBytes();
    loadedPdfArrayBuffer = bytes.buffer;
    await renderPdfPages();
  };

  window.duplicateCurrentPage = async function() {
    if (!window.pdfEditorClient.pdfDoc) return;
    if (window.sound) window.sound.success();
    await window.pdfEditorClient.duplicatePage(window.pdfEditorClient.currentPage);
    const bytes = await window.pdfEditorClient.exportPdfBytes();
    loadedPdfArrayBuffer = bytes.buffer;
    await renderPdfPages();
  };

  window.insertBlankPage = async function() {
    if (!window.pdfEditorClient.pdfDoc) return;
    if (window.sound) window.sound.click();
    await window.pdfEditorClient.insertBlankPage(window.pdfEditorClient.currentPage);
    const bytes = await window.pdfEditorClient.exportPdfBytes();
    loadedPdfArrayBuffer = bytes.buffer;
    await renderPdfPages();
  };

  window.moveCurrentPage = async function(direction) {
    if (!window.pdfEditorClient.pdfDoc) return;
    if (window.sound) window.sound.click();
    const curr = window.pdfEditorClient.currentPage;
    const target = curr + direction;
    if (target >= 0 && target < window.pdfEditorClient.totalPages) {
      await window.pdfEditorClient.movePage(curr, target);
      const bytes = await window.pdfEditorClient.exportPdfBytes();
      loadedPdfArrayBuffer = bytes.buffer;
      await renderPdfPages();
    }
  };

  window.deleteCurrentPage = async function() {
    if (!window.pdfEditorClient.pdfDoc) return;
    if (window.pdfEditorClient.totalPages <= 1) {
      alert('Tài liệu phải giữ ít nhất 1 trang.');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa Trang ${window.pdfEditorClient.currentPage + 1}?`)) {
      if (window.sound) window.sound.click();
      await window.pdfEditorClient.deletePage(window.pdfEditorClient.currentPage);
      const bytes = await window.pdfEditorClient.exportPdfBytes();
      loadedPdfArrayBuffer = bytes.buffer;
      await renderPdfPages();
    }
  };

  // --- WATERMARK MODAL & TABS ---
  window.openWatermarkModal = function() {
    if (window.sound) window.sound.click();
    document.getElementById('watermark-modal').classList.remove('hidden');
  };
  window.closeWatermarkModal = function() {
    document.getElementById('watermark-modal').classList.add('hidden');
  };

  window.switchWatermarkTab = function(tab) {
    if (window.sound) window.sound.click();
    const textBtn = document.getElementById('wm-tab-text-btn');
    const imgBtn = document.getElementById('wm-tab-img-btn');
    const textPane = document.getElementById('wm-pane-text');
    const imgPane = document.getElementById('wm-pane-image');

    if (tab === 'text') {
      textBtn.classList.add('active');
      imgBtn.classList.remove('active');
      textPane.classList.remove('hidden');
      imgPane.classList.add('hidden');
    } else {
      imgBtn.classList.add('active');
      textBtn.classList.remove('active');
      imgPane.classList.remove('hidden');
      textPane.classList.add('hidden');
    }
  };

  window.applyWatermark = async function() {
    if (!window.pdfEditorClient.pdfDoc) {
      alert('Vui lòng mở file PDF trước khi áp dụng đóng dấu.');
      return;
    }

    const isImageTab = document.getElementById('wm-tab-img-btn').classList.contains('active');
    
    if (isImageTab) {
      const imgInput = document.getElementById('wm-image-file-input');
      if (!imgInput.files || imgInput.files.length === 0) {
        alert('Vui lòng chọn tệp hình ảnh logo/con dấu.');
        return;
      }
      const buf = await imgInput.files[0].arrayBuffer();
      const opacity = parseFloat(document.getElementById('wm-img-opacity').value);
      const size = parseInt(document.getElementById('wm-img-size').value, 10);
      await window.pdfEditorClient.addWatermarkImage(buf, { opacity, width: size, height: size });
    } else {
      const text = document.getElementById('wm-text-input').value.trim();
      if (!text) {
        alert('Vui lòng nhập nội dung chữ đóng dấu.');
        return;
      }
      const opacity = parseFloat(document.getElementById('wm-opacity-slider').value);
      const color = document.getElementById('wm-color-picker').value;
      const angle = parseInt(document.getElementById('wm-angle-select').value, 10);
      // Canvas-based watermark has 100% Vietnamese Unicode support, zero WinAnsi error!
      await window.pdfEditorClient.addWatermarkText(text, { opacity, color, angle });
    }

    if (window.sound) window.sound.success();
    const bytes = await window.pdfEditorClient.exportPdfBytes();
    loadedPdfArrayBuffer = bytes.buffer;
    closeWatermarkModal();
    await renderPdfPages();
  };

  // --- SIGNATURE SUITE & 3 MODES ---
  let sigCanvas, sigCtx, isSigDrawing = false;
  let activeSigTab = 'draw';

  window.openSignatureModal = function() {
    if (window.sound) window.sound.click();
    document.getElementById('signature-modal').classList.remove('hidden');
    sigCanvas = document.getElementById('signature-pad-canvas');
    if (sigCanvas) {
      sigCtx = sigCanvas.getContext('2d');
      sigCtx.strokeStyle = '#0f172a';
      sigCtx.lineWidth = 3;
      sigCtx.lineCap = 'round';
      sigCtx.lineJoin = 'round';

      const start = (e) => {
        isSigDrawing = true;
        const rect = sigCanvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        sigCtx.beginPath();
        sigCtx.moveTo(cx - rect.left, cy - rect.top);
      };
      const move = (e) => {
        if (!isSigDrawing) return;
        const rect = sigCanvas.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        sigCtx.lineTo(cx - rect.left, cy - rect.top);
        sigCtx.stroke();
      };
      const stop = () => { isSigDrawing = false; };

      sigCanvas.onmousedown = start;
      sigCanvas.onmousemove = move;
      window.onmouseup = stop;
      sigCanvas.ontouchstart = start;
      sigCanvas.ontouchmove = move;
      window.ontouchend = stop;
    }
  };

  window.switchSigTab = function(tab) {
    if (window.sound) window.sound.click();
    activeSigTab = tab;
    ['draw', 'type', 'upload'].forEach(t => {
      document.getElementById(`sig-tab-${t}-btn`).classList.toggle('active', t === tab);
      document.getElementById(`sig-pane-${t}`).classList.toggle('hidden', t !== tab);
    });
  };

  window.updateCalligraphyPreview = function() {
    const val = (document.getElementById('sig-type-input').value || '').trim();
    const previewEl = document.getElementById('sig-calligraphy-preview');
    if (!val) {
      previewEl.innerText = 'Chữ ký mẫu sẽ hiển thị tại đây khi bạn nhập họ tên';
      previewEl.style.fontSize = '1rem';
      previewEl.style.color = 'var(--text-muted)';
      previewEl.style.fontStyle = 'italic';
    } else {
      previewEl.innerText = val;
      previewEl.style.fontSize = '2.2rem';
      previewEl.style.color = '#0f172a';
      previewEl.style.fontStyle = 'normal';
    }
  };

  window.clearSignature = function() {
    if (sigCanvas && sigCtx) {
      sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    }
  };

  window.applySignature = async function() {
    if (!window.pdfEditorClient.pdfDoc) {
      alert('Vui lòng mở file PDF trước.');
      return;
    }

    let sigDataUrl = null;
    if (activeSigTab === 'draw') {
      if (!sigCanvas) return;
      sigDataUrl = sigCanvas.toDataURL('image/png');
    } else if (activeSigTab === 'type') {
      const text = (document.getElementById('sig-type-input').value || '').trim();
      if (!text) {
        alert('Vui lòng nhập họ tên chữ ký.');
        return;
      }
      const cCanvas = document.createElement('canvas');
      cCanvas.width = 460;
      cCanvas.height = 140;
      const cCtx = cCanvas.getContext('2d');
      cCtx.font = 'italic bold 42px "Brush Script MT", "Segoe Script", cursive, sans-serif';
      cCtx.fillStyle = '#0f172a';
      cCtx.textAlign = 'center';
      cCtx.textBaseline = 'middle';
      cCtx.fillText(text, 230, 70);
      sigDataUrl = cCanvas.toDataURL('image/png');
    } else if (activeSigTab === 'upload') {
      const upInput = document.getElementById('sig-upload-input');
      if (!upInput.files || upInput.files.length === 0) {
        alert('Vui lòng chọn ảnh con dấu.');
        return;
      }
      sigDataUrl = await new Promise(res => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(upInput.files[0]);
      });
    }

    if (sigDataUrl) {
      if (window.sound) window.sound.success();
      await window.pdfEditorClient.addSignature(window.pdfEditorClient.currentPage, sigDataUrl, 80, 80, 160, 65);
      const bytes = await window.pdfEditorClient.exportPdfBytes();
      loadedPdfArrayBuffer = bytes.buffer;
      document.getElementById('signature-modal').classList.add('hidden');
      await renderPdfPages();
    }
  };

  // --- WHITEOUT & REPLACE TEXT MODAL ---
  window.openWhiteoutModal = function() {
    if (!window.pdfEditorClient.pdfDoc) {
      alert('Vui lòng mở file PDF trước.');
      return;
    }
    if (window.sound) window.sound.click();
    document.getElementById('whiteout-modal').classList.remove('hidden');
  };

  window.applyWhiteoutText = async function() {
    const text = document.getElementById('whiteout-text-input').value;
    if (!text.trim()) {
      alert('Vui lòng nhập văn bản thay thế.');
      return;
    }
    const size = parseInt(document.getElementById('whiteout-size-input').value, 10);
    const color = document.getElementById('whiteout-color-input').value;
    const width = parseInt(document.getElementById('whiteout-width-input').value, 10);

    if (window.sound) window.sound.success();
    // Default placed at x=80, y=500
    await window.pdfEditorClient.addWhiteoutAndText(window.pdfEditorClient.currentPage, 80, 500, width, size * 2.2, text, {
      fontSize: size,
      color: color,
      bold: true
    });
    const bytes = await window.pdfEditorClient.exportPdfBytes();
    loadedPdfArrayBuffer = bytes.buffer;
    document.getElementById('whiteout-modal').classList.add('hidden');
    await renderPdfPages();
  };

  // --- MERGE MULTI-PDFS MODAL ---
  window.openMergeModal = function() {
    if (window.sound) window.sound.click();
    document.getElementById('merge-modal').classList.remove('hidden');
  };

  const mergeFilesInput = document.getElementById('merge-files-input');
  if (mergeFilesInput) {
    mergeFilesInput.addEventListener('change', (e) => {
      const listEl = document.getElementById('merge-files-list');
      listEl.innerHTML = '';
      Array.from(e.target.files).forEach((f, idx) => {
        listEl.innerHTML += `<div>${idx + 1}. <b>${f.name}</b> (${(f.size/1024).toFixed(1)} KB)</div>`;
      });
    });
  }

  window.executeMergePdf = async function() {
    const files = mergeFilesInput.files;
    if (!files || files.length < 2) {
      alert('Vui lòng chọn từ 2 file PDF trở lên để gộp.');
      return;
    }
    if (window.sound) window.sound.success();
    const buffers = [];
    for (let i = 0; i < files.length; i++) {
      buffers.push(await files[i].arrayBuffer());
    }
    await window.pdfEditorClient.mergeWith(buffers);
    const blob = await window.pdfEditorClient.exportPdfBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Merged_Document.pdf';
    a.click();
    document.getElementById('merge-modal').classList.add('hidden');
  };

  // --- SPLIT PDF MODAL ---
  window.openSplitModal = function() {
    if (!window.pdfEditorClient.pdfDoc) {
      alert('Vui lòng mở file PDF trước.');
      return;
    }
    if (window.sound) window.sound.click();
    document.getElementById('split-modal').classList.remove('hidden');
  };

  window.executeSplitPdf = async function() {
    const rangeStr = document.getElementById('split-range-input').value.trim();
    if (!rangeStr) {
      alert('Vui lòng nhập dải trang cần tách (Ví dụ: 1-3, 5).');
      return;
    }

    // Parse ranges like "1-3, 5" -> [0, 1, 2, 4]
    const indices = [];
    const parts = rangeStr.split(',');
    for (const p of parts) {
      const trimmed = p.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
        for (let i = start; i <= end; i++) indices.push(i - 1);
      } else {
        indices.push(parseInt(trimmed, 10) - 1);
      }
    }

    const validIndices = indices.filter(i => i >= 0 && i < window.pdfEditorClient.totalPages);
    if (validIndices.length === 0) {
      alert('Khoảng trang không hợp lệ.');
      return;
    }

    if (window.sound) window.sound.success();
    const splitBytes = await window.pdfEditorClient.splitPages(validIndices);
    const blob = new Blob([splitBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Split_Document.pdf';
    a.click();
    document.getElementById('split-modal').classList.add('hidden');
  };

  // Download Edited PDF
  window.downloadEditedPdf = async function() {
    if (!window.pdfEditorClient.pdfDoc) {
      alert('Chưa có file PDF nào được mở.');
      return;
    }
    if (window.sound) window.sound.success();
    const blob = await window.pdfEditorClient.exportPdfBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Offfice_Edited_Document.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 8. Word Studio Initialization
  if (window.wordStudio) {
    window.wordStudio.init('word-editor-body', 'word-stats-bar');
    const wordOpenInput = document.getElementById('word-open-input');
    if (wordOpenInput) {
      wordOpenInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
          await window.wordStudio.loadDocxFile(e.target.files[0]);
        }
      });
    }

    window.toggleWordFindReplace = function() {
      const bar = document.getElementById('word-find-replace-bar');
      if (!bar) return;
      const isHidden = bar.classList.toggle('hidden');
      if (!isHidden) {
        document.getElementById('word-find-input')?.focus();
      }
    };

    window.executeWordReplace = function(replaceAll = false) {
      const findVal = (document.getElementById('word-find-input')?.value || '').trim();
      const replaceVal = document.getElementById('word-replace-input')?.value || '';
      if (!findVal) {
        alert('Vui lòng nhập từ khóa cần tìm.');
        return;
      }
      const count = window.wordStudio.replaceText(findVal, replaceVal, replaceAll);
      if (count > 0) {
        alert(`Đã thay thế thành công ${count} vị trí.`);
      } else {
        alert(`Không tìm thấy từ khóa "${findVal}" trong tài liệu.`);
      }
    };
  }

  // 9. Sheet Studio Initialization
  if (window.sheetStudio) {
    window.sheetStudio.init('sheet-grid-container', 'sheet-formula-input', 'sheet-active-cell-ref');
    const sheetOpenInput = document.getElementById('sheet-open-input');
    if (sheetOpenInput) {
      sheetOpenInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          const arrayBuffer = await file.arrayBuffer();
          const parsed = await window.excelEngine.parseXlsx(arrayBuffer);
          window.sheetStudio.data = parsed;
          window.sheetStudio.renderGrid();
        }
      });
    }

    window.insertQuickFormula = function(func) {
      if (!window.sheetStudio) return;
      if (window.sound) window.sound.click();
      const cell = window.sheetStudio.activeCell;
      const formulaInput = document.getElementById('sheet-formula-input');
      if (!formulaInput) return;
      const colName = window.sheetStudio._colName(cell.c);
      const prevRow = Math.max(1, cell.r);
      const range = `${colName}1:${colName}${prevRow}`;
      const formula = `=${func}(${range})`;
      formulaInput.value = formula;
      if (!window.sheetStudio.data[cell.r]) window.sheetStudio.data[cell.r] = [];
      window.sheetStudio.data[cell.r][cell.c] = formula;
      window.sheetStudio.renderGrid();
    };
  }

  // 10. Slides Studio Initialization
  if (window.slidesStudio) {
    window.slidesStudio.init('slides-main-canvas', 'slides-thumb-list');
  }

  // 11. Heartbeat check for server
  if (window.converter) {
    await window.converter.checkServer();
    setInterval(() => window.converter.checkServer(), 10000);
  }

  // 12. Register PWA Service Worker for Offline Engine
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('Offfice tool PWA ServiceWorker registered:', reg.scope);
    }).catch((err) => {
      console.log('Offfice tool PWA ServiceWorker notice:', err);
    });
  }

  // 13. Universal Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    const isCtrl = e.ctrlKey || e.metaKey;

    // Esc: Close any open modal or Zen mode
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
      openModals.forEach(m => m.classList.add('hidden'));
      const zenWrap = document.querySelector('.word-editor-container.zen-mode-active');
      if (zenWrap && window.wordStudio) {
        window.wordStudio.toggleZenMode();
      }
      return;
    }

    // Ctrl+S / Cmd+S: Quick Save active studio document
    if (isCtrl && e.key.toLowerCase() === 's') {
      e.preventDefault();
      const activeTab = document.querySelector('.tab-view.active')?.id;
      if (activeTab === 'view-word' && window.wordStudio) {
        window.wordStudio.exportDocx();
      } else if (activeTab === 'view-excel' && window.sheetStudio) {
        window.sheetStudio.exportXlsx();
      } else if (activeTab === 'view-slides' && window.slidesStudio) {
        window.slidesStudio.exportPptx();
      } else if (activeTab === 'view-pdf' && window.downloadEditedPdf) {
        window.downloadEditedPdf();
      }
      return;
    }

    // Ctrl+P / Cmd+P: Quick Print
    if (isCtrl && e.key.toLowerCase() === 'p') {
      const activeTab = document.querySelector('.tab-view.active')?.id;
      if (activeTab === 'view-word' && window.wordStudio) {
        e.preventDefault();
        window.wordStudio.printDocument();
      } else if (activeTab === 'view-pdf' && window.pdfEditorClient?.pdfDoc) {
        e.preventDefault();
        window.pdfEditorClient.printPdf();
      }
      return;
    }

    // Ctrl+F / Cmd+F in Word Studio
    if (isCtrl && e.key.toLowerCase() === 'f') {
      const activeTab = document.querySelector('.tab-view.active')?.id;
      if (activeTab === 'view-word' && window.toggleWordFindReplace) {
        e.preventDefault();
        window.toggleWordFindReplace();
      }
    }
  });
});
