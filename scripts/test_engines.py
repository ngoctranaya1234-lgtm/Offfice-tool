import os
import sys

print("Testing Python engines...")
try:
    import docx
    print("[OK] python-docx loaded")
except Exception as e:
    print(f"[FAIL] python-docx: {e}")

try:
    import openpyxl
    print("[OK] openpyxl loaded")
except Exception as e:
    print(f"[FAIL] openpyxl: {e}")

try:
    import pdfplumber
    print("[OK] pdfplumber loaded")
except Exception as e:
    print(f"[FAIL] pdfplumber: {e}")

try:
    import pypdf
    print("[OK] pypdf loaded")
except Exception as e:
    print(f"[FAIL] pypdf: {e}")

try:
    import reportlab
    print("[OK] reportlab loaded")
except Exception as e:
    print(f"[FAIL] reportlab: {e}")

try:
    import pandas as pd
    print("[OK] pandas loaded")
except Exception as e:
    print(f"[FAIL] pandas: {e}")
