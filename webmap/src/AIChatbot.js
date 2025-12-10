import React, { useState } from 'react';
import './AIChatbot.css';

function AIChatbot({ backendUrl, currentLocation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Xin chào! Tôi là trợ lý du lịch AI. Hỏi tôi về địa điểm, món ăn, hay hoạt động tại nơi bạn muốn khám phá nhé! 🗺️' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' hoặc 'review'

  // Gửi tin nhắn chat
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/chat/travel`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'  // Bypass ngrok warning page
        },
        body: JSON.stringify({
          message: userMessage,
          context: currentLocation || null,
          max_tokens: 200
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: data.response || 'Xin lỗi, tôi không thể trả lời lúc này.' 
      }]);
    } catch (error) {
      console.error('Lỗi chat:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: '❌ Lỗi kết nối. Vui lòng kiểm tra Backend API.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Phân tích cảm xúc review
  const handleAnalyzeReview = async () => {
    if (!reviewText.trim() || isLoading) return;

    setIsLoading(true);
    setSentiment(null);

    try {
      const response = await fetch(`${backendUrl}/analyze/sentiment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'  // Bypass ngrok warning page
        },
        body: JSON.stringify({ review: reviewText })
      });

      const data = await response.json();
      setSentiment(data);
    } catch (error) {
      console.error('Lỗi phân tích:', error);
      setSentiment({ error: 'Lỗi kết nối Backend' });
    } finally {
      setIsLoading(false);
    }
  };

  // Gợi ý nhanh
  const quickSuggestions = [
    'Món ăn nổi tiếng ở đây?',
    'Địa điểm tham quan gần đây?',
    'Hoạt động giải trí phổ biến?',
    'Thời điểm tốt nhất để đến?'
  ];

  const handleQuickSuggestion = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <div className="ai-chatbot-container">
      {/* Nút mở chatbot */}
      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Trợ lý AI"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Panel chatbot */}
      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <h3>🤖 Trợ lý Du lịch AI</h3>
            {currentLocation && (
              <span className="current-location">📍 {currentLocation}</span>
            )}
          </div>

          {/* Tabs */}
          <div className="chatbot-tabs">
            <button 
              className={activeTab === 'chat' ? 'active' : ''}
              onClick={() => setActiveTab('chat')}
            >
              💬 Chat
            </button>
            <button 
              className={activeTab === 'review' ? 'active' : ''}
              onClick={() => setActiveTab('review')}
            >
              ⭐ Phân tích Review
            </button>
          </div>

          {/* Tab Chat */}
          {activeTab === 'chat' && (
            <>
              <div className="chatbot-messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    {msg.role === 'bot' && <span className="bot-icon">🤖</span>}
                    <p>{msg.text}</p>
                  </div>
                ))}
                {isLoading && (
                  <div className="message bot loading">
                    <span className="bot-icon">🤖</span>
                    <p>Đang suy nghĩ...</p>
                  </div>
                )}
              </div>

              {/* Gợi ý nhanh */}
              <div className="quick-suggestions">
                {quickSuggestions.map((suggestion, idx) => (
                  <button key={idx} onClick={() => handleQuickSuggestion(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="chatbot-input">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Hỏi về địa điểm du lịch..."
                  disabled={isLoading}
                />
                <button onClick={handleSendMessage} disabled={isLoading}>
                  {isLoading ? '...' : '➤'}
                </button>
              </div>
            </>
          )}

          {/* Tab Phân tích Review */}
          {activeTab === 'review' && (
            <div className="review-analyzer">
              <p className="analyzer-desc">
                Nhập review du lịch để phân tích cảm xúc bằng AI:
              </p>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Ví dụ: Khách sạn rất đẹp, view tuyệt vời, nhân viên thân thiện..."
                rows={4}
              />
              <button 
                className="analyze-btn"
                onClick={handleAnalyzeReview}
                disabled={isLoading || !reviewText.trim()}
              >
                {isLoading ? 'Đang phân tích...' : '🔍 Phân tích cảm xúc'}
              </button>

              {sentiment && !sentiment.error && (
                <div className={`sentiment-result ${sentiment.original_label}`}>
                  <div className="sentiment-label">{sentiment.label}</div>
                  <div className="sentiment-score">Độ tin cậy: {sentiment.score}%</div>
                  <div className="sentiment-review">"{sentiment.review}"</div>
                </div>
              )}

              {sentiment?.error && (
                <div className="sentiment-error">
                  ❌ {sentiment.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIChatbot;
