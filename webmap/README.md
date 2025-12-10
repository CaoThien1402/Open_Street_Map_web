# 🗺️ WebMap Vietnam - Bản Đồ Thông Minh với AI

Ứng dụng bản đồ tương tác tích hợp trí tuệ nhân tạo, cho phép tìm kiếm địa điểm, chỉ đường và chat với AI assistant về du lịch.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase)

---

## ✨ Tính Năng Chính

### 🗺️ **Bản Đồ Tương Tác**
- Hiển thị bản đồ OpenStreetMap với Leaflet
- Xác định vị trí người dùng (GPS)
- Zoom, pan, click để chọn điểm

### 🔍 **Tìm Kiếm Địa Điểm**
- Tìm kiếm địa chỉ với Nominatim API
- Tìm POI (quán cà phê, nhà hàng, ATM, khách sạn...) với Overpass API
- Hiển thị thông tin thời tiết tại địa điểm

### 🚗 **Chỉ Đường**
- Tính toán lộ trình giữa 2 điểm
- Sử dụng OSRM (Open Source Routing Machine)
- Hiển thị đường đi trên bản đồ

### 🤖 **AI Chatbot**
- Chat với AI về du lịch, địa điểm
- Phân tích cảm xúc review du lịch
- Gợi ý địa điểm dựa trên sở thích
- Sử dụng HuggingFace Inference API (Llama 3.2)

### 🔐 **Đăng Nhập & Lịch Sử**
- Đăng nhập/Đăng ký với Firebase Auth
- Lưu lịch sử tìm kiếm vào Firestore
- Khôi phục POIs và routes từ lịch sử

### 🌐 **Dịch Thuật**
- Popup dịch văn bản nhanh

---

## 📁 Cấu Trúc Project

```
webmap/
├── public/                 # Static files
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App.js              # Component chính
│   ├── App.css             # Styles chính
│   ├── MapComponent.js     # Component bản đồ Leaflet
│   ├── Routing.js          # Component chỉ đường
│   ├── AIChatbot.js        # Component chatbot AI
│   ├── AIChatbot.css       # Styles chatbot
│   ├── AuthForm.js         # Form đăng nhập/đăng ký
│   ├── AuthForm.css        # Styles auth
│   ├── SearchHistory.js    # Component lịch sử tìm kiếm
│   ├── SearchHistory.css   # Styles lịch sử
│   ├── TranslationPopup.js # Component dịch thuật
│   ├── TranslationPopup.css
│   ├── firebase.js         # Cấu hình Firebase
│   ├── hooks/
│   │   └── useGeolocation.js
│   ├── main.py             # FastAPI Backend
│   ├── run_server.py       # Script chạy server
│   └── .env                # API Keys (không commit)
├── package.json
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### Yêu Cầu Hệ Thống
- **Node.js** >= 16.x
- **Python** >= 3.9
- **npm** hoặc **yarn**

### Bước 1: Clone Project
```bash
git clone <repository-url>
cd webmap
```

### Bước 2: Cài Đặt Dependencies

**Frontend (React):**
```bash
npm install
```

**Backend (Python):**
```bash
pip install fastapi uvicorn huggingface-hub python-dotenv requests pyngrok
```

### Bước 3: Cấu Hình API Keys

Tạo file `src/.env` với nội dung:
```env
HF_TOKEN=your_huggingface_token_here
NGROK_TOKEN=your_ngrok_token_here  # (tùy chọn)
```

> 📝 **Lấy HuggingFace Token:** Đăng ký tại [huggingface.co](https://huggingface.co) → Settings → Access Tokens

### Bước 4: Chạy Ứng Dụng

**Terminal 1 - Chạy Backend:**
```bash
cd src
python run_server.py
```
Hoặc:
```bash
cd src
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Chạy Frontend:**
```bash
npm start
```

### Bước 5: Truy Cập
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 🌐 Deploy với Public URL (Pinggy)

Nếu muốn chia sẻ cho người khác truy cập:

**Terminal 3 - Tạo tunnel:**
```bash
ssh -p 443 -R0:localhost:8000 a.pinggy.io
```

Nhấn Enter khi hỏi password, copy URL dạng `https://xxxxx.a.free.pinggy.link` và cập nhật vào `src/App.js`:
```javascript
const BACKEND_BASE_URL = "https://xxxxx.a.free.pinggy.link";
```

---

## 🔌 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Kiểm tra server |
| GET | `/health` | Health check |
| POST | `/chat/travel` | Chat với AI về du lịch |
| POST | `/analyze/sentiment` | Phân tích cảm xúc review |
| POST | `/recommend/places` | Gợi ý địa điểm |
| POST | `/summarize/place` | Tóm tắt thông tin địa điểm |

### Ví dụ Request:
```bash
curl -X POST http://localhost:8000/chat/travel \
  -H "Content-Type: application/json" \
  -d '{"message": "Gợi ý cho tôi quán cà phê đẹp ở Hà Nội"}'
```

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend
- **React 19** - UI Framework
- **Leaflet / React-Leaflet** - Bản đồ tương tác
- **Firebase** - Authentication & Database

### Backend
- **FastAPI** - Python API Framework
- **HuggingFace Inference API** - AI/ML Models
- **Llama 3.2** - Large Language Model

### APIs Bên Ngoài
- **OpenStreetMap** - Tile maps
- **Nominatim** - Geocoding
- **Overpass** - POI search
- **OSRM** - Routing
- **OpenWeatherMap** - Weather data

---

## 📝 Ghi Chú

- Lần đầu chạy, cần cho phép trình duyệt truy cập vị trí GPS
- API HuggingFace có rate limit, nếu lỗi hãy đợi vài phút
- Nên dùng HTTPS (ngrok/pinggy) khi deploy production

---

## 👨‍💻 Tác Giả

Dự án được phát triển như một phần của môn học **Computational Thinking**.


