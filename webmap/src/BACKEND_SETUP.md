# Hướng dẫn chạy HuggingFace Backend API với FastAPI + ngrok

## 📋 Yêu cầu cài đặt

```bash
# Cài đặt các thư viện Python cần thiết
pip install fastapi uvicorn python-dotenv huggingface_hub pydantic
```

## 🔑 Cấu hình API Key

1. Tạo file `.env` trong thư mục `src/`:

```env
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx
```

2. Lấy HuggingFace Token tại: https://huggingface.co/settings/tokens

## 🚀 Chạy Backend Server

### Bước 1: Khởi động FastAPI server

```bash
cd src
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server sẽ chạy tại: `http://localhost:8000`

### Bước 2: Expose ra internet bằng ngrok hoặc pinggy

#### Cách 1: Sử dụng ngrok (Khuyên dùng)

```bash
# Cài đặt ngrok (nếu chưa có)
# Download từ: https://ngrok.com/download

# Chạy ngrok
ngrok http 8000
```

Bạn sẽ nhận được URL như: `https://abcd-1234-5678.ngrok-free.app`

#### Cách 2: Sử dụng pinggy (Không cần đăng ký)

```bash
ssh -p 443 -R0:localhost:8000 a.pinggy.io
```

Bạn sẽ nhận được URL như: `https://xxxxx.a.pinggy.io`

### Bước 3: Cập nhật URL trong React App

Mở file `App.js` và thay đổi:

```javascript
const BACKEND_BASE_URL = "https://your-ngrok-url.ngrok-free.app";
```

## 🔌 API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/` | GET | Kiểm tra server đang chạy |
| `/health` | GET | Health check |
| `/analyze/sentiment` | POST | Phân tích cảm xúc review |
| `/chat/travel` | POST | Chat với trợ lý du lịch AI |
| `/recommend/places` | POST | Gợi ý địa điểm |
| `/summarize/place` | POST | Tóm tắt thông tin địa điểm |

## 📝 Ví dụ gọi API

### Phân tích cảm xúc:
```bash
curl -X POST "http://localhost:8000/analyze/sentiment" \
  -H "Content-Type: application/json" \
  -d '{"review": "Khách sạn rất đẹp, nhân viên thân thiện!"}'
```

### Chat với AI:
```bash
curl -X POST "http://localhost:8000/chat/travel" \
  -H "Content-Type: application/json" \
  -d '{"message": "Món ăn nổi tiếng ở Hà Nội?", "context": "Hà Nội"}'
```

## ✅ Kiểm tra hoạt động

1. Mở browser: `http://localhost:8000/docs` để xem Swagger UI
2. Mở website React và click vào icon 🤖 ở góc phải dưới
3. Thử chat hoặc phân tích review

## ⚠️ Lưu ý quan trọng

- **ngrok free** có giới hạn requests và URL thay đổi mỗi lần restart
- Với production, nên deploy lên cloud (Railway, Render, Vercel)
- Đảm bảo CORS đã được cấu hình đúng trong `main.py`
- HuggingFace Inference API có rate limit, nên cân nhắc sử dụng Pro nếu traffic cao
