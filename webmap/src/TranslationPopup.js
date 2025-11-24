import React, { useState } from 'react';
import './TranslationPopup.css'; 

function TranslationPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setTranslatedText('');

    try {
      // My memory API
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText)}&langpair=en|vi`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.responseStatus === 200) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        setError("Lỗi dịch thuật: " + data.responseDetails);
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ dịch.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="translation-wrapper">
      {/* Nút bật tắt Popup */}
      <button 
        className={`translate-toggle-btn ${isOpen ? 'active' : ''}`} 
        onClick={togglePopup}
        title="Dịch Anh - Việt"
      >
        🌐
      </button>

      {/* Khung Popup */}
      {isOpen && (
        <div className="translation-popup">
          <div className="popup-header">
            <h4>Dịch Anh ➡ Việt</h4>
            <button className="close-btn" onClick={togglePopup}>×</button>
          </div>
          
          <div className="popup-body">
            <textarea
              placeholder="Nhập câu tiếng Anh..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTranslate()}
            />
            
            <button 
              className="action-btn" 
              onClick={handleTranslate} 
              disabled={isLoading || !inputText}
            >
              {isLoading ? 'Đang dịch...' : 'Dịch sang tiếng Việt'}
            </button>

            {error && <p className="error-text">{error}</p>}

            {translatedText && (
              <div className="result-area">
                <strong>Kết quả:</strong>
                <p>{translatedText}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TranslationPopup;