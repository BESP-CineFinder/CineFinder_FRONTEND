import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../api/api';
import { AuthContext } from '../../utils/auth/contexts/AuthProvider';
import '../../utils/css/Header.css';

const Header = () => {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, [user]);

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            navigate('/');
        } catch (error) {
            console.error('Header - Logout error:', error);
        }
    };

    const handleKakaoLogin = () => {
        window.location.href = 'https://localhost/api/login/';
    };

    if (loading) {
        return null;
    }

    return (
        <header className="header">
          <div className="header-content">
            <Link to="/" aria-label="메인으로 이동" tabIndex={0} className="logo-text-link">
            <div className="logo-container">
              <span className="logo-emoji">🎬</span>
              <h1 className="logo-text">CineFinder</h1>
            </div>
            </Link>
            <div className="search-container">
              <select className="select-box">
                <option>지역 선택</option>
              </select>
              <select className="select-box">
                <option>시간 선택</option>
              </select>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="검색"
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
            </div>
            <div className="auth-container">
              {user && user.isAuthenticated ? (
                <>
                  <Link to="/mypage" className="mypage-link" aria-label="마이페이지로 이동">
                    <span>{user.payload.nickname} 님</span>
                  </Link>
                  <button 
                    className="logout-btn" 
                    onClick={handleLogout}
                    aria-label="로그아웃"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleKakaoLogin} 
                  className="login-button"
                  style={{
                    background: '#FEE500',
                    color: '#181600',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1.5rem',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  카카오로 로그인
                </button>
              )}
            </div>
          </div>
        </header>
    );
};

export default Header; 