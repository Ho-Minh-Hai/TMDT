# Dự án TMDT - E-commerce LuxeStore

Dự án này bao gồm cấu trúc thư mục cho Frontend (React JS) và Backend (Spring Boot).

## Cấu trúc thư mục
- `/fe`: React JS (Vite) - Giao diện người dùng cao cấp.
- `/be`: Spring Boot - Logic xử lý phía server.

## Công nghệ sử dụng
- **Frontend**: React, Lucide React, Framer Motion, Supabase Auth.
- **Backend**: Spring Boot 3.2.4, Maven, Spring Security.
- **Auth**: Supabase (Quản lý người dùng, đăng ký xác nhận qua email).

## Hướng dẫn cài đặt

### 1. Frontend (fe)
- Di chuyển vào thư mục fe: `cd fe`
- Cài đặt dependency: `npm install`
- Chạy ứng dụng: `npm run dev`
- **Lưu ý**: File `.env` đã được tạo sẵn chứa thông tin Project URL và Anon Key của Supabase để hệ thống Auth hoạt động ngay lập tức.

### 2. Backend (be)
- Di chuyển vào thư mục be: `cd be`
- Chạy ứng dụng bằng Maven: `mvn spring-boot:run` (Yêu cầu Java 17+ và Maven).

## Chế độ Auth (Supabase)
- **Đăng ký**: Khi đăng ký, Supabase sẽ tự động gửi một email xác thực đến địa chỉ người dùng cung cấp. Người dùng cần nhấn vào link trong email để kích hoạt tài khoản.
- **Đăng nhập**: Sau khi kích hoạt, người dùng có thể đăng nhập để truy cập trang Home của LuxeStore.

## Bảo mật
- Thông tin nhạy cảm trong file `.env` đã được liệt kê trong `.gitignore` tại thư mục gốc để tránh rò rỉ khi đẩy lên git.
