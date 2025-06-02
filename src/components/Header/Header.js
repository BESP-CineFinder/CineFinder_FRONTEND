import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout, searchMovies } from '../../api/api';
import { AuthContext } from '../../utils/auth/contexts/AuthProvider';
import '../../utils/css/Header.css';

const Header = () => {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        // 1. 영화 제목 리스트 검색
        let movieIds = [];
        try {
            movieIds = await searchMovies(searchQuery.trim());
        } catch (err) {
            alert('영화 검색에 실패했습니다.');
            return;
        }
        if (!movieIds.length) {
            alert('키워드에 부합하는 영화가 없습니다.');
            return;
        }

        // 2. 현재 시간 기준으로 검색 시간 설정
        const now = new Date();
        const hour = now.getHours().toString().padStart(2, '0');
        const minute = now.getMinutes().toString().padStart(2, '0');
        const startTime = `${hour}:${minute}`;
        const endTime = '23:59';

        const searchParams = {
            date: now.toISOString().slice(0, 10),
            minTime: startTime,
            maxTime: endTime,
            distance: 3,
            movieIds: movieIds
        };
        navigate('/theater-search-result', { state: searchParams });
    };

    useEffect(() => {
        setLoading(false);
    }, []);

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
            <div className="header-search-container">
              <form onSubmit={handleSearch} className="header-search-form">
                <div className="header-search-box">
                  <input
                    type="text"
                    placeholder="영화와 관련된 키워드를 입력하세요(배우, 감독, 영화 제목 등) 🔍"
                    className="header-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="header-search-icon" aria-label="검색">
                    🔍
                  </button>
                </div>
              </form>
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