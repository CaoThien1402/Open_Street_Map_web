"""
Script chạy Backend Server với Pinggy tunnel.
Chạy: python run_server.py

Pinggy miễn phí, không cần đăng ký account!
"""

import os
import subprocess
import threading
import time
import sys
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

PORT = 8000

def run_uvicorn():
    """Chạy FastAPI server"""
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 WEBMAP AI BACKEND SERVER")
    print("="*60)
    
    # Chạy FastAPI server trong thread riêng
    print("\n⏳ Đang khởi động FastAPI server...")
    server_thread = threading.Thread(target=run_uvicorn, daemon=True)
    server_thread.start()
    
    # Chờ server khởi động
    time.sleep(3)
    
    # Kiểm tra server local
    try:
        import requests
        response = requests.get(f"http://localhost:{PORT}/")
        if response.status_code == 200:
            print(f"✅ Backend server đang chạy tại http://localhost:{PORT}")
        else:
            print("❌ Server không phản hồi đúng")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Không thể kết nối server: {e}")
        sys.exit(1)
    
    print("\n" + "="*60)
    print("📡 HƯỚNG DẪN TẠO PUBLIC URL VỚI PINGGY")
    print("="*60)
    print("""
🔹 MỞ MỘT TERMINAL MỚI và chạy lệnh sau:

   ssh -p 443 -R0:localhost:8000 -L4300:localhost:4300 a.pinggy.io

🔹 Nhấn Enter khi được hỏi password (để trống)

🔹 Copy URL dạng: https://xxxxx.a.free.pinggy.link

🔹 Cập nhật vào App.js:
   const BACKEND_BASE_URL = "https://xxxxx.a.free.pinggy.link";

""")
    print("="*60)
    print(f"\n✅ Server đang chạy tại http://localhost:{PORT}")
    print("📌 Nhấn Ctrl+C để dừng server...")
    print("="*60 + "\n")
    
    # Giữ chương trình chạy
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Đang dừng server...")
        print("✅ Đã dừng")
