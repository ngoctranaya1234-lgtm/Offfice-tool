// Pure JavaScript Excel Engine powered by JSZip
// Generates and reads authentic .xlsx and .csv files client-side with zero external internet
class ExcelEngine {
  constructor() {
    this.zip = null;
  }

  _escapeXml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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

  async createXlsxBlob(sheetsData, workbookName = 'Workbook') {
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip library is required for client-side Excel creation');
    }
    const zip = new JSZip();

    // sheetsData can be:
    // 1) 2D array of values -> [ ["A", "B"], [1, 2] ]
    // 2) Array of sheets -> [ { name: "Sheet1", data: [...] } ]
    let sheets = [];
    if (Array.isArray(sheetsData) && sheetsData.length > 0 && Array.isArray(sheetsData[0])) {
      sheets = [{ name: 'Sheet1', data: sheetsData }];
    } else if (Array.isArray(sheetsData)) {
      sheets = sheetsData;
    } else {
      sheets = [{ name: 'Sheet1', data: [[]] }];
    }

    // 1. [Content_Types].xml
    let ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStringTable+xml"/>`;
    
    sheets.forEach((s, idx) => {
      ct += `\n  <Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
    });
    ct += `\n</Types>`;
    zip.file('[Content_Types].xml', ct);

    // 2. _rels/.rels
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

    // 3. xl/_rels/workbook.xml.rels
    let wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdSharedStrings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>`;
    
    sheets.forEach((s, idx) => {
      wbRels += `\n  <Relationship Id="rIdSheet${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`;
    });
    wbRels += `\n</Relationships>`;
    zip.file('xl/_rels/workbook.xml.rels', wbRels);

    // 4. xl/workbook.xml
    let wb = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>`;
    sheets.forEach((s, idx) => {
      const safeName = this._escapeXml(s.name || `Sheet${idx + 1}`);
      wb += `\n    <sheet name="${safeName}" sheetId="${idx + 1}" r:id="rIdSheet${idx + 1}"/>`;
    });
    wb += `\n  </sheets>
</workbook>`;
    zip.file('xl/workbook.xml', wb);

    // 5. xl/styles.xml
    zip.file('xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><color theme="1"/><name val="Segoe UI"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/><family val="2"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFE2E8F0"/></left>
      <right style="thin"><color rgb="FFE2E8F0"/></right>
      <top style="thin"><color rgb="FFE2E8F0"/></top>
      <bottom style="thin"><color rgb="FFE2E8F0"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
  </cellXfs>
</styleSheet>`);

    // 6. Shared Strings Table
    const stringMap = new Map();
    const stringList = [];
    function getStringId(str) {
      if (!stringMap.has(str)) {
        stringMap.set(str, stringList.length);
        stringList.push(str);
      }
      return stringMap.get(str);
    }

    // 7. Generate Worksheets
    sheets.forEach((sheetObj, sheetIdx) => {
      const data = sheetObj.data || [];
      let wsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>`;

      data.forEach((row, rIdx) => {
        if (!row || row.length === 0) return;
        const rowNum = rIdx + 1;
        const isHeader = (rIdx === 0);
        wsXml += `\n    <row r="${rowNum}">`;

        row.forEach((val, cIdx) => {
          if (val === null || val === undefined || val === '') return;
          const colRef = this._colName(cIdx) + rowNum;
          const styleIdx = isHeader ? '1' : '2';

          if (typeof val === 'number') {
            wsXml += `<c r="${colRef}" s="${styleIdx}"><v>${val}</v></c>`;
          } else if (typeof val === 'string' && val.startsWith('=')) {
            // Formula
            wsXml += `<c r="${colRef}" s="${styleIdx}"><f>${this._escapeXml(val.substring(1))}</f></c>`;
          } else {
            const sId = getStringId(String(val));
            wsXml += `<c r="${colRef}" t="s" s="${styleIdx}"><v>${sId}</v></c>`;
          }
        });

        wsXml += `</row>`;
      });

      wsXml += `\n  </sheetData>
</worksheet>`;
      zip.file(`xl/worksheets/sheet${sheetIdx + 1}.xml`, wsXml);
    });

    // Write shared strings
    let sstXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${stringList.length}" uniqueCount="${stringList.length}">`;
    stringList.forEach(s => {
      sstXml += `\n  <si><t>${this._escapeXml(s)}</t></si>`;
    });
    sstXml += `\n</sst>`;
    zip.file('xl/sharedStrings.xml', sstXml);

    return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  async parseXlsx(arrayBuffer) {
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip library is required to parse .xlsx files');
    }
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Read shared strings
    const sharedStrings = [];
    if (zip.file('xl/sharedStrings.xml')) {
      const sstXml = await zip.file('xl/sharedStrings.xml').async('text');
      const parser = new DOMParser();
      const doc = parser.parseFromString(sstXml, 'application/xml');
      const siNodes = doc.querySelectorAll('si');
      siNodes.forEach(si => {
        const t = si.querySelector('t');
        sharedStrings.push(t ? t.textContent : '');
      });
    }

    // Read sheet1
    const sheetFiles = Object.keys(zip.files).filter(k => k.startsWith('xl/worksheets/sheet') && k.endsWith('.xml'));
    if (sheetFiles.length === 0) return [[]];

    const sheetXml = await zip.file(sheetFiles[0]).async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(sheetXml, 'application/xml');
    
    const rows = doc.querySelectorAll('row');
    const resultGrid = [];

    rows.forEach(rowNode => {
      const rNum = parseInt(rowNode.getAttribute('r') || '1', 10) - 1;
      while (resultGrid.length <= rNum) {
        resultGrid.push([]);
      }
      
      const cNodes = rowNode.querySelectorAll('c');
      cNodes.forEach(c => {
        const ref = c.getAttribute('r') || '';
        const match = ref.match(/^([A-Z]+)(\d+)$/);
        if (!match) return;
        
        const colLetters = match[1];
        let cIdx = 0;
        for (let i = 0; i < colLetters.length; i++) {
          cIdx = cIdx * 26 + (colLetters.charCodeAt(i) - 64);
        }
        cIdx -= 1; // 0-indexed

        const type = c.getAttribute('t');
        const vNode = c.querySelector('v');
        let val = vNode ? vNode.textContent : '';

        if (type === 's') {
          const sId = parseInt(val, 10);
          val = sharedStrings[sId] || '';
        } else if (c.querySelector('f')) {
          val = '=' + c.querySelector('f').textContent;
        }

        while (resultGrid[rNum].length <= cIdx) {
          resultGrid[rNum].push('');
        }
        resultGrid[rNum][cIdx] = val;
      });
    });

    return resultGrid;
  }

  parseCsv(text) {
    const lines = text.split(/\r\n|\n/);
    return lines.map(line => {
      // Basic CSV parser
      const cells = [];
      let inQuotes = false;
      let curr = '';
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          cells.push(curr.trim());
          curr = '';
        } else {
          curr += ch;
        }
      }
      cells.push(curr.trim());
      return cells;
    }).filter(r => r.some(c => c !== ''));
  }

  exportCsv(data) {
    return data.map(row => 
      row.map(val => {
        const s = String(val ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      }).join(',')
    ).join('\r\n');
  }
}

window.excelEngine = new ExcelEngine();
