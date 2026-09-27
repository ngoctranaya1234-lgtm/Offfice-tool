import os
from PIL import Image, ImageDraw, ImageFont

def generate_app_icons():
    out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'icons')
    os.makedirs(out_dir, exist_ok=True)

    sizes = [192, 512]
    for size in sizes:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Background rounded box
        bg_color = (10, 15, 29, 255) # #0a0f1d
        radius = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=bg_color)

        # Subtle gradient / glow circle
        glow_center = (int(size * 0.5), int(size * 0.45))
        glow_r = int(size * 0.42)
        draw.ellipse([glow_center[0] - glow_r, glow_center[1] - glow_r,
                      glow_center[0] + glow_r, glow_center[1] + glow_r],
                     outline=(14, 165, 233, 80), width=int(size * 0.03))

        # Main Document Shape (Folded top-right corner)
        doc_x0 = int(size * 0.25)
        doc_y0 = int(size * 0.18)
        doc_x1 = int(size * 0.75)
        doc_y1 = int(size * 0.82)
        fold = int(size * 0.14)

        # Doc body polygon
        doc_points = [
            (doc_x0, doc_y0),
            (doc_x1 - fold, doc_y0),
            (doc_x1, doc_y0 + fold),
            (doc_x1, doc_y1),
            (doc_x0, doc_y1)
        ]
        draw.polygon(doc_points, fill=(15, 23, 42, 255), outline=(56, 189, 248, 255))

        # Fold corner
        fold_points = [
            (doc_x1 - fold, doc_y0),
            (doc_x1 - fold, doc_y0 + fold),
            (doc_x1, doc_y0 + fold)
        ]
        draw.polygon(fold_points, fill=(30, 41, 59, 255), outline=(56, 189, 248, 255))

        # Horizontal accent bars inside doc
        line_w = int(size * 0.04)
        for i in range(3):
            ly = doc_y0 + fold + int(size * 0.12) + (i * int(size * 0.11))
            lw = int(size * 0.35) if i < 2 else int(size * 0.22)
            c = (56, 189, 248, 240) if i == 0 else ((16, 185, 129, 240) if i == 1 else (245, 158, 11, 240))
            draw.rounded_rectangle([doc_x0 + int(size * 0.08), ly, doc_x0 + int(size * 0.08) + lw, ly + line_w],
                                   radius=int(line_w / 2), fill=c)

        # Bold "O" emblem in lower-right
        emblem_r = int(size * 0.18)
        em_cx = int(size * 0.72)
        em_cy = int(size * 0.72)
        draw.ellipse([em_cx - emblem_r, em_cy - emblem_r, em_cx + emblem_r, em_cy + emblem_r],
                     fill=(14, 165, 233, 255), outline=(255, 255, 255, 220), width=int(size * 0.02))
        
        # Inner hole for "O"
        inner_r = int(emblem_r * 0.5)
        draw.ellipse([em_cx - inner_r, em_cy - inner_r, em_cx + inner_r, em_cy + inner_r],
                     fill=(10, 15, 29, 255))

        png_path = os.path.join(out_dir, f'icon-{size}x{size}.png')
        img.save(png_path, 'PNG')
        print(f"Generated: {png_path}")

    # Also generate apple-touch-icon.png (180x180) and favicon.png (64x64)
    img_192 = Image.open(os.path.join(out_dir, 'icon-192x192.png'))
    img_180 = img_192.resize((180, 180), Image.Resampling.LANCZOS)
    img_180.save(os.path.join(out_dir, 'apple-touch-icon.png'), 'PNG')

    img_64 = img_192.resize((64, 64), Image.Resampling.LANCZOS)
    img_64.save(os.path.join(out_dir, 'favicon.png'), 'PNG')
    print("All icons successfully generated!")

if __name__ == '__main__':
    generate_app_icons()
