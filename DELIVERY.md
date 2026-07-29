# Chạy Rental Room System bằng Docker image

## 1. Import hai image

```powershell
docker load -i rental-room-backend-1.0.tar
docker load -i rental-room-frontend-1.0.tar
```

## 2. Tạo file cấu hình

Đổi tên `.env.delivery.example` thành `.env` và điền mật khẩu MySQL cùng
thông tin ImageKit.

## 3. Khởi động

```powershell
docker compose -f docker-compose.delivery.yml up -d
```

Mở frontend tại http://localhost:3000.

Kiểm tra trạng thái và log:

```powershell
docker compose -f docker-compose.delivery.yml ps
docker compose -f docker-compose.delivery.yml logs -f
```

Tắt ứng dụng:

```powershell
docker compose -f docker-compose.delivery.yml down
```
