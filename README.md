# 🌿 Hệ Thống Nhà Kính Thông Minh (Smart Greenhouse IoT)

Dự án giám sát và điều khiển nhà kính thông minh thời gian thực trên nền tảng vi điều khiển **ESP32** và giao diện Web Dashboard hiện đại, tuân thủ các quy chuẩn phát triển **Front-End Checklist & Clean Code**.

---

## 📑 Mục Lục
1. [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
2. [Cấu Trúc Thư Mục Chuẩn Git](#-cấu-trúc-thư-mục-chuẩn-git)
3. [Các Nguyên Tắc Frontend Đã Áp Dụng](#-các-nguyên-tắc-frontend-đã-áp-dụng)
4. [Sơ Đồ Đấu Nối Phần Cứng (ESP32 Pinout)](#-sơ-đồ-đấu-nối-phần-cứng-esp32-pinout)
5. [Đặc Tả REST API](#-đặc-tả-rest-api)
6. [Hướng Dẫn Cài Đặt & Chạy](#-hướng-dẫn-cài-đặt--chạy)

---

## 🌟 Tính Năng Nổi Bật

- **Quan trắc đa cảm biến thời gian thực:**
  - 🌡️ Nhiệt độ & 💧 Độ ẩm không khí (DHT22)
  - 🌱 Độ ẩm đất (Cảm biến điện dung Capacitive Soil Moisture)
  - ☀️ Cường độ ánh sáng (BH1750 I2C)
  - 🚰 Mực nước bể chứa (Cảm biến điện trở nước)
  - 💨 Cảnh báo rò rỉ khí gas / khói (MQ-2)
- **Điều khiển thiết bị linh hoạt (4 kênh Relay):**
  - Chuyển đổi linh hoạt giữa chế độ **🤖 Tự động** (theo ngưỡng cài đặt) và **✋ Thủ công** (bật/tắt trực tiếp).
  - Máy bơm tưới, quạt tản nhiệt, đèn LED quang hợp và còi cảnh báo.
- **Tùy chỉnh ngưỡng thông minh:** Thiết lập và lưu các ngưỡng kích hoạt trực tiếp trên giao diện web xuống ESP32.
- **Biểu đồ động (Chart.js):** Theo dõi lịch sử vi phân giá trị các cảm biến dạng đường mượt mà.
- **Chế độ Demo (Fallback Simulation):** Tự động chuyển sang mô phỏng động khi chưa kết nối ESP32 phần cứng, đảm bảo giao diện luôn hoạt động trực quan.

---

## 📁 Cấu Trúc Thư Mục Chuẩn Git

```text
WEBIOT/
├── .gitignore               # Loại bỏ các file tạm, log, cache build Arduino
├── README.md                # Tài liệu kỹ thuật chi tiết của dự án
├── index.html               # Semantic HTML5, tối ưu SEO & Accessibility (a11y)
├── css/
│   ├── variables.css        # Hệ thống Design Tokens (màu sắc, spacing, typography)
│   └── style.css            # Stylesheet kiến trúc BEM (Block Element Modifier)
├── js/
│   ├── config.js            # Cấu hình hằng số, thông số cảm biến, ngưỡng mặc định
│   ├── state.js             # Quản lý State tập trung (Observable Store Pattern)
│   ├── services.js          # Giao tiếp REST API với ESP32 + Mô phỏng dữ liệu (Simulation)
│   ├── ui.js                # DOM Renderer, quản lý Badge, Toast, Clock và Alert
│   ├── chart.js             # Quản trị vòng đời biểu đồ Chart.js
│   └── app.js               # Điểm khởi chạy ứng dụng (Bootstrap & Event Delegation)
├── esp32_nha_kinh.ino       # Firmware mã nguồn C++ cho ESP32 Arduino
└── ProjectIOT102.docx       # Tài liệu dự án gốc
```

---

## 🎯 Các Nguyên Tắc Frontend Đã Áp Dụng

Dự án tuân thủ nghiêm ngặt các tiêu chuẩn từ **Front-End Checklist** và **Clean Code**:

1. **Separation of Concerns (Tách biệt mối quan tâm):**
   - Tách riêng biệt: Cấu trúc (`index.html`), Phong cách (`css/`), Logic ứng dụng (`js/`).
2. **Semantic HTML5:**
   - Sử dụng thẻ ngữ nghĩa rõ ràng: `<header>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
   - Mỗi thẻ card cảm biến là một `<article>` độc lập có tiêu đề `<h3 id="...">` và `aria-labelledby`.
3. **Web Accessibility (WCAG / a11y):**
   - Gắn đầy đủ `aria-live="polite"` cho các số liệu biến đổi thời gian thực.
   - Thẻ `<label for="...">` liên kết rõ ràng với từng input cài đặt ngưỡng.
   - Hỗ trợ người dùng qua `:focus-visible` và tôn trọng tùy chọn `prefers-reduced-motion`.
4. **BEM CSS Architecture (Block Element Modifier):**
   - Đặt tên class rõ ràng, tránh xung đột: `.sensor-card__value`, `.status-badge--good`, `.device-card__toggle`.
   - Quản trị toàn bộ mã màu và thông số qua CSS Custom Properties trong `css/variables.css`.
5. **Clean Code JavaScript:**
   - Single Responsibility Principle (Mỗi file JS chỉ làm đúng 1 nhiệm vụ).
   - Observable State Store giúp luồng dữ liệu một chiều rõ ràng, dễ bảo trì và kiểm thử.
   - Caching DOM elements để tối ưu tối đa hiệu năng render trên trình duyệt.

---

## 🔌 Sơ Đồ Đấu Nối Phần Cứng (ESP32 Pinout)

| Thiết bị / Cảm biến | Chân ESP32 | Giao tiếp / Loại tín hiệu | Ghi chú |
| :--- | :---: | :---: | :--- |
| **DHT22** (Nhiệt & Ẩm) | `GPIO 4` | 1-Wire Digital | Cần trở kéo lên 10kΩ lên 3.3V |
| **BH1750** (Ánh sáng) | `SDA: GPIO 21`, `SCL: GPIO 22` | I2C | Địa chỉ mặc định `0x23` |
| **LCD 1602 I2C** | `SDA: GPIO 21`, `SCL: GPIO 22` | I2C | Địa chỉ mặc định `0x27` |
| **Độ ẩm đất** | `GPIO 34` | Analog (ADC1) | Cảm biến điện dung chống ăn mòn |
| **Mực nước** | `GPIO 35` | Analog (ADC1) | Đọc tỷ lệ điện trở nước |
| **MQ-2** (Khói/Gas) | `GPIO 32` | Analog (ADC1) | Nguồn cấp 5V |
| **Relay 1 - Máy bơm** | `GPIO 25` | Digital Output | Kích mức LOW hoặc HIGH tùy module |
| **Relay 2 - Quạt** | `GPIO 26` | Digital Output | Tự động kích khi nhiệt độ cao |
| **Relay 3 - Đèn LED** | `GPIO 27` | Digital Output | Bổ sung ánh sáng quang hợp |
| **Relay 4 - Còi báo** | `GPIO 14` | Digital Output | Báo động khi gas cao hoặc cạn nước |

---

## 📡 Đặc Tả REST API (ESP32 Web Server)

| Phương thức | Endpoint | Mô tả |
| :---: | :--- | :--- |
| `GET` | `/sensors` | Lấy dữ liệu toàn bộ cảm biến, trạng thái thiết bị và ngưỡng hiện tại |
| `GET` | `/control?device={id}&state={0\|1}` | Bật / tắt thiết bị thủ công (`pump`, `fan`, `led`, `buzzer`) |
| `GET` | `/mode?device={id}&mode={auto\|manual}` | Đổi chế độ điều khiển thiết bị |
| `GET` | `/threshold?tempHigh=35&...` | Cập nhật ngưỡng kích hoạt tự động |

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

1. **Xem trực tiếp Dashboard trên máy tính:**
   - Mở trực tiếp file `index.html` bằng bất kỳ trình duyệt web nào (Chrome, Edge, Firefox).
   - Hệ thống sẽ tự động chạy ở chế độ **Demo Simulation** với số liệu mô phỏng trực quan.
2. **Nạp Firmware vào ESP32:**
   - Cài đặt Arduino IDE và cài board package **esp32 by Espressif Systems**.
   - Cài các thư viện: `DHT sensor library`, `Adafruit Unified Sensor`, `hp_BH1750`, `LiquidCrystal_I2C`.
   - Mở file `esp32_nha_kinh.ino`, sửa tên WiFi và Mật khẩu ở dòng 18–19.
   - Nạp code vào ESP32, mở Serial Monitor (baud rate 115200) để lấy địa chỉ IP.
   - Truy cập địa chỉ IP của ESP32 qua trình duyệt để điều khiển nhà kính thực tế.
