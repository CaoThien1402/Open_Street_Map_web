import React, { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import './AuthForm.css'; 

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true); // True: Đăng nhập, False: Đăng ký
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Đăng nhập
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Đăng ký
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // Khi thành công, App.js sẽ tự động phát hiện user thay đổi
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</h2>
        
        {error && <p className="auth-error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Mật khẩu" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button type="submit">
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <p onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
          {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
        </p>
      </div>
    </div>
  );
}

export default AuthForm;