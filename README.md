# 🌟 Offfice tool Pro - Bộ Công Cụ Văn Phòng & Chuyển Đổi Tệp Đa Nền Tảng

> [Ma trận tính năng và giới hạn sản phẩm](PRODUCT_MATRIX.md)

## Không gian làm việc cục bộ

Mở tab **Gần đây** để xem bản nháp Word/Excel/Slides tự lưu, tìm và tải lại kết quả chuyển đổi hoặc PDF đã sửa. Nút **Sao lưu ZIP** xuất toàn bộ bản nháp và kết quả đã lưu; **Khôi phục** nhập lại ZIP sau khi đổi trình duyệt hoặc thiết bị. Dữ liệu chỉ lưu trong trình duyệt hiện tại. Lịch sử giữ tối đa 30 tệp, 20 MB mỗi tệp và 100 MB tổng; hãy tải kết quả lớn ngay sau khi xử lý.

Kiểm thử: `node --test scripts/test_workspace.cjs`; kiểm thử giao diện trong Chrome khi server chạy ở cổng 4000: `node scripts/smoke_browser.cjs`. Bộ test Python dùng interpreter được gọi từ `run.cmd` nếu đã có Python.

> **Hệ sinh thái Office toàn diện, bảo mật & siêu tốc dành cho PC, iOS và Android.**  
> Chuẩn hoạt hình **RGP 9.0 Fluid Motion**, âm thanh phản hồi haptic xúc giác (Web Audio API), xử lý tệp 100% thật và tuyệt đối không dùng code giả demo.

---

## 🚀 Các Tính Năng Đột Phá

### 1. Trung Tâm Chuyển Đổi Tệp Đa Năng (Core Feature)
- 📄 **Word sang PDF (.docx ➔ .pdf)**: Giữ nguyên định dạng tiêu đề, danh sách, màu chữ và bảng biểu chuẩn in ấn A4.
- 📝 **PDF sang Word (.pdf ➔ .docx)**: Phân tích layout, tọa độ khối văn bản và bảng biểu từ PDF để tái tạo thành tệp .docx chỉnh sửa được.
- 📊 **PDF sang Excel (.pdf ➔ .xlsx)**: Tự động trích xuất các bảng dữ liệu, phân tách cột số liệu thành các bảng tính Excel (.xlsx) chuẩn OpenXML.
- 📈 **Excel sang PDF (.xlsx ➔ .pdf)**: Định dạng bảng tính thành tệp PDF khổ ngang A4 sắc nét.
- 🖼️ **Ảnh sang PDF (PNG/JPG ➔ .pdf)**: Ghép nhiều ảnh chụp tài liệu thành tệp PDF duy nhất.

### 2. Menu Chỉnh Sửa File PDF Theo Ý Muốn
- 🔄 **Xoay trang**: Xoay 90°, 180°, 270° từng trang hoặc toàn bộ tài liệu.
- 🛡️ **Đóng dấu bản quyền (Watermark)**: Tùy chỉnh chữ chìm (e.g. *BẢN QUYỀN*, *CONFIDENTIAL*), độ trong suốt, màu sắc và góc nghiêng.
- ✍️ **Ký tên điện tử (Digital Signature)**: Bảng vẽ chữ ký cảm ứng mượt mà (hỗ trợ ngón tay trên iOS/Android và chuột trên PC), đóng dấu chữ ký vào đúng trang mong muốn.
- 📑 **Xem thumbnail trực quan**: Xem trước toàn bộ trang PDF theo thời gian thực.
- 💾 **Lưu & tải về ngay lập tức**: Xuất tệp PDF sau chỉnh sửa chỉ với 1 cú click.

### 3. Word Document Studio
- Trình soạn thảo văn bản trực quan (WYSIWYG) mô phỏng trang A4 chân thực.
- Thanh công cụ Ribbon: Tiêu đề H1/H2/H3, In đậm, In nghiêng, Gạch chân, Gạch ngang, Căn lề, Chèn bảng, Danh sách.
- Mở file `.docx` có sẵn để đọc và chỉnh sửa trực tiếp.
- Xuất file sang định dạng `.docx` hoặc `.pdf`.

### 4. Excel Spreadsheet Studio
- Lưới bảng tính động không giới hạn hàng và cột.
- Thanh nhập công thức với bộ tính toán thời gian thực: `=SUM(A1:A5)`, `=AVERAGE(...)`, `=IF(...)`, `=B2*C2`.
- Định dạng ô: In đậm, in nghiêng, màu sắc, căn lề.
- Mở file `.xlsx` và xuất sang `.xlsx` hoặc `.csv`.

### 5. PowerPoint / Slides Studio
- Trình tạo bài thuyết trình đa slide với danh sách thumbnail trực quan.
- Thêm tiêu đề, đoạn văn bản, nhãn điểm nhấn (badge), đổi màu chủ đề.
- **Chế độ Thuyết Trình Toàn Màn Hình (Presentation Mode)**: Điều hướng phím mũi tên hoặc chạm vuốt trên mobile, nhấn `Esc` để thoát.
- Xuất bài thuyết trình sang định dạng `.pptx`.

---

## 📱 Khả Năng Thích Ứng Đa Nền Tảng (PC, iOS, Android)

Hệ thống tích hợp bộ nhận diện nền tảng thông minh `PlatformEngine`:
- 🍏 **Chế độ iOS (Cupertino)**: Tối ưu typography SF Pro, thanh điều hướng đáy dạng kính mờ (frosted glass blur), góc bo cong Apple chuẩn mực.
- 🤖 **Chế độ Android (Material You)**: Thiết kế Material 3 với thanh điều hướng dạng viên thuốc, nút hành động nổi (FAB) và độ bóng nổi 3D.
- 💻 **Chế độ PC Desktop Pro**: Thanh công cụ Ribbon đầy đủ, hỗ trợ phím tắt và không gian làm việc kép rộng rãi.

---

## 🎨 Chuẩn Hoạt Hình RGP 9.0 & Giao Diện Cao Cấp
- Tần số quét 60/120fps siêu mượt với gia tốc `cubic-bezier(0.16, 1, 0.3, 1)`.
- Hiệu ứng viền phát sáng đa sắc (RGB Glowing Border & Dynamic Aurora Aura).
- Phân tầng bề mặt 4 lớp: Nền sâu (`#060911`) ➔ Thẻ kính mờ (`rgba(15,23,42,0.75)`) ➔ Lớp nổi ➔ Điểm nhấn màu sắc.
- Tích hợp âm thanh phản xạ điện tử qua **Web Audio API** (micro-click, swoop, fanfare) kèm nút Bật/Tắt âm thanh tiện lợi.

---

## 🛠️ Hướng Dẫn Sử Dụng Trên PC

### Cách 1: Khởi động Server Siêu Tốc (Khuyên Dùng Trên PC)
Nhấp đúp chuột vào tệp:
```bat
run.cmd
```
Ứng dụng sẽ tự động mở trình duyệt tại địa chỉ `http://127.0.0.1:4000` với đầy đủ sức mạnh xử lý của Python và Node.js.

### Cách 2: Mở Trực Tiếp Trình Duyệt (Web Client Mode)
Chỉ cần nhấp đúp vào tệp `index.html`. Ứng dụng sẽ chạy 100% bằng JavaScript client-side mà không cần cài đặt bất kỳ phần mềm nào khác!

---

## 🌐 Hướng Dẫn Đưa Lên GitHub & Sử Dụng Trên Điện Thoại (iOS / Android)

### Bước 1: Đẩy mã nguồn lên GitHub của bạn
Chạy tệp:
```bat
push-github.cmd
```
Nhập đường dẫn GitHub Repository của bạn (ví dụ: `https://github.com/<username>/Offfice-tool.git`), script sẽ tự động commit và đẩy toàn bộ mã nguồn lên GitHub.

### Bước 2: Kích hoạt GitHub Pages (Miễn phí)
1. Truy cập vào Repository trên GitHub.
2. Vào **Settings** ➔ **Pages**.
3. Tại phần **Build and deployment** ➔ **Source**: Chọn **Deploy from a branch**.
4. Branch: Chọn `main`, folder `/ (root)` rồi nhấn **Save**.
5. Sau 1 phút, bạn sẽ có đường link web miễn phí để mở trên iPhone/Android:
   ```
   https://<username>.github.io/<ten-repo>/
   ```

---

## 🔒 Kiểm Thử & Cam Kết Chất Lượng (100% Pass Invariant)
Toàn bộ mã nguồn đã vượt qua kiểm thử tự động toàn diện:
- `test_conversions.py`: Chuyển đổi Word ➔ PDF ➔ Word ➔ Excel ➔ PDF thành công 100%.
- `test_pdf_editor.py`: Đóng dấu Watermark, xoay trang, gộp trang, tách trang thành công 100%.
- `test_api_server.py`: API Server xử lý đa luồng phản hồi chuẩn xác.
