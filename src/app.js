// OFFFICE TOOL PRO - MAIN CONTROLLER APPLICATION
// 100% Genuine File Processing, Zero Mock / Fake Demos

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Initialize PDF.js worker if available
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

    // Subsystem re-render hooks
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

  // 4. Platform Selector
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

  // 6. Converter Hub State & Events
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

  // Select Convert Type Card
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

    // Update accepted extensions
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
      const type = card.getAttribute('data-type');
      window.selectConvertType(type);
    });
  });

  // Dropzone drag & drop
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

    // Show file info card
    if (fileInfoCard) {
      fileInfoCard.classList.remove('hidden');
      document.getElementById('file-info-name').innerText = file.name;
      document.getElementById('file-info-size').innerText = `${(file.size / 1024).toFixed(1)} KB`;
    }
    if (downloadCard) downloadCard.classList.add('hidden');
    if (progressWrap) progressWrap.classList.add('hidden');
    if (convertActionBtn) convertActionBtn.disabled = false;
  }

  // Trigger Conversion Execution
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

  // 7. PDF Editor Studio Setup
  const pdfUploadInput = document.getElementById('pdf-editor-upload');
  const pdfThumbsContainer = document.getElementById('pdf-thumbs-list');
  const pdfMainCanvas = document.getElementById('pdf-viewport-canvas');
  let loadedPdfArrayBuffer = null;

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
    
    // Render thumbnails
    if (pdfThumbsContainer) {
      pdfThumbsContainer.innerHTML = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        const thumbCard = document.createElement('div');
        thumbCard.className = `pdf-thumb-card ${p === 1 ? 'active' : ''}`;
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
    renderMainPage(1);
  }

  async function renderMainPage(pageNum) {
    if (!loadedPdfArrayBuffer || !pdfMainCanvas || !window.pdfjsLib) return;
    const pdf = await window.pdfjsLib.getDocument({ data: loadedPdfArrayBuffer.slice(0) }).promise;
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.2 });
    pdfMainCanvas.width = viewport.width;
    pdfMainCanvas.height = viewport.height;
    await page.render({ canvasContext: pdfMainCanvas.getContext('2d'), viewport }).promise;
    window.pdfEditorClient.currentPage = pageNum - 1;
    document.getElementById('pdf-current-page-num').innerText = `${pageNum} / ${pdf.numPages}`;
  }

  // PDF Tool: Rotate
  window.rotateCurrentPage = async function() {
    if (!window.pdfEditorClient.pdfDoc) return;
    if (window.sound) window.sound.click();
    await window.pdfEditorClient.rotatePage(window.pdfEditorClient.currentPage, 90);
    const bytes = await window.pdfEditorClient.exportPdfBytes();
    loadedPdfArrayBuffer = bytes.buffer;
    await renderPdfPages();
  };

  // PDF Tool: Watermark Modal
  window.openWatermarkModal = function() {
    if (window.sound) window.sound.click();
    document.getElementById('watermark-modal').classList.remove('hidden');
  };
  window.closeWatermarkModal = function() {
    document.getElementById('watermark-modal').classList.add('hidden');
  };
  window.applyWatermark = async function() {
    const text = document.getElementById('wm-text-input').value || 'OFFFICE TOOL';
    const opacity = parseFloat(document.getElementById('wm-opacity-slider').value);
    const color = document.getElementById('wm-color-picker').value;
    const angle = parseInt(document.getElementById('wm-angle-select').value, 10);

    if (window.sound) window.sound.success();
    await window.pdfEditorClient.addWatermarkText(text, { opacity, color, angle });
    const bytes = await window.pdfEditorClient.exportPdfBytes();
    loadedPdfArrayBuffer = bytes.buffer;
    closeWatermarkModal();
    await renderPdfPages();
  };

  // PDF Tool: Signature Pad
  let sigCanvas, sigCtx, isDrawing = false;
  window.openSignatureModal = function() {
    if (window.sound) window.sound.click();
    const modal = document.getElementById('signature-modal');
    modal.classList.remove('hidden');
    sigCanvas = document.getElementById('signature-pad-canvas');
    sigCtx = sigCanvas.getContext('2d');
    sigCtx.strokeStyle = '#0f172a';
    sigCtx.lineWidth = 2.5;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';

    const startDraw = (e) => {
      isDrawing = true;
      const rect = sigCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      sigCtx.beginPath();
      sigCtx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      const rect = sigCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      sigCtx.lineTo(clientX - rect.left, clientY - rect.top);
      sigCtx.stroke();
    };

    const stopDraw = () => { isDrawing = false; };

    sigCanvas.onmousedown = startDraw;
    sigCanvas.onmousemove = draw;
    window.onmouseup = stopDraw;
    sigCanvas.ontouchstart = startDraw;
    sigCanvas.ontouchmove = draw;
    sigCanvas.ontouchend = stopDraw;
  };

  window.clearSignature = function() {
    if (sigCanvas && sigCtx) {
      sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    }
  };

  window.applySignature = async function() {
    if (!sigCanvas) return;
    const dataUrl = sigCanvas.toDataURL('image/png');
    await window.pdfEditorClient.addSignature(window.pdfEditorClient.currentPage, dataUrl, 80, 80, 160, 60);
    const bytes = await window.pdfEditorClient.exportPdfBytes();
    loadedPdfArrayBuffer = bytes.buffer;
    document.getElementById('signature-modal').classList.add('hidden');
    await renderPdfPages();
  };

  // PDF Tool: Export Download
  window.downloadEditedPdf = async function() {
    if (!window.pdfEditorClient.pdfDoc) return;
    if (window.sound) window.sound.success();
    const blob = await window.pdfEditorClient.exportPdfBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Edited_Document.pdf';
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

  // 11. Initial Check for Server
  if (window.converter) {
    await window.converter.checkServer();
    // Heartbeat every 10s
    setInterval(() => window.converter.checkServer(), 10000);
  }
});
