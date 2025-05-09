import React from 'react';
import '../../assets/css/Header.css';

const Header = () => {
    return (
        <header className="header">
          <div className="header-content">
            <div className="logo-container">
              <span className="logo-emoji">🎬</span>
              <h1 className="logo-text">CineFinder</h1>
            </div>
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
          </div>
        </header>
      );
    };
    
    export default Header; 