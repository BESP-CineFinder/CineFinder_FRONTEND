import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout, getCurrentUser, isAuthenticated } from '../../api/api';
import '../../utils/css/Header.css';

const Header = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);

    const fetchUserData = async () => {
        try {
            if (!isAuthenticated()) {
                setUser(null);
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }

            const userData = await getCurrentUser();
            console.log('Header - Current user data:', userData);
            
            if (!userData) {
                throw new Error('사용자 정보를 가져오는데 실패했습니다.');
            }

            setUser(userData);
            setIsLoggedIn(true);
        } catch (error) {
            console.error('Header - Auth check error:', error);
            setUser(null);
            setIsLoggedIn(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        if (location.pathname === '/' && isAuthenticated()) {
            fetchUserData();
        }
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            setIsLoggedIn(false);
            navigate('/');
        } catch (error) {
            console.error('Header - Logout error:', error);
        }
    };

    const handleLoginClick = () => {
        navigate('/login');
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
              {isLoggedIn ? (
                <>
                  <Link to="/mypage" className="mypage-link" aria-label="마이페이지로 이동">
                    <img src={user.picture} alt="프로필" className="profile-img" />
                    <span>{user.nickname || user.name} 님</span>
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
                <button onClick={handleLoginClick} className="login-button">
                  로그인
                </button>
              )}
            </div>
          </div>
        </header>
    );
};

export default Header; 