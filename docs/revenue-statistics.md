# Thống kê doanh thu tháng

## Cấu trúc được tái sử dụng

- `MonthlyRevenueEntity` / bảng `monthlyRevenue`: giữ nguyên schema, quan hệ `user_id` và unique constraint `(user_id, year, month)`. Không tạo bảng doanh thu Owner/Admin mới.
- Owner/Admin là `UserEntity.role`, không phải entity riêng.
- `RentalRequest` là DTO; yêu cầu thuê được lưu bằng `ContractEntity` có trạng thái `PENDING`. Duyệt chuyển cùng record sang `APPROVED`.
- Giá được chụp vào `Contract.rentPrice` khi tạo yêu cầu. Thống kê chỉ dùng giá này.
- `CurrentUserContext` cung cấp ID từ authentication; `NotificationService` và API gửi riêng hiện có được tái sử dụng.

## File sửa/khôi phục và lý do

| File | Thay đổi |
| --- | --- |
| `backend/src/main/java/com/javaweb/repository/MonthlyRevenueRepository.java` | Khôi phục file đang bị xóa trong workspace; giữ method cũ, thêm truy vấn theo Owner/tháng, lịch sử và aggregate Admin. |
| `backend/src/main/java/com/javaweb/repository/UserRepository.java` | Khóa Owner bằng `PESSIMISTIC_WRITE`, liệt kê tất cả Owner cho scheduler, LEFT JOIN tìm Owner thiếu thống kê. |
| `backend/src/main/java/com/javaweb/repository/ContractRepository.java` | SUM `rentPrice` theo Owner, ngày giao tháng và trạng thái hợp lệ. Chỉ dùng khi thiếu record doanh thu. |
| `backend/src/main/java/com/javaweb/service/impl/ContractServiceImpl.java` | Gọi cập nhật doanh thu trong transaction duyệt, dùng `READ_COMMITTED`. Giữ cancel/terminate không điều chỉnh doanh thu. |
| `backend/src/main/java/com/javaweb/api/OwnerController.java` | Thêm API tháng hiện tại và lịch sử cho Owner đăng nhập. |
| `backend/src/main/java/com/javaweb/api/AdminController.java` | Thêm API tổng hợp hiện tại, lịch sử và Owner thiếu thống kê. |
| `backend/src/main/java/com/javaweb/config/WebSecurityConfig.java` | Cho phép role OWNER truy cập GET doanh thu, không yêu cầu scope ghi phòng. Service cũng kiểm tra role. |
| `backend/pom.xml` | Thêm H2 với scope test để kiểm tra repository, transaction và concurrency bằng database biệt lập. |
| `backend/src/test/java/com/javaweb/service/impl/ContractTerminationTest.java` | Bổ sung mock RevenueService cho dependency mới, giữ các test đang có. |
| `frontend/src/pages/OwnerDashboard.js`, `frontend/src/pages/AdminDashboard.js` | Gắn component thống kê vào dashboard hiện có. |

## File mới

| File | Mục đích |
| --- | --- |
| `backend/src/main/java/com/javaweb/service/RevenueService.java` | Interface nghiệp vụ thống kê. |
| `backend/src/main/java/com/javaweb/service/impl/RevenueServiceImpl.java` | GET OR CREATE, cộng incremental, aggregate Admin và lịch sử. Hoa hồng cố định 5%. |
| `backend/src/main/java/com/javaweb/model/response/RevenueResponse.java` | DTO `year`, `month`, `revenue`, `profit`, tránh trả entity và quan hệ người dùng. |
| `backend/src/main/java/com/javaweb/model/response/OwnerRevenueStatusResponse.java` | DTO Owner chưa thống kê: `id`, `fullName`, `username`. |
| `backend/src/main/java/com/javaweb/config/RevenueClockConfig.java` | Clock theo giờ Việt Nam, có thể thay bằng clock cố định trong test. |
| `backend/src/main/java/com/javaweb/scheduler/RevenueScheduler.java` | Khởi tạo tháng hiện tại cho từng Owner, transaction riêng để lỗi một Owner không chặn các Owner khác. |
| `backend/src/test/java/com/javaweb/service/impl/RevenueServiceImplTest.java` | Kiểm tra không quét Contract khi đã có record, giá snapshot, không cộng đôi, biên múi giờ. |
| `backend/src/test/java/com/javaweb/service/impl/RevenueIntegrationTest.java` | Kiểm tra JPQL, ngày biên, trạng thái, khởi tạo lặp, duyệt đồng thời, terminate và rollback. |
| `backend/src/test/java/com/javaweb/service/impl/RevenueAuthorizationTest.java` | Kiểm tra role và lịch sử theo ID người đăng nhập. |
| `frontend/src/services/revenueService.js` | Gọi API thống kê và tái sử dụng API thông báo riêng. |
| `frontend/src/components/RevenueOverview.js` | Nút Thống kê, lịch sử, danh sách Owner thiếu thống kê và gửi nhắc. |
| `frontend/src/components/RevenueOverview.test.jsx` | Kiểm tra thao tác tải dữ liệu, cập nhật lịch sử, gửi nhắc và lỗi. |
| `docs/revenue-statistics.md` | Tài liệu triển khai này. |

Các thay đổi khác có sẵn trong workspace không thuộc tính năng này. Không khôi phục các SQL migration đang bị xóa và không thay đổi schema entity.

## API

| Quyền | Method / URL | Hành vi |
| --- | --- | --- |
| Owner | `GET /api/owners/me/revenue/current` | Lấy record hiện tại; thiếu mới khởi tạo. Không nhận ownerId. |
| Owner | `GET /api/owners/me/revenue/history` | Chỉ đọc doanh thu của người đăng nhập, năm/tháng giảm dần. |
| Admin | `GET /api/admin/revenue/current` | SUM doanh thu Owner tháng hiện tại, profit = SUM × 5%. |
| Admin | `GET /api/admin/revenue/history` | GROUP BY năm/tháng từ doanh thu Owner, năm/tháng giảm dần. |
| Admin | `GET /api/admin/revenue/missing-owners` | ALL OWNER LEFT JOIN doanh thu tháng hiện tại, chọn record thiếu. |
| Admin | `POST /api/admin/notifications/{receiverId}` | API có sẵn, body `{ "title": "...", "content": "..." }`; dùng gửi nhắc khi Admin bấm nút. |

Các API thống kê trả HTTP 200, lịch sử/danh sách rỗng trả `[]`. Không có dữ liệu tổng hợp thì Admin hiện tại trả doanh thu/lợi nhuận bằng 0. Admin không tự khởi tạo Owner và không truy vấn Contract, nên tổng chỉ gồm Owner đã có record.

## Schedule và quy tắc tính

Cron `0 0 7 1 * *`, zone `Asia/Ho_Chi_Minh`: 07:00 ngày 1 mỗi tháng, tính **tháng hiện tại**. Chạy lại không cộng thêm. Nếu server bỏ lỡ schedule, nút Thống kê Owner là fallback.

Khởi tạo SUM các Contract APPROVED/TERMINATED/EXPIRED thỏa `startDate <= cuối tháng` và `endDate >= đầu tháng`. PENDING/CANCELLED bị loại vì chúng là yêu cầu chưa được chấp nhận trong model hiện tại. Mỗi Contract tính toàn bộ `rentPrice`, không prorate và không đọc giá RoomType.

Owner lưu commissionPercent = 5 và profit = revenue × 95%, làm tròn 2 chữ số HALF_UP bằng BigDecimal. Admin tính profit = tổng revenue Owner × 5%, không lưu record riêng.

## Duyệt và transaction/concurrency

1. Transaction duyệt giữ khóa phòng và Contract theo cơ chế hiện có, kiểm tra PENDING và quyền Owner/Admin.
2. Chuyển Contract thành APPROVED, cập nhật phòng, hủy các yêu cầu PENDING khác của cùng phòng.
3. Gọi `RevenueService.addApprovedContract` trong chính transaction đó (`MANDATORY`). Contract ngoài tháng hiện tại không cập nhật doanh thu.
4. Khóa hàng User của Owner (`SELECT ... FOR UPDATE`) trước khi đọc/ghi thống kê. Nút thống kê và scheduler cũng dùng cùng khóa này, kể cả khi record doanh thu chưa tồn tại.
5. Nếu record đã có: cộng `rentPrice`, cập nhật profit, không truy vấn Contract. Nếu chưa có: flush trạng thái APPROVED rồi SUM; Contract vừa duyệt đã nằm trong SUM nên **không cộng thêm**.
6. Lưu thông báo và commit cùng transaction. Bất kỳ lỗi runtime nào cũng rollback việc duyệt/phòng/doanh thu/thông báo.

`READ_COMMITTED` trên transaction duyệt/khởi tạo giúp đọc dữ liệu mới sau khi chờ khóa, tránh snapshot cũ của MySQL REPEATABLE_READ. Khóa Owner giữ đến commit ngăn lost update và tạo trùng; unique constraint hiện có là lớp bảo vệ bổ sung. SUM Contract là đọc thường, không khóa toàn bộ Contract. Không có khóa JVM nên cơ chế vẫn áp dụng khi chạy nhiều instance dùng chung database.

Cancel/reject không gọi RevenueService. Terminate giữ `endDate = ngày hiện tại` và không trừ tháng hiện tại; khởi tạo tháng sau tự loại Contract đã hết hiệu lực.

## Kiểm tra

- Backend: `cd backend` rồi `.\mvnw.cmd test` (Java 21).
- Frontend: `cd frontend` rồi `npm.cmd test` và `npm.cmd run build`.
- Integration test dùng H2 MySQL mode, không kết nối database triển khai. Điều này kiểm tra truy vấn và transaction, nhưng không thay thế kiểm thử engine MySQL thực tế.
