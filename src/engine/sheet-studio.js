// Excel Spreadsheet Studio - Grid & Formula Engine
class SheetStudio {
  constructor() {
    this.rows = 30;
    this.cols = 12;
    this.data = []; // 2D array of raw values or formulas
    this.styles = {}; // 'r_c' -> { bold, italic, color, bg, align }
    this.activeCell = { r: 0, c: 0 };
    this.containerEl = null;
    this.formulaInputEl = null;
    this.cellRefEl = null;
  }

  init(containerId, formulaInputId, cellRefId) {
    this.containerEl = document.getElementById(containerId);
    this.formulaInputEl = document.getElementById(formulaInputId);
    this.cellRefEl = document.getElementById(cellRefId);

    // Initialize data array
    this.data = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) row.push('');
      this.data.push(row);
    }

    // Clean empty spreadsheet ready for user file or input
    this.renderGrid();
    this._bindEvents();
  }

  _colName(colIndex) {
    let name = '';
    let num = colIndex + 1;
    while (num > 0) {
      let rem = (num - 1) % 26;
      name = String.fromCharCode(65 + rem) + name;
      num = Math.floor((num - 1) / 26);
    }
    return name;
  }

  _cellRef(r, c) {
    return `${this._colName(c)}${r + 1}`;
  }

  _parseRef(ref) {
    const match = ref.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    const colStr = match[1];
    const rowNum = parseInt(match[2], 10) - 1;
    let colIdx = 0;
    for (let i = 0; i < colStr.length; i++) {
      colIdx = colIdx * 26 + (colStr.charCodeAt(i) - 64);
    }
    return { r: rowNum, c: colIdx - 1 };
  }

  evaluateCell(rawVal) {
    if (typeof rawVal !== 'string' || !rawVal.startsWith('=')) {
      return rawVal;
    }

    const formula = rawVal.substring(1).trim().toUpperCase();

    // 1. SUM(A1:A5)
    const sumMatch = formula.match(/^SUM\(([A-Z0-9:]+)\)$/);
    if (sumMatch) {
      const range = sumMatch[1].split(':');
      if (range.length === 2) {
        const start = this._parseRef(range[0]);
        const end = this._parseRef(range[1]);
        if (start && end) {
          let sum = 0;
          for (let r = Math.min(start.r, end.r); r <= Math.max(start.r, end.r); r++) {
            for (let c = Math.min(start.c, end.c); c <= Math.max(start.c, end.c); c++) {
              const val = Number(this.evaluateCell(this.data[r]?.[c])) || 0;
              sum += val;
            }
          }
          return sum;
        }
      }
    }

    // 2. AVERAGE(A1:A5)
    const avgMatch = formula.match(/^AVERAGE\(([A-Z0-9:]+)\)$/);
    if (avgMatch) {
      const range = avgMatch[1].split(':');
      if (range.length === 2) {
        const start = this._parseRef(range[0]);
        const end = this._parseRef(range[1]);
        if (start && end) {
          let sum = 0, count = 0;
          for (let r = Math.min(start.r, end.r); r <= Math.max(start.r, end.r); r++) {
            for (let c = Math.min(start.c, end.c); c <= Math.max(start.c, end.c); c++) {
              const val = Number(this.evaluateCell(this.data[r]?.[c]));
              if (!isNaN(val)) { sum += val; count++; }
            }
          }
          return count > 0 ? (sum / count) : 0;
        }
      }
    }

    // 3. MAX(A1:A5)
    const maxMatch = formula.match(/^MAX\(([A-Z0-9:]+)\)$/);
    if (maxMatch) {
      const range = maxMatch[1].split(':');
      if (range.length === 2) {
        const start = this._parseRef(range[0]);
        const end = this._parseRef(range[1]);
        if (start && end) {
          let maxVal = -Infinity;
          for (let r = Math.min(start.r, end.r); r <= Math.max(start.r, end.r); r++) {
            for (let c = Math.min(start.c, end.c); c <= Math.max(start.c, end.c); c++) {
              const val = Number(this.evaluateCell(this.data[r]?.[c]));
              if (!isNaN(val) && val > maxVal) maxVal = val;
            }
          }
          return maxVal === -Infinity ? 0 : maxVal;
        }
      }
    }

    // 4. MIN(A1:A5)
    const minMatch = formula.match(/^MIN\(([A-Z0-9:]+)\)$/);
    if (minMatch) {
      const range = minMatch[1].split(':');
      if (range.length === 2) {
        const start = this._parseRef(range[0]);
        const end = this._parseRef(range[1]);
        if (start && end) {
          let minVal = Infinity;
          for (let r = Math.min(start.r, end.r); r <= Math.max(start.r, end.r); r++) {
            for (let c = Math.min(start.c, end.c); c <= Math.max(start.c, end.c); c++) {
              const val = Number(this.evaluateCell(this.data[r]?.[c]));
              if (!isNaN(val) && val < minVal) minVal = val;
            }
          }
          return minVal === Infinity ? 0 : minVal;
        }
      }
    }

    // 5. COUNT(A1:A5)
    const countMatch = formula.match(/^COUNT\(([A-Z0-9:]+)\)$/);
    if (countMatch) {
      const range = countMatch[1].split(':');
      if (range.length === 2) {
        const start = this._parseRef(range[0]);
        const end = this._parseRef(range[1]);
        if (start && end) {
          let count = 0;
          for (let r = Math.min(start.r, end.r); r <= Math.max(start.r, end.r); r++) {
            for (let c = Math.min(start.c, end.c); c <= Math.max(start.c, end.c); c++) {
              const val = this.data[r]?.[c];
              if (val !== undefined && val !== null && String(val).trim() !== '') count++;
            }
          }
          return count;
        }
      }
    }

    // 6. ROUND(A1, 2)
    const roundMatch = formula.match(/^ROUND\(([A-Z0-9]+),\s*(\d+)\)$/);
    if (roundMatch) {
      const coord = this._parseRef(roundMatch[1]);
      const decimals = parseInt(roundMatch[2], 10);
      if (coord && this.data[coord.r]) {
        const val = Number(this.evaluateCell(this.data[coord.r][coord.c])) || 0;
        return Number(val.toFixed(decimals));
      }
    }

    // 7. UPPER(A1) & LOWER(A1)
    const upperMatch = formula.match(/^UPPER\(([A-Z0-9]+)\)$/);
    if (upperMatch) {
      const coord = this._parseRef(upperMatch[1]);
      if (coord && this.data[coord.r]) {
        return String(this.evaluateCell(this.data[coord.r][coord.c]) || '').toUpperCase();
      }
    }

    const lowerMatch = formula.match(/^LOWER\(([A-Z0-9]+)\)$/);
    if (lowerMatch) {
      const coord = this._parseRef(lowerMatch[1]);
      if (coord && this.data[coord.r]) {
        return String(this.evaluateCell(this.data[coord.r][coord.c]) || '').toLowerCase();
      }
    }

    // 8. Simple math evaluation (e.g. B2*C2 or A1+100)
    let expr = formula;
    const refRegex = /([A-Z]+[0-9]+)/g;
    expr = expr.replace(refRegex, (match) => {
      const coord = this._parseRef(match);
      if (coord && this.data[coord.r]) {
        const val = this.evaluateCell(this.data[coord.r][coord.c]);
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    });

    try {
      if (/^[0-9+\-*/().\s]+$/.test(expr)) {
        return Function(`"use strict"; return (${expr})`)();
      }
    } catch (e) {}

    return rawVal;
  }

  renderGrid() {
    if (!this.containerEl) return;
    let html = '<table class="sheet-table"><thead><tr><th class="corner-header"></th>';

    // Column headers
    for (let c = 0; c < this.cols; c++) {
      html += `<th class="col-header" data-col="${c}">${this._colName(c)}</th>`;
    }
    html += '</tr></thead><tbody>';

    // Rows
    for (let r = 0; r < this.rows; r++) {
      html += `<tr><th class="row-header" data-row="${r}">${r + 1}</th>`;
      for (let c = 0; c < this.cols; c++) {
        const raw = this.data[r]?.[c] ?? '';
        const evaluated = this.evaluateCell(raw);
        const style = this.styles[`${r}_${c}`] || {};
        const isActive = (this.activeCell.r === r && this.activeCell.c === c);

        let inlineStyle = '';
        if (style.bold) inlineStyle += 'font-weight:bold;';
        if (style.italic) inlineStyle += 'font-style:italic;';
        if (style.color) inlineStyle += `color:${style.color};`;
        if (style.bg) inlineStyle += `background-color:${style.bg};`;
        if (style.align) inlineStyle += `text-align:${style.align};`;

        html += `<td class="sheet-cell ${isActive ? 'cell-active' : ''}" 
                     data-r="${r}" data-c="${c}" 
                     style="${inlineStyle}" 
                     contenteditable="true">${evaluated !== '' ? evaluated : ''}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    this.containerEl.innerHTML = html;
  }

  _bindEvents() {
    this.containerEl.addEventListener('click', (e) => {
      const td = e.target.closest('td.sheet-cell');
      if (td) {
        const r = parseInt(td.getAttribute('data-r'), 10);
        const c = parseInt(td.getAttribute('data-c'), 10);
        this.selectCell(r, c);
      }
    });

    this.containerEl.addEventListener('blur', (e) => {
      const td = e.target.closest('td.sheet-cell');
      if (td) {
        const r = parseInt(td.getAttribute('data-r'), 10);
        const c = parseInt(td.getAttribute('data-c'), 10);
        const val = td.innerText.trim();
        this.setCellValue(r, c, val);
      }
    }, true);

    if (this.formulaInputEl) {
      this.formulaInputEl.addEventListener('input', () => {
        const val = this.formulaInputEl.value;
        const { r, c } = this.activeCell;
        this.data[r][c] = val;
      });
      this.formulaInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.renderGrid();
          this.selectCell(this.activeCell.r + 1, this.activeCell.c);
        }
      });
    }
  }

  selectCell(r, c) {
    if (r >= this.rows || c >= this.cols) return;
    this.activeCell = { r, c };
    const ref = this._cellRef(r, c);
    if (this.cellRefEl) this.cellRefEl.innerText = ref;
    if (this.formulaInputEl) {
      this.formulaInputEl.value = this.data[r]?.[c] ?? '';
    }

    // Highlight cell in UI
    const cells = this.containerEl.querySelectorAll('td.sheet-cell');
    cells.forEach(el => {
      const er = parseInt(el.getAttribute('data-r'), 10);
      const ec = parseInt(el.getAttribute('data-c'), 10);
      if (er === r && ec === c) {
        el.classList.add('cell-active');
      } else {
        el.classList.remove('cell-active');
      }
    });

    this.updateStatusBar(r, c);
  }

  setCellValue(r, c, value) {
    // If not starting with '=', convert number if applicable
    if (typeof value === 'string' && !value.startsWith('=')) {
      const num = Number(value.replace(/,/g, ''));
      if (!isNaN(num) && value !== '') {
        this.data[r][c] = num;
      } else {
        this.data[r][c] = value;
      }
    } else {
      this.data[r][c] = value;
    }
    this.renderGrid();
    this.updateStatusBar(r, c);
  }

  toggleStyle(prop, val) {
    if (window.sound) window.sound.click();
    const key = `${this.activeCell.r}_${this.activeCell.c}`;
    if (!this.styles[key]) this.styles[key] = {};
    if (prop === 'bold' || prop === 'italic') {
      this.styles[key][prop] = !this.styles[key][prop];
    } else {
      this.styles[key][prop] = val;
    }
    this.renderGrid();
  }

  addRow() {
    this.rows++;
    const newRow = [];
    for (let c = 0; c < this.cols; c++) newRow.push('');
    this.data.push(newRow);
    this.renderGrid();
  }

  addCol() {
    this.cols++;
    for (let r = 0; r < this.rows; r++) {
      this.data[r].push('');
    }
    this.renderGrid();
  }

  deleteActiveRow() {
    if (this.rows <= 1) return;
    if (window.sound) window.sound.click();
    this.data.splice(this.activeCell.r, 1);
    this.rows--;
    if (this.activeCell.r >= this.rows) {
      this.activeCell.r = this.rows - 1;
    }
    this.renderGrid();
    this.selectCell(this.activeCell.r, this.activeCell.c);
  }

  deleteActiveCol() {
    if (this.cols <= 1) return;
    if (window.sound) window.sound.click();
    for (let r = 0; r < this.rows; r++) {
      if (this.data[r]) {
        this.data[r].splice(this.activeCell.c, 1);
      }
    }
    this.cols--;
    if (this.activeCell.c >= this.cols) {
      this.activeCell.c = this.cols - 1;
    }
    this.renderGrid();
    this.selectCell(this.activeCell.r, this.activeCell.c);
  }

  formatActiveCell(type) {
    if (window.sound) window.sound.click();
    const { r, c } = this.activeCell;
    const currentVal = this.data[r]?.[c];
    if (currentVal === undefined || currentVal === '') return;

    const num = Number(String(currentVal).replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return;

    if (type === 'vnd') {
      this.data[r][c] = num.toLocaleString('vi-VN') + ' ₫';
    } else if (type === 'usd') {
      this.data[r][c] = '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (type === 'percent') {
      this.data[r][c] = (num >= 1 ? num : num * 100).toFixed(1) + '%';
    } else if (type === 'decimal') {
      this.data[r][c] = num.toFixed(2);
    }
    this.renderGrid();
    this.selectCell(r, c);
  }

  updateStatusBar(r = this.activeCell.r, c = this.activeCell.c) {
    const colName = this._colName(c);
    const infoEl = document.getElementById('sheet-cell-info');
    const sumEl = document.getElementById('sheet-stat-sum');
    const avgEl = document.getElementById('sheet-stat-avg');
    const countEl = document.getElementById('sheet-stat-count');
    if (!infoEl || !sumEl || !avgEl || !countEl) return;

    infoEl.innerHTML = `Ô: <b style="color: #38bdf8;">${this._cellRef(r, c)}</b> (Cột ${colName})`;

    let sum = 0, count = 0;
    for (let rowIdx = 0; rowIdx < this.rows; rowIdx++) {
      const raw = this.data[rowIdx]?.[c];
      const evaluated = this.evaluateCell(raw);
      const val = Number(evaluated);
      if (!isNaN(val) && raw !== '' && raw !== null && raw !== undefined) {
        sum += val;
        count++;
      }
    }
    const avg = count > 0 ? (sum / count) : 0;
    sumEl.innerText = sum.toLocaleString('vi-VN');
    avgEl.innerText = count > 0 ? (Number.isInteger(avg) ? avg : avg.toFixed(2)) : '0';
    countEl.innerText = count;
  }

  async exportXlsx(filename = 'Bang_tinh.xlsx') {
    if (window.sound) window.sound.success();
    // Clean data grid
    const evaluatedGrid = this.data.map(row => 
      row.map(cell => this.evaluateCell(cell))
    );
    const blob = await window.excelEngine.createXlsxBlob(evaluatedGrid);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportCsv(filename = 'Bang_tinh.csv') {
    if (window.sound) window.sound.success();
    const evaluatedGrid = this.data.map(row => 
      row.map(cell => this.evaluateCell(cell))
    );
    const csvStr = window.excelEngine.exportCsv(evaluatedGrid);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  sortByColumn(colIdx = this.activeCell.c, ascending = true) {
    if (window.sound) window.sound.click();
    let maxPopulatedRow = 0;
    for (let r = 0; r < this.rows; r++) {
      if (this.data[r].some(v => v !== '')) maxPopulatedRow = r;
    }
    if (maxPopulatedRow <= 0) return;

    const startRow = (isNaN(Number(this.data[0][colIdx])) && this.data[0][colIdx] !== '') ? 1 : 0;
    const rowsToSort = this.data.slice(startRow, maxPopulatedRow + 1);

    rowsToSort.sort((rowA, rowB) => {
      const valA = this.evaluateCell(rowA[colIdx]);
      const valB = this.evaluateCell(rowB[colIdx]);
      const numA = Number(valA);
      const numB = Number(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return ascending ? (numA - numB) : (numB - numA);
      }
      return ascending ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    for (let i = 0; i < rowsToSort.length; i++) {
      this.data[startRow + i] = rowsToSort[i];
    }
    this.renderGrid();
  }

  async exportPdf(filename = 'Bang_tinh.pdf') {
    if (window.sound) window.sound.success();
    let maxR = 0, maxC = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.data[r][c] !== '') {
          if (r > maxR) maxR = r;
          if (c > maxC) maxC = c;
        }
      }
    }
    maxR = Math.max(maxR, 4);
    maxC = Math.max(maxC, 3);

    const canvas = document.createElement('canvas');
    canvas.width = 1754; // A4 Landscape (150 DPI)
    canvas.height = 1240;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const margin = 80;
    const colW = (canvas.width - margin * 2) / (maxC + 1);
    const rowH = 38;
    let curY = margin;

    // Header Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText('BẢNG TÍNH EXCEL - OFFFICE TOOL PRO', margin, curY);
    curY += 50;

    for (let r = 0; r <= maxR; r++) {
      const isHeader = (r === 0);
      for (let c = 0; c <= maxC; c++) {
        const x = margin + c * colW;
        const val = String(this.evaluateCell(this.data[r][c]) || '');

        ctx.fillStyle = isHeader ? '#f1f5f9' : (r % 2 === 0 ? '#f8fafc' : '#ffffff');
        ctx.fillRect(x, curY, colW, rowH);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, curY, colW, rowH);

        ctx.fillStyle = isHeader ? '#0f172a' : '#1e293b';
        ctx.font = `${isHeader ? 'bold' : 'normal'} 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
        ctx.fillText(val.substring(0, 22), x + 8, curY + 25);
      }
      curY += rowH;
    }

    const pdfDoc = await PDFLib.PDFDocument.create();
    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const imgBytes = await fetch(imgDataUrl).then(r => r.arrayBuffer());
    const embeddedJpg = await pdfDoc.embedJpg(imgBytes);
    const page = pdfDoc.addPage([841.89, 595.28]); // A4 Landscape
    page.drawImage(embeddedJpg, { x: 0, y: 0, width: 841.89, height: 595.28 });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  autoNumberSTT(col = this.activeCell.c) {
    if (window.sound) window.sound.click();
    let num = 1;
    for (let r = 1; r < this.rows; r++) {
      const neighbor = (col + 1 < this.cols) ? this.data[r]?.[col + 1] : this.data[r]?.[col - 1];
      if (neighbor !== undefined && neighbor !== null && String(neighbor).trim() !== '') {
        this.data[r][col] = num++;
      } else if (r <= 8 && !neighbor) {
        this.data[r][col] = num++;
      }
    }
    this.renderGrid();
  }

  applyConditionalFormatting(col = this.activeCell.c) {
    if (window.sound) window.sound.click();
    let min = Infinity, max = -Infinity;
    for (let r = 1; r < this.rows; r++) {
      const val = Number(this.evaluateCell(this.data[r]?.[col]));
      if (!isNaN(val) && this.data[r]?.[col] !== '') {
        if (val < min) min = val;
        if (val > max) max = val;
      }
    }

    for (let r = 1; r < this.rows; r++) {
      const val = Number(this.evaluateCell(this.data[r]?.[col]));
      if (!isNaN(val) && this.data[r]?.[col] !== '') {
        const key = `${r}_${col}`;
        if (!this.styles[key]) this.styles[key] = {};
        if (val < 0) {
          this.styles[key].color = '#ef4444';
          this.styles[key].bg = 'rgba(239, 68, 68, 0.18)';
          this.styles[key].bold = true;
        } else if (val === max && max > 0) {
          this.styles[key].color = '#10b981';
          this.styles[key].bg = 'rgba(16, 185, 129, 0.18)';
          this.styles[key].bold = true;
        }
      }
    }
    this.renderGrid();
  }

  insertSheetTemplate(type) {
    if (window.sound) window.sound.success();
    if (type === 'bang_luong') {
      this.data = [
        ['STT', 'Họ Và Tên', 'Chức Vụ', 'Lương Cơ Bản', 'Phụ Cấp', 'Thực Lĩnh'],
        [1, 'Nguyễn Văn An', 'Trưởng Phòng', 15000000, 2000000, '=D2+E2'],
        [2, 'Trần Thị Bình', 'Chuyên Viên', 10000000, 1500000, '=D3+E3'],
        [3, 'Lê Hoàng Cường', 'Kỹ Sư', 12000000, 1800000, '=D4+E4'],
        [4, 'Phạm Ngọc Dung', 'Kế Toán', 11000000, 1200000, '=D5+E5'],
        ['Tổng', '', '', '=SUM(D2:D5)', '=SUM(E2:E5)', '=SUM(F2:F5)']
      ];
      this.rows = Math.max(12, this.data.length + 3);
      this.cols = Math.max(8, this.data[0].length + 2);
    } else if (type === 'thu_chi') {
      this.data = [
        ['Ngày', 'Khoản Mục Thu/Chi', 'Loại', 'Số Tiền (VNĐ)', 'Ghi Chú'],
        ['01/10', 'Thu tiền bán hàng', 'Thu', 45000000, 'Khách hàng chuyển khoản'],
        ['03/10', 'Chi tiền thuê văn phòng', 'Chi', -15000000, 'Đã chuyển'],
        ['05/10', 'Chi tiền điện nước, internet', 'Chi', -2800000, 'Hóa đơn tháng'],
        ['10/10', 'Thu tiền dự án dịch vụ', 'Thu', 32000000, 'Hợp đồng số 12'],
        ['Tổng', '', '', '=SUM(D2:D5)', '']
      ];
      this.rows = Math.max(12, this.data.length + 3);
      this.cols = Math.max(8, this.data[0].length + 2);
    } else if (type === 'ke_hoach') {
      this.data = [
        ['Hạng Mục Kế Hoạch', 'Dự Toán', 'Thực Tế', 'Chênh Lệch', 'Tỷ Lệ Hoàn Thành (%)'],
        ['Tiền nhà & sinh hoạt', 8000000, 7500000, '=B2-C2', '=ROUND(C2/B2*100, 1)'],
        ['Ăn uống & mua sắm', 5000000, 5200000, '=B3-C3', '=ROUND(C3/B3*100, 1)'],
        ['Học tập & phát triển', 3000000, 2500000, '=B4-C4', '=ROUND(C4/B4*100, 1)'],
        ['Đầu tư & tiết kiệm', 6000000, 6000000, '=B5-C5', '=ROUND(C5/B5*100, 1)'],
        ['Tổng Cộng', '=SUM(B2:B5)', '=SUM(C2:C5)', '=SUM(D2:D5)', '']
      ];
      this.rows = Math.max(12, this.data.length + 3);
      this.cols = Math.max(8, this.data[0].length + 2);
    }

    for (let r = 0; r < this.rows; r++) {
      if (!this.data[r]) this.data[r] = [];
      for (let c = 0; c < this.cols; c++) {
        if (this.data[r][c] === undefined) this.data[r][c] = '';
      }
    }

    for (let c = 0; c < this.cols; c++) {
      this.styles[`0_${c}`] = { bold: true, bg: 'rgba(255, 255, 255, 0.08)' };
    }
    this.renderGrid();
    this.selectCell(0, 0);
  }

  renderChartModal() {
    if (window.sound) window.sound.success();
    const modal = document.getElementById('sheet-chart-modal');
    const canvas = document.getElementById('sheet-chart-canvas');
    if (!modal || !canvas) return;

    modal.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const labels = [];
    const values = [];
    let valCol = this.activeCell.c > 0 ? this.activeCell.c : 1;

    for (let r = 1; r < this.rows; r++) {
      const rawVal = this.evaluateCell(this.data[r]?.[valCol]);
      const num = Number(rawVal);
      if (!isNaN(num) && rawVal !== '' && rawVal !== null && this.data[r]?.[0] !== 'Tổng' && this.data[r]?.[0] !== 'Tổng Cộng') {
        const lbl = String(this.data[r]?.[0] || `Hàng ${r}`);
        labels.push(lbl);
        values.push(num);
      }
    }

    if (values.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Vui lòng chọn cột chứa số liệu để vẽ biểu đồ.', canvas.width / 2, canvas.height / 2);
      return;
    }

    const maxVal = Math.max(...values.map(Math.abs), 1);
    const chartW = canvas.width - 120;
    const chartH = canvas.height - 100;
    const barW = Math.min(54, (chartW / values.length) * 0.6);
    const gap = chartW / values.length;

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 40);
    ctx.lineTo(80, canvas.height - 60);
    ctx.lineTo(canvas.width - 40, canvas.height - 60);
    ctx.stroke();

    const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

    values.forEach((v, idx) => {
      const x = 90 + idx * gap + (gap - barW) / 2;
      const h = (Math.abs(v) / maxVal) * (chartH - 40);
      const y = v >= 0 ? (canvas.height - 60 - h) : (canvas.height - 60);

      ctx.fillStyle = v >= 0 ? colors[idx % colors.length] : '#ef4444';
      ctx.beginPath();
      ctx.roundRect(x, y, barW, Math.max(4, h), [6, 6, 0, 0]);
      ctx.fill();

      // Top value label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      const displayVal = Math.abs(v) >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + 'k' : v);
      ctx.fillText(displayVal, x + barW / 2, y - 6);

      // Bottom label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText(labels[idx].substring(0, 10), x + barW / 2, canvas.height - 40);
    });
  }
}

window.sheetStudio = new SheetStudio();
