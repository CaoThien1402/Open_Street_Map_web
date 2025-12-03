import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, where, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import './SearchHistory.css'; // Sẽ tạo ở bước sau

function SearchHistory({ user, onSelectHistory }) {
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Truy vấn: Lấy history CỦA user này, sắp xếp MỚI NHẤT trước, lấy 10 cái
    const q = query(
      collection(db, "searchHistory"),
      where("uid", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(10)
    );

    // Lắng nghe dữ liệu realtime
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(items);
    });

    return () => unsubscribe();
  }, [user]);

  // Hàm xóa lịch sử
  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Ngăn chặn click nhầm vào item
    await deleteDoc(doc(db, "searchHistory", id));
  };

  return (
    <div className="history-wrapper">
      <button 
        className="history-toggle-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Lịch sử tìm kiếm"
      >
        🕒 Lịch sử
      </button>

      {isOpen && (
        <div className="history-dropdown">
          <h4>Gần đây</h4>
          {history.length === 0 ? (
            <p className="no-history">Chưa có lịch sử nào.</p>
          ) : (
            <ul>
              {history.map(item => (
                <li key={item.id} onClick={() => onSelectHistory(item.text)}>
                  <span className="history-text">
                    {item.type === 'route' ? '🚗 ' : '📍 '} 
                    {item.text}
                  </span>
                  <span 
                    className="delete-history" 
                    onClick={(e) => handleDelete(e, item.id)}
                  >
                    ×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchHistory;