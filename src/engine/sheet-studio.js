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

    // Default sample data
    this.data[0] = ['Sản phẩm', 'Số lượng', 'Đơn giá (VND)', 'Thành tiền', 'Ghi chú'];
    this.data[1] = ['Offfice tool Pro License', 5, 2500000, '=B2*C2', 'Đã thanh toán'];
    this.data[2] = ['Bộ chuyển đổi PDF-Word-Excel', 12, 850000, '=B3*C3', 'Ưu đãi'];
    this.data[3] = ['Cloud Document Sync', 20, 300000, '=B4*C4', 'Thường niên'];
    this.data[4] = ['TỔNG CỘNG', '', '', '=SUM(D2:D4)', 'Hoàn tất'];

    this.styles['0_0'] = { bold: true };
    this.styles['0_1'] = { bold: true };
    this.styles['0_2'] = { bold: true };
    this.styles['0_3'] = { bold: true };
    this.styles['0_4'] = { bold: true };
    this.styles['4_0'] = { bold: true, color: '#10b981' };
    this.styles['4_3'] = { bold: true, color: '#10b981' };

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

    // 3. Simple math evaluation (e.g. B2*C2 or A1+100)
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
}

window.sheetStudio = new SheetStudio();
