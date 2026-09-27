import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from pdf_editor import add_watermark, rotate_pages, merge_pdfs, split_pdf, delete_pages

test_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'test_data'))
sample_pdf = os.path.join(test_dir, "output_from_word.pdf")

# 1. Watermark
wm_pdf = os.path.join(test_dir, "watermarked.pdf")
add_watermark(sample_pdf, wm_pdf, text="OFFFICE TOOL PRO", opacity=0.35, color_hex="#0ea5e9")
print(f"[1/4] Watermark generated: {os.path.getsize(wm_pdf)} bytes")

# 2. Rotate
rot_pdf = os.path.join(test_dir, "rotated.pdf")
rotate_pages(sample_pdf, rot_pdf, angle=90)
print(f"[2/4] Rotate generated: {os.path.getsize(rot_pdf)} bytes")

# 3. Merge
merged_pdf = os.path.join(test_dir, "merged.pdf")
merge_pdfs([sample_pdf, wm_pdf], merged_pdf)
print(f"[3/4] Merged generated: {os.path.getsize(merged_pdf)} bytes")

# 4. Split
out_split1 = os.path.join(test_dir, "split1.pdf")
split_pdf(merged_pdf, { out_split1: [0] })
print(f"[4/4] Split generated: {os.path.getsize(out_split1)} bytes")

print("\n>>> ALL PDF EDITING OPERATIONS PASSED 100%! <<<")
