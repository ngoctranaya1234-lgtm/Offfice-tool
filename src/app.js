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
        '<i data-lucide="volume-x"></i><span>Bật âm</span>' : 
        '<i data-lucide="volume-2"></i><span>Tắt âm</span>';
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
      'img-to-pdf': '.png,.jpg,.jpeg'
    };
    if (fileInput) fileInput.accept = acceptMap[type] || '*';
  };

  convertCards.forEach(card => {
    card.addEventListener('click', () => {
      window.selectConvertType(card.getAttribute('data-type'));
    });
  });

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
        handleConvertFile(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleConvertFile(e.target.files[0]);
      }
    });
  }

  function handleConvertFile(file) {
    if (window.sound) window.sound.swoop();
    activeConvertFile = file;

    if (fileInfoCard) {
      fileInfoCard.classList.remove('hidden');
      document.getElementById('file-info-name').innerText = file.name;
      document.getElementById('file-info-size').innerText = `${(file.size / 1024).toFixed(1)} KB`;
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
          result = await window.converter.convertImageToPdf(activeConvertFile, updateProgress);
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

    const startDraw = (e) => {
      if (activePdfTool === 'view') return;
      isPdfDrawing = true;
      const pos = getPos(e);
      drawCtx = pdfDrawingCanvas.getContext('2d');
      drawCtx.beginPath();
      drawCtx.moveTo(pos.x, pos.y);

      const color = document.getElementById('pdf-draw-color')?.value || '#ef4444';
      const width = parseInt(document.getElementById('pdf-draw-width')?.value || '4', 10);

      if (activePdfTool === 'highlighter') {
        drawCtx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
        drawCtx.lineWidth = Math.max(width, 18);
        drawCtx.lineCap = 'square';
      } else {
        drawCtx.strokeStyle = color;
        drawCtx.lineWidth = width;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
      }
    };

    const draw = (e) => {
      if (!isPdfDrawing || activePdfTool === 'view') return;
      e.preventDefault();
      const pos = getPos(e);
      drawCtx.lineTo(pos.x, pos.y);
      drawCtx.stroke();
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
  }

  // Clear current page drawings
  window.clearPageDrawings = function() {
    if (pdfDrawingCanvas && drawCtx) {
      if (window.sound) window.sound.click();
      drawCtx.clearRect(0, 0, pdfDrawingCanvas.width, pdfDrawingCanvas.height);
    }
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
});
