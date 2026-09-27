import os
import sys
import json
import io
import re
from pathlib import Path

# Third-party document processors
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

import pdfplumber
import pypdf
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register Vietnamese TrueType fonts from Windows
FONT_REGULAR = 'Helvetica'
FONT_BOLD = 'Helvetica-Bold'

for p_font, p_bold in [
    ('C:/Windows/Fonts/arial.ttf', 'C:/Windows/Fonts/arialbd.ttf'),
    ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/segoeuib.ttf'),
    ('C:/Windows/Fonts/times.ttf', 'C:/Windows/Fonts/timesbd.ttf')
]:
    if os.path.exists(p_font) and os.path.exists(p_bold):
        try:
            pdfmetrics.registerFont(TTFont('ArialVN', p_font))
            pdfmetrics.registerFont(TTFont('ArialVN-Bold', p_bold))
            FONT_REGULAR = 'ArialVN'
            FONT_BOLD = 'ArialVN-Bold'
            break
        except Exception:
            pass

def word_to_pdf(docx_path: str, output_pdf_path: str) -> str:
    """Convert .docx file to .pdf with high fidelity preserving tables, styles and structure."""
    doc = docx.Document(docx_path)
    
    # ReportLab document setup
    pdf_doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles with full Vietnamese support
    normal_style = ParagraphStyle(
        'DocxNormal',
        parent=styles['Normal'],
        fontName=FONT_REGULAR,
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#1e293b')
    )
    
    h1_style = ParagraphStyle(
        'DocxH1',
        parent=styles['Heading1'],
        fontName=FONT_BOLD,
        fontSize=18,
        leading=22,
        spaceAfter=10,
        textColor=colors.HexColor('#0f172a')
    )
    
    h2_style = ParagraphStyle(
        'DocxH2',
        parent=styles['Heading2'],
        fontName=FONT_BOLD,
        fontSize=14,
        leading=18,
        spaceAfter=8,
        textColor=colors.HexColor('#1e293b')
    )
    
    story = []
    
    # Iterate through paragraphs and tables
    for element in doc.element.body:
        if element.tag.endswith('p'):
            # It's a paragraph
            p = docx.text.paragraph.Paragraph(element, doc)
            text = p.text.strip()
            if not text:
                story.append(Spacer(1, 6))
                continue
            
            style_name = p.style.name.lower() if p.style else ''
            # Escape HTML characters for ReportLab Paragraph
            safe_text = (text.replace('&', '&amp;')
                             .replace('<', '&lt;')
                             .replace('>', '&gt;'))
            
            if 'heading 1' in style_name or 'title' in style_name:
                story.append(Paragraph(safe_text, h1_style))
            elif 'heading 2' in style_name:
                story.append(Paragraph(safe_text, h2_style))
            elif 'heading 3' in style_name:
                story.append(Paragraph(f"<b>{safe_text}</b>", normal_style))
            else:
                # Apply inline bold/italic if available
                runs_html = []
                for run in p.runs:
                    r_text = (run.text.replace('&', '&amp;')
                                      .replace('<', '&lt;')
                                      .replace('>', '&gt;'))
                    if run.bold:
                        r_text = f"<b>{r_text}</b>"
                    if run.italic:
                        r_text = f"<i>{r_text}</i>"
                    if run.underline:
                        r_text = f"<u>{r_text}</u>"
                    runs_html.append(r_text)
                
                content = "".join(runs_html) if runs_html else safe_text
                story.append(Paragraph(content, normal_style))
                story.append(Spacer(1, 4))
                
        elif element.tag.endswith('tbl'):
            # It's a table
            tbl = docx.table.Table(element, doc)
            table_data = []
            for row in tbl.rows:
                row_cells = []
                for cell in row.cells:
                    cell_text = cell.text.strip().replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                    row_cells.append(Paragraph(cell_text, normal_style))
                table_data.append(row_cells)
            
            if table_data:
                # Calculate usable width: A4 is 595.27 points - 80 margin = 515 points
                col_count = len(table_data[0]) if table_data else 1
                col_width = max(515.0 / col_count, 40)
                
                t = Table(table_data, colWidths=[col_width] * col_count)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94a3b8')),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ]))
                story.append(Spacer(1, 6))
                story.append(t)
                story.append(Spacer(1, 8))

    pdf_doc.build(story)
    return output_pdf_path

def pdf_to_word(pdf_path: str, output_docx_path: str) -> str:
    """Convert .pdf file to an editable .docx document with preserved headings, text layout and tables."""
    doc = docx.Document()
    
    # Configure document margins
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        for page_idx, page in enumerate(pdf.pages):
            # 1. Extract and add tables first if present
            tables = page.extract_tables()
            
            # Extract plain text with words and layout
            text = page.extract_text(layout=False) or ""
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            
            # If page has tables, add them cleanly
            if tables:
                for table_data in tables:
                    if not table_data or len(table_data) == 0:
                        continue
                    
                    rows = len(table_data)
                    cols = max(len(r) for r in table_data if r)
                    if cols == 0:
                        continue
                    
                    word_table = doc.add_table(rows=rows, cols=cols)
                    word_table.alignment = WD_TABLE_ALIGNMENT.CENTER
                    
                    for r_idx, row in enumerate(table_data):
                        for c_idx, val in enumerate(row):
                            if c_idx < cols:
                                cell = word_table.cell(r_idx, c_idx)
                                cell.text = str(val or "")
                                if r_idx == 0:
                                    # Header styling
                                    for paragraph in cell.paragraphs:
                                        for run in paragraph.runs:
                                            run.font.bold = True
                    doc.add_paragraph()  # spacer
            else:
                # Normal text lines reconstruction
                for line in lines:
                    # Detect probable headings
                    if len(line) < 60 and (line.isupper() or line.endswith(':') or (lines.index(line) == 0 and len(line) < 40)):
                        p = doc.add_heading(line, level=2)
                    else:
                        doc.add_paragraph(line)
            
            # Add page break between pages (except last)
            if page_idx < total_pages - 1:
                doc.add_page_break()

    doc.save(output_docx_path)
    return output_docx_path

def pdf_to_excel(pdf_path: str, output_xlsx_path: str) -> str:
    """Extract all tabular data and structured grids from PDF into clean multi-sheet Excel workbook."""
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)
    
    header_font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
    header_fill = PatternFill(start_color='1E293B', end_color='1E293B', fill_type='solid')
    header_align = Alignment(horizontal='center', vertical='center', wrap_text=True)
    
    cell_font = Font(name='Segoe UI', size=10)
    cell_align = Alignment(horizontal='left', vertical='center')
    
    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )
    
    table_found_count = 0
    
    with pdfplumber.open(pdf_path) as pdf:
        for p_idx, page in enumerate(pdf.pages):
            sheet_title = f"Page_{p_idx + 1}"
            ws = wb.create_sheet(title=sheet_title[:31])
            
            tables = page.extract_tables()
            current_row = 1
            
            if tables:
                for t_idx, table_data in enumerate(tables):
                    table_found_count += 1
                    for r_idx, row in enumerate(table_data):
                        for c_idx, val in enumerate(row):
                            clean_val = str(val or "").strip()
                            
                            # Attempt number conversion
                            if re.match(r'^-?\d+(\.\d+)?$', clean_val):
                                try:
                                    clean_val = float(clean_val) if '.' in clean_val else int(clean_val)
                                except ValueError:
                                    pass
                            
                            cell = ws.cell(row=current_row, column=c_idx + 1, value=clean_val)
                            cell.font = header_font if r_idx == 0 else cell_font
                            cell.alignment = header_align if r_idx == 0 else cell_align
                            cell.border = thin_border
                            if r_idx == 0:
                                cell.fill = header_fill
                        current_row += 1
                    current_row += 2  # gap between tables
            else:
                # Fallback: Extract structured rows from text lines
                text = page.extract_text() or ""
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    # Split on multiple spaces or tabs
                    parts = re.split(r'\s{2,}|\t', line)
                    for c_idx, part in enumerate(parts):
                        clean_part = part.strip()
                        if re.match(r'^-?\d+(\.\d+)?$', clean_part):
                            try:
                                clean_part = float(clean_part) if '.' in clean_part else int(clean_part)
                            except ValueError:
                                pass
                        cell = ws.cell(row=current_row, column=c_idx + 1, value=clean_part)
                        cell.font = cell_font
                        cell.border = thin_border
                    current_row += 1
            
            # Auto-fit column widths
            for col in ws.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    if cell.value:
                        max_len = max(max_len, len(str(cell.value)))
                ws.column_dimensions[col_letter].width = min(max(max_len + 4, 12), 45)
    
    if len(wb.sheetnames) == 0:
        ws = wb.create_sheet(title="Data")
        ws.cell(row=1, column=1, value="No tables extracted")
        
    wb.save(output_xlsx_path)
    return output_xlsx_path

def excel_to_pdf(xlsx_path: str, output_pdf_path: str) -> str:
    """Render Excel spreadsheet to a well-formatted printable PDF."""
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    
    pdf_doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'SheetTitle',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        spaceAfter=8,
        textColor=colors.HexColor('#0f172a'),
        bold=True
    )
    cell_style = ParagraphStyle(
        'SheetCell',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )
    cell_header_style = ParagraphStyle(
        'SheetCellHeader',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.white,
        bold=True
    )
    
    story = []
    
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        story.append(Paragraph(f"Bảng tính: {sheet_name}", title_style))
        
        # Collect max non-empty row and col
        data = []
        for row in ws.iter_rows(values_only=True):
            if any(cell is not None for cell in row):
                row_cells = []
                for cell_val in row:
                    val_str = "" if cell_val is None else str(cell_val)
                    row_cells.append(val_str)
                data.append(row_cells)
        
        if not data:
            story.append(Paragraph("<i>(Bảng tính trống)</i>", cell_style))
            story.append(Spacer(1, 15))
            continue
            
        # Max cols in data
        max_cols = max(len(r) for r in data)
        # Pad shorter rows
        for r in data:
            while len(r) < max_cols:
                r.append("")
                
        # Limit to 10 cols for A4 width or truncate gracefully
        display_cols = min(max_cols, 10)
        formatted_table = []
        for r_idx, r in enumerate(data):
            row_items = []
            for c_idx in range(display_cols):
                text = r[c_idx].replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                style = cell_header_style if r_idx == 0 else cell_style
                row_items.append(Paragraph(text, style))
            formatted_table.append(row_items)
            
        col_w = 535.0 / display_cols
        t = Table(formatted_table, colWidths=[col_w] * display_cols)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#94a3b8')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
        ]))
        story.append(t)
        story.append(Spacer(1, 20))
        
    pdf_doc.build(story)
    return output_pdf_path

if __name__ == '__main__':
    print("Converter module ready.")
