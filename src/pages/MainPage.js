import React, { useState, useEffect, useRef } from 'react';
import { StyledWrapper } from '../utils/stylejs/MainPage.styles';
import Footer from '../components/Footer/Footer';
import '../utils/css/MainPage.css';
import { useNavigate } from 'react-router-dom';
import { getDailyBoxOffice } from '../api/api';

const MainPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const navigate = useNavigate();
  const [boxOfficeMovies, setBoxOfficeMovies] = useState([]);

  useEffect(() => {
    fetchBoxOfficeMovies();
  }, []);

  const fetchBoxOfficeMovies = async () => {
    try {
      setLoading(true);
      const response = await getDailyBoxOffice();
      
      if (!response.payload || !Array.isArray(response.payload)) {
        throw new Error('박스오피스 데이터가 올바르지 않습니다.');
      }

      const movies = response.payload.map(movie => ({
        ...movie,
        movieDetails: {
          ...movie.movieDetails,
          posters: movie.movieDetails?.posters ? movie.movieDetails.posters.split('|')[0] : '',
          stlls: movie.movieDetails?.stlls ? movie.movieDetails.stlls.split('|') : [],
          vods: movie.movieDetails?.vods ? movie.movieDetails.vods.split('|') : [],
          directors: movie.movieDetails?.directors ? movie.movieDetails.directors.split(',') : [],
          actors: movie.movieDetails?.actors ? movie.movieDetails.actors.split(',') : []
        }
      }));

      setBoxOfficeMovies(movies);
    } catch (err) {
      setError('영화 정보를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleTheaterSearch = () => {
    navigate('/theater-search');
  };

  const handleDetailClick = (movie) => {
    navigate(`/movie/${movie.movieKey}`, { 
      state: { 
        movieData: {
          ...movie.movieDetails,
          movieId: movie.movieId,
          movieKey: movie.movieKey,
          movieNm: movie.movieNm,
          rank: movie.rank,
          title: movie.movieNm
        }
      } 
    });
  };

  // 영화 제목에서 #숫자 제거 함수
  const cleanCardTitle = (title) => (title || '').replace(/#\d+$/, '').trim();

  return (
    <div className="main-container">

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
            <button onClick={handleTheaterSearch}>영화관 찾기</button>
          </StyledWrapper>
        </div>
      </section>

      {/* 현재 상영중인 영화 섹션 */}
      <main className="main-content">
        <section className="section">
          <h2 className="section-title">
            <span className="section-title-emoji">🎬</span>
            DailyBoxOffice
          </h2>
          {loading ? (
            <div className="loading">로딩중...</div>
          ) : error ? (
            <div className="error">{error}</div>
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
                {boxOfficeMovies.map((movie) => (
                  <div key={movie.movieKey} className="movie-card">
                    <div className="main-movie-poster">
                      <img
                        src={movie.movieDetails?.posters || 'https://via.placeholder.com/300x450'}
                        alt={movie.movieNm}
                      />
                      <div className="movie-overlay">
                        <button 
                          className="movie-button detail-button"
                          onClick={() => handleDetailClick(movie)}
                        >
                          상세정보
                        </button>
                        <button 
                          className="movie-button theater-button"
                          onClick={() => navigate(`/theater-search?movieId=${movie.movieId}`)}
                        >
                          예매하기
                        </button>
                      </div>
                    </div>
                    <h3 className="movie-title">
                      {cleanCardTitle(movie.movieNm)}
                    </h3>
                    <div className="movie-rank">순위: {movie.rank}위</div>
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

      <Footer />
    </div>
  );
};

export default MainPage;