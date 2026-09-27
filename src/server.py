import os
import sys
import json
import base64
import urllib.parse
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from pathlib import Path

# Add src to path
sys.path.append(os.path.dirname(__file__))
from converter import word_to_pdf, pdf_to_word, pdf_to_excel, excel_to_pdf
from pdf_editor import add_watermark, rotate_pages, merge_pdfs, split_pdf, delete_pages

BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = BASE_DIR
TEMP_DIR = BASE_DIR / "temp_uploads"
TEMP_DIR.mkdir(exist_ok=True)

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

class OfficeRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def end_headers(self):
        # Enable CORS and disable aggressive caching for local dev
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path == '/healthz':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "ok",
                "app": "Offfice tool Pro",
                "version": "1.0.0",
                "python_engine": "active",
                "conversions": ["word-to-pdf", "pdf-to-word", "pdf-to-excel", "excel-to-pdf"],
                "pdf_tools": ["watermark", "rotate", "merge", "split", "delete-pages"]
            }).encode('utf-8'))
            return
        
        super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            req_data = json.loads(post_data.decode('utf-8'))
        except Exception:
            self._send_error_json("Invalid JSON payload", 400)
            return

        endpoint = self.path
        
        try:
            if endpoint == '/api/convert/word-to-pdf':
                self._handle_word_to_pdf(req_data)
            elif endpoint == '/api/convert/pdf-to-word':
                self._handle_pdf_to_word(req_data)
            elif endpoint == '/api/convert/pdf-to-excel':
                self._handle_pdf_to_excel(req_data)
            elif endpoint == '/api/convert/excel-to-pdf':
                self._handle_excel_to_pdf(req_data)
            elif endpoint == '/api/pdf/watermark':
                self._handle_pdf_watermark(req_data)
            elif endpoint == '/api/pdf/rotate':
                self._handle_pdf_rotate(req_data)
            elif endpoint == '/api/pdf/merge':
                self._handle_pdf_merge(req_data)
            elif endpoint == '/api/pdf/delete-pages':
                self._handle_pdf_delete_pages(req_data)
            else:
                self._send_error_json(f"Unknown endpoint: {endpoint}", 404)
        except Exception as e:
            self._send_error_json(str(e), 500)

    def _send_file_response(self, file_path: str, filename: str, mime_type: str):
        with open(file_path, 'rb') as f:
            content = f.read()
        b64 = base64.b64encode(content).decode('utf-8')
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "success",
            "filename": filename,
            "mime_type": mime_type,
            "size": len(content),
            "data_base64": b64
        }).encode('utf-8'))

    def _send_error_json(self, message: str, code: int = 400):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "error",
            "error": message
        }).encode('utf-8'))

    def _handle_word_to_pdf(self, req: dict):
        file_bytes = base64.b64decode(req['file_base64'])
        filename = req.get('filename', 'document.docx')
        stem = Path(filename).stem
        
        in_path = TEMP_DIR / f"upload_{stem}.docx"
        out_path = TEMP_DIR / f"{stem}_converted.pdf"
        
        in_path.write_bytes(file_bytes)
        word_to_pdf(str(in_path), str(out_path))
        self._send_file_response(str(out_path), f"{stem}.pdf", "application/pdf")

    def _handle_pdf_to_word(self, req: dict):
        file_bytes = base64.b64decode(req['file_base64'])
        filename = req.get('filename', 'document.pdf')
        stem = Path(filename).stem
        
        in_path = TEMP_DIR / f"upload_{stem}.pdf"
        out_path = TEMP_DIR / f"{stem}_converted.docx"
        
        in_path.write_bytes(file_bytes)
        pdf_to_word(str(in_path), str(out_path))
        self._send_file_response(str(out_path), f"{stem}.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")

    def _handle_pdf_to_excel(self, req: dict):
        file_bytes = base64.b64decode(req['file_base64'])
        filename = req.get('filename', 'document.pdf')
        stem = Path(filename).stem
        
        in_path = TEMP_DIR / f"upload_{stem}.pdf"
        out_path = TEMP_DIR / f"{stem}_tables.xlsx"
        
        in_path.write_bytes(file_bytes)
        pdf_to_excel(str(in_path), str(out_path))
        self._send_file_response(str(out_path), f"{stem}.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    def _handle_excel_to_pdf(self, req: dict):
        file_bytes = base64.b64decode(req['file_base64'])
        filename = req.get('filename', 'document.xlsx')
        stem = Path(filename).stem
        
        in_path = TEMP_DIR / f"upload_{stem}.xlsx"
        out_path = TEMP_DIR / f"{stem}_converted.pdf"
        
        in_path.write_bytes(file_bytes)
        excel_to_pdf(str(in_path), str(out_path))
        self._send_file_response(str(out_path), f"{stem}.pdf", "application/pdf")

    def _handle_pdf_watermark(self, req: dict):
        file_bytes = base64.b64decode(req['file_base64'])
        filename = req.get('filename', 'document.pdf')
        stem = Path(filename).stem
        text = req.get('text', 'CONFIDENTIAL')
        opacity = float(req.get('opacity', 0.3))
        angle = float(req.get('angle', 45))
        color = req.get('color', '#ef4444')
        
        in_path = TEMP_DIR / f"upload_{stem}.pdf"
        out_path = TEMP_DIR / f"{stem}_watermarked.pdf"
        
        in_path.write_bytes(file_bytes)
        add_watermark(str(in_path), str(out_path), text=text, opacity=opacity, angle=angle, color_hex=color)
        self._send_file_response(str(out_path), f"{stem}_watermark.pdf", "application/pdf")

    def _handle_pdf_rotate(self, req: dict):
        file_bytes = base64.b64decode(req['file_base64'])
        filename = req.get('filename', 'document.pdf')
        stem = Path(filename).stem
        angle = int(req.get('angle', 90))
        pages = req.get('pages', None)
        
        in_path = TEMP_DIR / f"upload_{stem}.pdf"
        out_path = TEMP_DIR / f"{stem}_rotated.pdf"
        
        in_path.write_bytes(file_bytes)
        rotate_pages(str(in_path), str(out_path), angle=angle, pages=pages)
        self._send_file_response(str(out_path), f"{stem}_rotated.pdf", "application/pdf")

    def _handle_pdf_merge(self, req: dict):
        files = req.get('files', [])
        if not files or len(files) < 2:
            self._send_error_json("Please provide at least 2 files to merge")
            return
            
        saved_paths = []
        for idx, item in enumerate(files):
            fb = base64.b64decode(item['file_base64'])
            p = TEMP_DIR / f"merge_part_{idx}.pdf"
            p.write_bytes(fb)
            saved_paths.append(str(p))
            
        out_path = TEMP_DIR / "merged_output.pdf"
        merge_pdfs(saved_paths, str(out_path))
        self._send_file_response(str(out_path), "merged_document.pdf", "application/pdf")

    def _handle_pdf_delete_pages(self, req: dict):
        file_bytes = base64.b64decode(req['file_base64'])
        filename = req.get('filename', 'document.pdf')
        stem = Path(filename).stem
        pages_to_del = req.get('pages_to_delete', [])
        
        in_path = TEMP_DIR / f"upload_{stem}.pdf"
        out_path = TEMP_DIR / f"{stem}_edited.pdf"
        
        in_path.write_bytes(file_bytes)
        delete_pages(str(in_path), str(out_path), pages_to_delete=pages_to_del)
        self._send_file_response(str(out_path), f"{stem}_edited.pdf", "application/pdf")

def run(port=4000):
    server_address = ('127.0.0.1', port)
    httpd = ThreadedHTTPServer(server_address, OfficeRequestHandler)
    print(f"Offfice tool server running on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
    run(port)
