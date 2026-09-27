# Ma trận tính năng sản phẩm

## Sản phẩm phục vụ việc gì?

Offfice tool là bộ công cụ văn phòng cá nhân chạy trong trình duyệt: chuyển đổi tệp, sửa PDF, soạn Word, làm bảng tính và tạo slide. GitHub Pages phục vụ phiên bản web tĩnh; Python server trên máy người dùng tăng khả năng chuyển đổi khi có sẵn. Dữ liệu làm việc thuộc về thiết bị và trình duyệt đang mở, không có tài khoản hay kho lưu trữ đám mây.

Ưu tiên của vòng này là **không mất công việc** và **tìm lại kết quả**, vì trước đó bản nháp biến mất sau khi tải lại trang và kết quả chuyển đổi chỉ có thể tải một lần.

| Nhu cầu | Hiện trạng sau vòng này | Quyết định sản phẩm |
|---|---|---|
| Chức năng cốt lõi | 7 kiểu chuyển đổi, sửa PDF, Word, Excel, Slides | Giữ các luồng hiện có; kiểm tra phần mở rộng/dung lượng tệp và sửa lưu Excel bằng Ctrl+S. |
| Tìm kiếm, lọc | Tìm tên tệp đầu vào/đầu ra; lọc theo kiểu kết quả | Có trong **Gần đây**. Tìm nội dung bên trong tệp cần chỉ mục riêng, chưa phù hợp với app cục bộ gọn nhẹ. |
| Lịch sử, activity history | Lưu tối đa 30 kết quả chuyển đổi hoặc PDF đã sửa, tải lại và xóa từng mục | Lưu Blob trong IndexedDB trên trình duyệt. Giới hạn 20 MB/tệp, 100 MB tổng. |
| Thống kê, dashboard | Số bản nháp, số kết quả, dung lượng kết quả | Chỉ số phục vụ quản lý dung lượng, không tạo biểu đồ trang trí. |
| Automation | Tự lưu bản nháp Word, Excel, Slides sau chỉnh sửa | Lưu cục bộ, phục hồi sau tải lại trang; hiển thị trạng thái và lỗi lưu. |
| Import/export | Mở và xuất các định dạng gốc hiện có | Bổ sung nhập/xuất bản sao lưu toàn bộ không gian làm việc bằng ZIP. |
| Backup/restore, error recovery | ZIP gồm bản nháp và kết quả đã lưu; xác thực dữ liệu trước khi khôi phục | Không ghi một phần khi bản sao lưu sai cấu trúc; hỏi xác nhận khi bản nháp trùng loại sẽ bị thay thế. |
| Notification | Trạng thái tự lưu, thông báo sao lưu/khôi phục/lỗi | Thông báo trong màn hình Gần đây; các thao tác chỉnh sửa cũ vẫn dùng thông báo của từng công cụ. |
| User settings, customization | Chế độ giao diện theo nền tảng, bật/tắt âm thanh, chủ đề slide | Hai cài đặt đầu lưu trên thiết bị. Chưa cần cấu hình phức tạp hơn. |
| Permission, quản trị, audit log | Chưa áp dụng | Đây là app cá nhân không có tài khoản, vai trò hay máy chủ dùng chung. Chỉ thiết kế phân quyền/audit khi thêm đồng bộ nhiều người dùng. |
| Report | Xuất tài liệu và bảng tính bằng công cụ hiện có | Báo cáo tổng hợp lịch sử sẽ chỉ hữu ích khi có nhu cầu phân tích thực tế; chưa thêm biểu đồ giả. |
| Batch operations | Ghép nhiều ảnh thành PDF và gộp PDF | Không thêm xử lý hàng loạt cho các định dạng khác khi chưa có luồng kiểm tra lỗi từng tệp. |
| Integrations | Python engine cục bộ tùy chọn; GitHub Pages | Không thêm kết nối tài khoản bên thứ ba vào app chưa có định danh người dùng. |
| Productivity, usability | Tự lưu, tải lại kết quả, điều hướng Gần đây, phím tắt, focus và giao diện đáp ứng | Chuẩn hóa trạng thái ẩn, kích thước điều khiển, nhãn PDF, modal và giảm chuyển động theo cài đặt hệ thống. |

### Giới hạn rõ ràng

- IndexedDB gắn với **trình duyệt và địa chỉ trang**. Xóa dữ liệu trình duyệt hoặc đổi máy sẽ mất bản nháp nếu chưa tải ZIP sao lưu.
- Tệp vượt giới hạn lưu lịch sử vẫn có thể tải ngay sau khi xử lý; giao diện báo nếu không thể giữ bản sao cục bộ.
- GitHub Pages chạy phần giao diện và engine JavaScript. Python API chỉ có khi chạy `run.cmd` trên máy hỗ trợ Python.
