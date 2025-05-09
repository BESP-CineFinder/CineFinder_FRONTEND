import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header/Header';
import { StyledWrapper } from '../assets/stylejs/MainPage.styles';
import GithubButton from '../components/Footer/GithubButton';
import '../assets/css/MainPage.css';
import api from '../api/api';

const MainPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await api.get('/movies/boxoffice');
        setMovies(response.data);
        setLoading(false);
      } catch (error) {
        console.error('영화 데이터를 가져오는데 실패했습니다:', error);
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
    sliderRef.current.style.cursor = 'grabbing';
    sliderRef.current.classList.add('dragging');
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (sliderRef.current) {
      sliderRef.current.style.cursor = 'grab';
      sliderRef.current.classList.remove('dragging');
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (sliderRef.current) {
      sliderRef.current.style.cursor = 'grab';
      sliderRef.current.classList.remove('dragging');
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handlePrevClick = () => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.offsetWidth * 0.8;
      sliderRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleNextClick = () => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.offsetWidth * 0.8;
      sliderRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="main-container">
      <Header />

      {/* 메인 인트로 영역 */}
      <section className="welcome-section earth-style">
        <div className="welcome-inner">
          <h2 className="welcome-title earth-title">
            영화를 쉽고 빠르게,
          </h2>
          <h2 className="welcome-title-bottom">한눈에!</h2>
          <p className="welcome-desc">
            팝콘과 함께하는 영화 탐험!<br />
            오늘 근처 영화관에서 볼 수 있는 영화를 찾아보세요.
          </p>
          <StyledWrapper>
            <button>영화관 찾기</button>
          </StyledWrapper>
        </div>
      </section>

      {/* 현재 상영중인 영화 섹션 */}
      <main className="main-content">
        <section className="section">
          <h2 className="section-title">
            <span className="section-title-emoji">🎬</span>
            현재 상영중인 영화
          </h2>
          {loading ? (
            <div className="loading">로딩중...</div>
          ) : (
            <div className="movie-slider-container">
              <button className="slider-button prev" onClick={handlePrevClick}>
                <svg viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <div 
                className="movie-slider" 
                ref={sliderRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
                style={{ cursor: 'grab' }}
              >
                {movies.map((movie) => (
                  <div key={movie.id} className="movie-card">
                    <div className="movie-poster">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <div className="movie-overlay">
                        <button className="movie-button detail-button">
                          상세정보
                        </button>
                        <button className="movie-button theater-button">
                          영화관 찾기
                        </button>
                      </div>
                    </div>
                    <h3 className="movie-title">
                      {movie.title}
                    </h3>
                  </div>
                ))}
              </div>
              <button className="slider-button next" onClick={handleNextClick}>
                <svg viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="footer-content" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', alignItems: 'center' }}>
          <GithubButton />
        </div>
      </footer>
    </div>
  );
};

export default MainPage;