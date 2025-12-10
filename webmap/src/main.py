import os 
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import InferenceClient
from pydantic import BaseModel
from typing import Optional

# 1. LOAD CONFIG VÀ KHỞI TẠO
# Load .env từ cùng thư mục với file main.py
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise ValueError(f"HF_TOKEN not found in .env file at {env_path}")

client = InferenceClient(token=HF_TOKEN)
app = FastAPI(title="WebMap AI Backend", version="1.0.0")

# Cấu hình CORS để cho phép website React gọi đến
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong production, thay bằng domain cụ thể
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. MODELS VÀ SCHEMAS
class SentimentInput(BaseModel):
    review: str

class ChatInput(BaseModel):
    message: str
    context: Optional[str] = None  # Thông tin địa điểm hiện tại
    max_tokens: int = 200

class PlaceRecommendInput(BaseModel):
    location: str
    preferences: Optional[str] = None

# 3. ENDPOINTS CHO CÁC CHỨC NĂNG

@app.get("/")
def read_root():
    return {"message": "WebMap AI Backend đang chạy!", "status": "ok"}

@app.get("/health")
def health_check():
    """Kiểm tra trạng thái server"""
    return {"status": "healthy", "hf_connected": True}

@app.post("/analyze/sentiment")
def analyze_sentiment(data: SentimentInput):
    """Phân tích cảm xúc từ review du lịch."""
    try:
        result = client.text_classification(
            data.review,
            model="lxyuan/distilbert-base-multilingual-cased-sentiments-student" 
        )
        # Chuyển đổi label sang tiếng Việt
        label_map = {
            "positive": "Tích cực 😊",
            "negative": "Tiêu cực 😞",
            "neutral": "Trung lập 😐"
        }
        return {
            "label": label_map.get(result[0].label, result[0].label),
            "original_label": result[0].label,
            "score": round(result[0].score * 100, 1),
            "review": data.review
        }
    except Exception as e:
        print(f"Lỗi Sentiment Analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/travel")
def chat_travel_assistant(data: ChatInput):
    """Chatbot hỗ trợ du lịch - trả lời câu hỏi về địa điểm."""
    try:
        # Tạo messages cho chat completion
        messages = [
            {"role": "system", "content": "Bạn là trợ lý du lịch thông minh. Trả lời ngắn gọn, hữu ích bằng tiếng Việt."},
        ]
        
        if data.context:
            messages.append({"role": "user", "content": f"Tôi đang ở {data.context}. {data.message}"})
        else:
            messages.append({"role": "user", "content": data.message})
        
        # Sử dụng chat_completion với model miễn phí
        response = client.chat_completion(
            messages=messages,
            model="meta-llama/Llama-3.2-3B-Instruct",
            max_tokens=data.max_tokens,
            temperature=0.7
        )
        
        # Lấy nội dung response
        result = response.choices[0].message.content
        
        return {
            "response": result.strip() if result else "Xin lỗi, không có phản hồi.",
            "context": data.context
        }
    except Exception as e:
        print(f"Lỗi Chat: {e}")
        # Fallback response nếu API lỗi
        return {
            "response": f"Xin lỗi, tôi đang gặp sự cố: {str(e)[:100]}",
            "error": str(e)
        }

@app.post("/recommend/places")
def recommend_places(data: PlaceRecommendInput):
    """Gợi ý địa điểm dựa trên sở thích."""
    try:
        content = f"Gợi ý 3 địa điểm du lịch gần {data.location}"
        if data.preferences:
            content += f" phù hợp với sở thích: {data.preferences}"
        content += ". Trả lời ngắn gọn bằng tiếng Việt."
        
        messages = [
            {"role": "system", "content": "Bạn là chuyên gia du lịch Việt Nam."},
            {"role": "user", "content": content}
        ]
        
        response = client.chat_completion(
            messages=messages,
            model="meta-llama/Llama-3.2-3B-Instruct",
            max_tokens=150,
            temperature=0.8
        )
        
        result = response.choices[0].message.content
        
        return {
            "recommendations": result.strip() if result else "Không có gợi ý.",
            "location": data.location
        }
    except Exception as e:
        print(f"Lỗi Recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize/place")
def summarize_place(data: PlaceRecommendInput):
    """Tóm tắt thông tin về một địa điểm."""
    try:
        messages = [
            {"role": "system", "content": "Bạn là hướng dẫn viên du lịch."},
            {"role": "user", "content": f"Mô tả ngắn gọn về {data.location} trong 2-3 câu bằng tiếng Việt. Nêu điểm nổi bật nhất."}
        ]
        
        response = client.chat_completion(
            messages=messages,
            model="meta-llama/Llama-3.2-3B-Instruct",
            max_tokens=100,
            temperature=0.5
        )
        
        result = response.choices[0].message.content
        
        return {
            "summary": result.strip() if result else "Không có thông tin.",
            "location": data.location
        }
    except Exception as e:
        print(f"Lỗi Summarize: {e}")
        raise HTTPException(status_code=500, detail=str(e))

