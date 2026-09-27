import os
import sys
import json
import base64
import urllib.request

server_url = "http://127.0.0.1:4000"
test_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'test_data'))

def test_api(endpoint, in_path, filename):
    with open(in_path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('utf-8')
    
    payload = json.dumps({
        'file_base64': b64,
        'filename': filename
    }).encode('utf-8')
    
    req = urllib.request.Request(
        f"{server_url}{endpoint}",
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        assert res_data['status'] == 'success'
        out_bytes = base64.b64decode(res_data['data_base64'])
        print(f"[API SUCCESS] {endpoint} -> Output file: {res_data['filename']} ({len(out_bytes)} bytes)")
        return out_bytes

print("Testing API Server Endpoints...")
sample_docx = os.path.join(test_dir, "sample.docx")
sample_pdf = os.path.join(test_dir, "output_from_word.pdf")
sample_xlsx = os.path.join(test_dir, "extracted_tables.xlsx")

# 1. Word to PDF
test_api('/api/convert/word-to-pdf', sample_docx, 'sample.docx')

# 2. PDF to Word
test_api('/api/convert/pdf-to-word', sample_pdf, 'output_from_word.pdf')

# 3. PDF to Excel
test_api('/api/convert/pdf-to-excel', sample_pdf, 'output_from_word.pdf')

# 4. Excel to PDF
test_api('/api/convert/excel-to-pdf', sample_xlsx, 'extracted_tables.xlsx')

print("\n>>> ALL API SERVER CONVERSIONS PASSED 100% WITH ZERO MOCKS! <<<")
