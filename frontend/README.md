# Rental Room System — Frontend

Giao diện React cho hệ thống tìm kiếm và quản lý phòng trọ, sử dụng React 19, Vite 7, React Router 6 và Bootstrap 5. Chat thời gian thực sử dụng STOMP qua WebSocket.

Mô tả hệ thống, tech stack và URL deploy: [README chính](../README.md).

## Chạy local

Cần Node.js 22.12+ và npm, cùng backend đang chạy tại địa chỉ cấu hình bên dưới. Mở terminal tại `frontend/`:

```bash
npm ci
npm start
```

Truy cập `http://localhost:3000`.

## Cấu hình môi trường

| Biến | Ý nghĩa | Mặc định trong mã nguồn |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Địa chỉ backend, không thêm `/api` | Cần cung cấp qua file môi trường |
| `VITE_AUTHORIZATION_SERVER_URL` | Máy chủ OAuth2 | Dùng `VITE_API_BASE_URL` |
| `VITE_RESOURCE_SERVER_URL` | Máy chủ API và WebSocket | Dùng `VITE_API_BASE_URL` |
| `VITE_OAUTH_CLIENT_ID` | Client ID đăng ký tại backend | `rental-spa` |
| `VITE_OAUTH_REDIRECT_URI` | Callback sau xác thực | Origin hiện tại + `/callback` |

`.env.development` hiện sử dụng:

```properties
VITE_API_BASE_URL=http://localhost:8080
```

Để ghi đè cấu hình trên máy cá nhân, tạo `.env.development.local`. Khởi động lại Vite sau khi sửa biến môi trường. Không đặt mật khẩu hoặc private key trong biến `VITE_*` vì chúng được đưa vào mã frontend.

Build mặc định sử dụng `.env.production`, hiện trỏ tới backend trên Render. Kiểm tra địa chỉ trước khi build cho môi trường khác; thay đổi biến môi trường sau khi build cần build lại.

## Các lệnh

Chạy từ thư mục `frontend/`:

| Lệnh | Chức năng |
| --- | --- |
| `npm ci` | Cài dependency theo lockfile |
| `npm start` hoặc `npm run dev` | Chạy Vite ở cổng 3000 |
| `npm test` | Chạy kiểm thử Vitest một lần với jsdom |
| `npm run build` | Build production vào `dist/` |
| `npm run build -- --mode development` | Build với cấu hình development |
| `npm run preview` | Xem bản build ở cổng 3000; cần build trước |

## Cấu trúc

```text
frontend/
├── public/              # Tài nguyên tĩnh
├── src/
│   ├── assets/          # Hình ảnh được import
│   ├── components/      # Component, layout và kiểm soát truy cập route
│   ├── constants/       # Cấu hình URL API, OAuth2 và WebSocket
│   ├── contexts/        # Trạng thái xác thực và chat
│   ├── hooks/           # Hook xác thực và chat thời gian thực
│   ├── pages/           # Trang người thuê, chủ trọ, quản trị và khách
│   ├── services/        # API, xác thực, upload ảnh và socket
│   ├── styles/          # CSS dùng chung
│   ├── test/            # Thiết lập môi trường kiểm thử
│   ├── utils/           # Hàm hỗ trợ
│   ├── App.js           # Ứng dụng và route
│   └── index.jsx        # Điểm khởi chạy React
├── index.html           # HTML đầu vào Vite
├── vite.config.js       # Cấu hình Vite và Vitest
├── nginx.conf           # Phục vụ bản build trong Docker
└── Dockerfile
```

Các file kiểm thử cũng được đặt cạnh mã nguồn với đuôi `.test.js` hoặc `.test.jsx`.

## Tích hợp backend

- Đăng nhập dùng OAuth2 Authorization Code với PKCE và trang `/callback`.
- API sử dụng tiền tố `/api`; WebSocket sử dụng `/ws` trên resource server.
- Khi đổi hostname hoặc cổng frontend, cập nhật CORS và redirect URI phía backend cho khớp.
- Dockerfile build frontend rồi dùng Nginx phục vụ `dist/`. Cấu hình chạy toàn bộ hệ thống nằm trong [docker-compose.delivery.yml](../docker-compose.delivery.yml).
