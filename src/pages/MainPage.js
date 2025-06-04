import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyledWrapper } from '../utils/stylejs/MainPage.styles';
import Footer from '../components/Footer/Footer';
import '../utils/css/MainPage.css';
import { useNavigate } from 'react-router-dom';
import { getDailyBoxOffice, checkFavorite, getRecommendMovies } from '../api/api';
import { AuthContext } from '../utils/auth/contexts/AuthProvider';
import FavoriteButton from '../components/Button/FavoriteButton';

const SEOUL_CITY_HALL = { lat: 37.566826, lng: 126.9786567 };

const MainPage = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const boxOfficeSliderRef = useRef(null);
  const recommendSliderRef = useRef(null);
  const [isBoxOfficeDragging, setIsBoxOfficeDragging] = useState(false);
  const [isRecommendDragging, setIsRecommendDragging] = useState(false);
  const [boxOfficeStartX, setBoxOfficeStartX] = useState(0);
  const [recommendStartX, setRecommendStartX] = useState(0);
  const [boxOfficeScrollLeft, setBoxOfficeScrollLeft] = useState(0);
  const [recommendScrollLeft, setRecommendScrollLeft] = useState(0);
  const navigate = useNavigate();
  const [boxOfficeMovies, setBoxOfficeMovies] = useState([]);
  const [favoriteStatus, setFavoriteStatus] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [recommendMovies, setRecommendMovies] = useState([]);
  const [recommendLoading, setRecommendLoading] = useState(true);
  const [recommendError, setRecommendError] = useState(null);

  // 박스오피스 영화 목록 가져오기
  useEffect(() => {
    const fetchBoxOfficeMovies = async () => {
      try {
        setLoading(true);
        const response = await getDailyBoxOffice();
        
        if (!response.payload || !Array.isArray(response.payload)) {
          throw new Error('박스오피스 데이터가 올바르지 않습니다.');
        }

        const movies = response.payload.map(movie => ({
          ...movie,
          movieResponseDto: {
            ...movie.movieResponseDto,
            posters: movie.movieResponseDto?.posters ? movie.movieResponseDto.posters.split('|')[0] : '',
            stlls: movie.movieResponseDto?.stlls ? movie.movieResponseDto.stlls.split('|') : [],
            vods: movie.movieResponseDto?.vods ? movie.movieResponseDto.vods.split('|') : [],
            directors: movie.movieResponseDto?.directors ? movie.movieResponseDto.directors.split('|') : [],
            actors: movie.movieResponseDto?.actors ? movie.movieResponseDto.actors.split('|') : []
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

    fetchBoxOfficeMovies();
  }, []); // 페이지 진입 시마다 박스오피스 정보 가져오기

  // 추천 영화 목록 가져오기
  useEffect(() => {
    const fetchRecommendMovies = async () => {
      try {
        setRecommendLoading(true);
        const response = await getRecommendMovies();
        
        if (!response.payload || !Array.isArray(response.payload)) {
          throw new Error('추천 영화 데이터가 올바르지 않습니다.');
        }

        const movies = response.payload.map(movie => ({
          ...movie,
          movieResponseDto: {
            ...movie.movieResponseDto,
            posters: movie.movieResponseDto?.posters ? movie.movieResponseDto.posters.split('|')[0] : '',
            stlls: movie.movieResponseDto?.stlls ? movie.movieResponseDto.stlls.split('|') : [],
            vods: movie.movieResponseDto?.vods ? movie.movieResponseDto.vods.split('|') : [],
            directors: movie.movieResponseDto?.directors ? movie.movieResponseDto.directors.split('|') : [],
            actors: movie.movieResponseDto?.actors ? movie.movieResponseDto.actors.split('|') : []
          }
        }));

        setRecommendMovies(movies);
      } catch (err) {
        setRecommendError('추천 영화 정보를 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setRecommendLoading(false);
      }
    };

    fetchRecommendMovies();
  }, []);

  // 좋아요 상태 동기화 (추천 영화 포함)
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!user || (!boxOfficeMovies.length && !recommendMovies.length)) return;
      
      try {
        const movieIds = [
          ...boxOfficeMovies.map(movie => movie.movieId),
          ...recommendMovies.map(movie => movie.movieId)
        ];
        const response = await checkFavorite(user.payload.userId, movieIds);
        if (response && response.success) {
          const statusMap = response.payload.reduce((acc, item) => {
            acc[item.movieId] = item.favorite;
            return acc;
          }, {});
          setFavoriteStatus(statusMap);
        }
      } catch (error) {
        console.error('즐겨찾기 상태 확인 실패:', error);
      }
    };

    setFavoriteStatus({});
    fetchFavoriteStatus();
  }, [user, boxOfficeMovies, recommendMovies]);

  const handleBoxOfficeMouseDown = (e) => {
    setIsBoxOfficeDragging(true);
    setBoxOfficeStartX(e.pageX - boxOfficeSliderRef.current.offsetLeft);
    setBoxOfficeScrollLeft(boxOfficeSliderRef.current.scrollLeft);
    boxOfficeSliderRef.current.style.cursor = 'grabbing';
    boxOfficeSliderRef.current.classList.add('dragging');
  };

  const handleRecommendMouseDown = (e) => {
    setIsRecommendDragging(true);
    setRecommendStartX(e.pageX - recommendSliderRef.current.offsetLeft);
    setRecommendScrollLeft(recommendSliderRef.current.scrollLeft);
    recommendSliderRef.current.style.cursor = 'grabbing';
    recommendSliderRef.current.classList.add('dragging');
  };

  const handleBoxOfficeMouseUp = () => {
    setIsBoxOfficeDragging(false);
    if (boxOfficeSliderRef.current) {
      boxOfficeSliderRef.current.style.cursor = 'grab';
      boxOfficeSliderRef.current.classList.remove('dragging');
    }
  };

  const handleRecommendMouseUp = () => {
    setIsRecommendDragging(false);
    if (recommendSliderRef.current) {
      recommendSliderRef.current.style.cursor = 'grab';
      recommendSliderRef.current.classList.remove('dragging');
    }
  };

  const handleBoxOfficeMouseLeave = () => {
    setIsBoxOfficeDragging(false);
    if (boxOfficeSliderRef.current) {
      boxOfficeSliderRef.current.style.cursor = 'grab';
      boxOfficeSliderRef.current.classList.remove('dragging');
    }
  };

  const handleRecommendMouseLeave = () => {
    setIsRecommendDragging(false);
    if (recommendSliderRef.current) {
      recommendSliderRef.current.style.cursor = 'grab';
      recommendSliderRef.current.classList.remove('dragging');
    }
  };

  const handleBoxOfficeMouseMove = (e) => {
    if (!isBoxOfficeDragging) return;
    e.preventDefault();
    const x = e.pageX - boxOfficeSliderRef.current.offsetLeft;
    const walk = (x - boxOfficeStartX) * 2;
    boxOfficeSliderRef.current.scrollLeft = boxOfficeScrollLeft - walk;
  };

  const handleRecommendMouseMove = (e) => {
    if (!isRecommendDragging) return;
    e.preventDefault();
    const x = e.pageX - recommendSliderRef.current.offsetLeft;
    const walk = (x - recommendStartX) * 2;
    recommendSliderRef.current.scrollLeft = recommendScrollLeft - walk;
  };

  const handleBoxOfficePrevClick = () => {
    if (boxOfficeSliderRef.current) {
      const scrollAmount = boxOfficeSliderRef.current.offsetWidth * 0.8;
      boxOfficeSliderRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleBoxOfficeNextClick = () => {
    if (boxOfficeSliderRef.current) {
      const scrollAmount = boxOfficeSliderRef.current.offsetWidth * 0.8;
      boxOfficeSliderRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleRecommendPrevClick = () => {
    if (recommendSliderRef.current) {
      const scrollAmount = recommendSliderRef.current.offsetWidth * 0.8;
      recommendSliderRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleRecommendNextClick = () => {
    if (recommendSliderRef.current) {
      const scrollAmount = recommendSliderRef.current.offsetWidth * 0.8;
      recommendSliderRef.current.scrollBy({
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
          ...movie.movieResponseDto,
          movieId: movie.movieId,
          movieKey: movie.movieKey,
          movieNm: movie.movieNm,
          rank: movie.rank,
          title: movie.movieNm
        }
      } 
    });
  };

  const handleFavoriteToggle = async (movieId, newStatus) => {
    if (!user) return;
    // FavoriteButton에서 이미 API를 호출하므로 여기서는 상태만 업데이트
    setFavoriteStatus(prev => ({
      ...prev,
      [movieId]: newStatus
    }));
  };

  // 박스오피스 영화 예매하기 핸들러
  const handleBoxOfficeReserve = (movieId) => {
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
      movieIds: [movieId]
      // lat, lng 없음
    };
    navigate('/theater-search-result', { state: searchParams });
  };

  // 새로고침 시 상태 초기화
  useEffect(() => {
    const handleBeforeUnload = () => {
      setIsInitialLoad(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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
              <button className="slider-button prev" onClick={handleBoxOfficePrevClick}>
                <svg viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <div 
                className="movie-slider" 
                ref={boxOfficeSliderRef}
                onMouseDown={handleBoxOfficeMouseDown}
                onMouseUp={handleBoxOfficeMouseUp}
                onMouseLeave={handleBoxOfficeMouseLeave}
                onMouseMove={handleBoxOfficeMouseMove}
                style={{ cursor: 'grab' }}
              >
                {boxOfficeMovies.map((movie) => (
                  <div key={movie.movieKey} className="movie-card">
                    <div className="main-movie-poster">
                      <img
                        src={movie.movieResponseDto?.posters || 'https://via.placeholder.com/300x450'}
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
                          onClick={() => handleBoxOfficeReserve(movie.movieId)}
                        >
                          예매하기
                        </button>
                      </div>
                      {user && (
                        <FavoriteButton 
                          userId={user.payload.userId}
                          movieId={movie.movieId}
                          isFavorite={favoriteStatus[movie.movieId] || false}
                          onToggle={(newStatus) => handleFavoriteToggle(movie.movieId, newStatus)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button className="slider-button next" onClick={handleBoxOfficeNextClick}>
                <svg viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
              </button>
            </div>
          )}
        </section>

        {/* 추천 영화 섹션 */}
        <section className="section">
          <h2 className="section-title">
            <span className="section-title-emoji">🎯</span>
            CineFinder 추천 영화
          </h2>
          {recommendLoading ? (
            <div className="loading">로딩중...</div>
          ) : recommendError ? (
            <div className="error">{recommendError}</div>
          ) : (
            <div className="movie-slider-container">
              <button className="slider-button prev" onClick={handleRecommendPrevClick}>
                <svg viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>
              <div 
                className="movie-slider" 
                ref={recommendSliderRef}
                onMouseDown={handleRecommendMouseDown}
                onMouseUp={handleRecommendMouseUp}
                onMouseLeave={handleRecommendMouseLeave}
                onMouseMove={handleRecommendMouseMove}
                style={{ cursor: 'grab' }}
              >
                {recommendMovies.map((movie) => (
                  <div key={movie.movieId} className="movie-card">
                    <div className="main-movie-poster">
                      <img
                        src={movie.movieResponseDto?.posters || 'https://via.placeholder.com/300x450'}
                        alt={movie.movieResponseDto.movieNm}
                      />
                      <div className="movie-overlay">
                        <button 
                          className="movie-button detail-button"
                          onClick={() => handleDetailClick({
                            movieId: movie.movieId,
                            movieKey: movie.movieId,
                            movieNm: movie.movieResponseDto.movieNm,
                            movieResponseDto: movie.movieResponseDto
                          })}
                        >
                          상세정보
                        </button>
                        <button 
                          className="movie-button theater-button"
                          onClick={() => handleBoxOfficeReserve(movie.movieId)}
                        >
                          예매하기
                        </button>
                      </div>
                      {user && (
                        <FavoriteButton 
                          userId={user.payload.userId}
                          movieId={movie.movieId}
                          isFavorite={favoriteStatus[movie.movieId] || false}
                          onToggle={(newStatus) => handleFavoriteToggle(movie.movieId, newStatus)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button className="slider-button next" onClick={handleRecommendNextClick}>
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