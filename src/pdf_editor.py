import os
import io
import math
from typing import List, Optional
import pypdf
from reportlab.pdfgen import canvas
from reportlab.lib import colors

def merge_pdfs(input_paths: List[str], output_path: str) -> str:
    """Merge multiple PDF files into a single document."""
    writer = pypdf.PdfWriter()
    for p in input_paths:
        writer.append(p)
    writer.write(output_path)
    writer.close()
    return output_path

def split_pdf(input_path: str, output_paths_dict: dict) -> List[str]:
    """
    Split PDF according to page dictionary.
    output_paths_dict format: { 'output1.pdf': [0, 1], 'output2.pdf': [2, 3] } (0-indexed)
    """
    reader = pypdf.PdfReader(input_path)
    created_files = []
    
    for out_name, page_indices in output_paths_dict.items():
        writer = pypdf.PdfWriter()
        for idx in page_indices:
            if 0 <= idx < len(reader.pages):
                writer.add_page(reader.pages[idx])
        writer.write(out_name)
        created_files.append(out_name)
        
    return created_files

def rotate_pages(input_path: str, output_path: str, angle: int = 90, pages: Optional[List[int]] = None) -> str:
    """Rotate specified pages (or all pages if None) by angle degrees (90, 180, 270)."""
    reader = pypdf.PdfReader(input_path)
    writer = pypdf.PdfWriter()
    
    target_pages = set(pages) if pages is not None else set(range(len(reader.pages)))
    
    for idx, page in enumerate(reader.pages):
        if idx in target_pages:
            page.rotate(angle)
        writer.add_page(page)
        
    writer.write(output_path)
    return output_path

def delete_pages(input_path: str, output_path: str, pages_to_delete: List[int]) -> str:
    """Delete specified 0-indexed page indices."""
    reader = pypdf.PdfReader(input_path)
    writer = pypdf.PdfWriter()
    
    del_set = set(pages_to_delete)
    for idx, page in enumerate(reader.pages):
        if idx not in del_set:
            writer.add_page(page)
            
    writer.write(output_path)
    return output_path

def reorder_pages(input_path: str, output_path: str, new_order: List[int]) -> str:
    """Reorder pages according to specified index list."""
    reader = pypdf.PdfReader(input_path)
    writer = pypdf.PdfWriter()
    
    for idx in new_order:
        if 0 <= idx < len(reader.pages):
            writer.add_page(reader.pages[idx])
            
    writer.write(output_path)
    return output_path

def add_watermark(input_path: str, output_path: str, text: str = "CONFIDENTIAL", 
                  opacity: float = 0.3, angle: float = 45, 
                  color_hex: str = "#ef4444", font_size: int = 42) -> str:
    """Apply diagonal or horizontal watermark text across all pages."""
    reader = pypdf.PdfReader(input_path)
    writer = pypdf.PdfWriter()
    
    for page in reader.pages:
        w = float(page.mediabox.width)
        h = float(page.mediabox.height)
        
        # Create in-memory watermark overlay canvas
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=(w, h))
        can.saveState()
        
        # Set transparency & color
        r = int(color_hex[1:3], 16) / 255.0
        g = int(color_hex[3:5], 16) / 255.0
        b = int(color_hex[5:7], 16) / 255.0
        can.setFillColor(colors.Color(r, g, b, alpha=opacity))
        can.setFont("Helvetica-Bold", font_size)
        
        can.translate(w / 2.0, h / 2.0)
        can.rotate(angle)
        can.drawCentredString(0, 0, text)
        can.restoreState()
        can.save()
        
        packet.seek(0)
        watermark_pdf = pypdf.PdfReader(packet)
        page.merge_page(watermark_pdf.pages[0])
        writer.add_page(page)
        
    writer.write(output_path)
    return output_path

def add_signature_stamp(input_path: str, output_path: str, signature_image_path: str,
                        page_index: int = 0, x: float = 100, y: float = 100, 
                        width: float = 150, height: float = 60) -> str:
    """Stamp a signature image on the specified page and position."""
    reader = pypdf.PdfReader(input_path)
    writer = pypdf.PdfWriter()
    
    for idx, page in enumerate(reader.pages):
        if idx == page_index:
            w = float(page.mediabox.width)
            h = float(page.mediabox.height)
            
            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=(w, h))
            can.drawImage(signature_image_path, x, y, width=width, height=height, mask='auto')
            can.save()
            
            packet.seek(0)
            overlay = pypdf.PdfReader(packet)
            page.merge_page(overlay.pages[0])
            
        writer.add_page(page)
        
    writer.write(output_path)
    return output_path
