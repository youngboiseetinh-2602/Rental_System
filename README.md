# Rental Room System

## Mô tả hệ thống

Rental Room System là ứng dụng web hỗ trợ tìm kiếm và quản lý phòng trọ, kết nối người thuê với chủ trọ. Hệ thống hỗ trợ quy trình từ xem thông tin phòng, gửi yêu cầu thuê đến xử lý yêu cầu và quản lý hợp đồng, đồng thời cung cấp chức năng đánh giá, thông báo và nhắn tin thời gian thực.

Hệ thống phục vụ các nhóm người dùng:

| Nhóm người dùng | Chức năng chính |
| --- | --- |
| Khách truy cập | Xem danh sách, chi tiết cơ sở cho thuê và đánh giá; đăng ký tài khoản. |
| Người thuê | Gửi, theo dõi và hủy yêu cầu thuê; quản lý đánh giá, thông tin cá nhân và mật khẩu; nhận thông báo. |
| Chủ trọ | Quản lý cơ sở cho thuê, hình ảnh, loại phòng, phòng và tiện nghi; xử lý yêu cầu thuê; xem hợp đồng, danh sách người thuê và gửi thông báo. |
| Quản trị viên | Quản lý người dùng, trạng thái tài khoản và danh mục loại hình cho thuê; chấm dứt hợp đồng. |

Người dùng đã đăng nhập có thể trao đổi qua chat thời gian thực, đánh dấu hội thoại đã đọc và chặn hoặc bỏ chặn hội thoại. Hình ảnh được tích hợp với ImageKit.

Ứng dụng gồm frontend React giao tiếp với backend Spring Boot qua REST API và WebSocket. Backend xử lý nghiệp vụ, phân quyền, xác thực OAuth2 và lưu trữ dữ liệu bằng MySQL.

## Tech stack

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, Vite 7, React Router 6, Bootstrap 5 |
| Backend | Java 21, Spring Boot 3.5.0, Spring Web, Spring Validation |
| Truy cập dữ liệu | Spring Data JPA, Hibernate, MySQL |
| Xác thực và phân quyền | Spring Security, OAuth2 Authorization Server, OAuth2 Resource Server, JWT, Authorization Code với PKCE |
| Nhắn tin thời gian thực | Spring WebSocket, STOMP, `@stomp/stompjs` |
| Lưu trữ hình ảnh | ImageKit |
| Thư viện hỗ trợ backend | Lombok, ModelMapper |
| Kiểm thử | Spring Boot Test, Spring Security Test, Vitest, jsdom |
| Build và đóng gói | Maven Wrapper, npm, Docker, Docker Compose, Nginx |
| Triển khai và CI/CD | Vercel cho frontend, Render cho backend, GitHub Actions kiểm thử/build backend và gọi Render deploy hook |

## URL deploy

| Thành phần | URL |
| --- | --- |
| Website — Frontend | [rental-system-bice.vercel.app](https://rental-system-bice.vercel.app) |
| Backend | [rental-system-1-72fo.onrender.com](https://rental-system-1-72fo.onrender.com) |
| Kiểm tra trạng thái backend | [/api/public/health](https://rental-system-1-72fo.onrender.com/api/public/health) |

Các URL trên được lấy từ cấu hình production trong dự án: [frontend/.env.production](frontend/.env.production) và [application-production.properties](backend/src/main/resources/application-production.properties).
