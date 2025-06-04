import React, { useState, useEffect, useContext } from 'react';
import Footer from '../components/Footer/Footer';
import '../utils/css/MainPage.css';
import { useNavigate } from 'react-router-dom';
import { getDailyBoxOffice, checkFavorite, getRecommendMovies } from '../api/api';
import { AuthContext } from '../utils/auth/contexts/AuthProvider';
import FavoriteButton from '../components/Button/FavoriteButton';
import ArrowButton from '../components/Button/ArrowButton';

const SEOUL_CITY_HALL = { lat: 37.566826, lng: 126.9786567 };

// KMDB 예고편 URL을 임베딩 가능한 형식으로 변환
const getEmbeddableVodUrl = (vodUrl) => {
  if (!vodUrl) return '';
  if (vodUrl.includes('tv.kakao.com')) {
    const clipId = vodUrl.split('cliplink/')[1];
    if (clipId) {
      return `https://play-tv.kakao.com/embed/player/cliplink/${clipId}?service=player_share&autoplay=0&width=640&height=360`;
    }
  }
  return vodUrl;
};

// 카드/슬라이더 width 및 gap 상수 정의
const CARD_WIDTH = 190; // px
const CARD_GAP = 19; // 1.2rem ≈ 19px

// 추천영화 리스트에서 VOD가 있는 영화 찾기
const getTopVodMovie = (movies) => {
  if (!movies || movies.length === 0) return null;
  for (const movie of movies) {
    const vods = movie.movieResponseDto?.vods;
    if (Array.isArray(vods) && vods.length > 0 && vods[0]) {
      return movie;
    }
  }
  return null;
};

const MainPage = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [boxOfficeMovies, setBoxOfficeMovies] = useState([]);
  const [favoriteStatus, setFavoriteStatus] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [recommendMovies, setRecommendMovies] = useState([]);
  const [recommendLoading, setRecommendLoading] = useState(true);
  const [recommendError, setRecommendError] = useState(null);

  // 탭 상태: 'boxoffice' | 'recommend'
  const [activeTab, setActiveTab] = useState('boxoffice');
  const VISIBLE_COUNT = 5;
  const [sliderIdx, setSliderIdx] = useState(0);
  const currentMovies = activeTab === 'boxoffice' ? boxOfficeMovies : recommendMovies;
  const maxIdx = Math.max(0, (currentMovies?.length || 0) - VISIBLE_COUNT);

  const handlePrev = () => setSliderIdx(idx => Math.max(0, idx - VISIBLE_COUNT));
  const handleNext = () => setSliderIdx(idx => Math.min(maxIdx, idx + VISIBLE_COUNT));
  // 탭 전환 시 인덱스 초기화
  const handleTab = (tab) => {
    setActiveTab(tab);
    setSliderIdx(0);
  };

  // Hero 영상 제어 상태
  const topVodMovie = getTopVodMovie(recommendMovies);
  const topVod = Array.isArray(topVodMovie?.movieResponseDto?.vods)
    ? topVodMovie.movieResponseDto.vods[0]
    : undefined;
  const topRecommend = topVodMovie;

  // floating 버튼 핸들러
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleReserveClick = () => {
    navigate('/theater-search');
  };

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
            movieNm: movie.movieResponseDto?.title,
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
  }, []);

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
            movieNm: movie.movieResponseDto?.title,
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
      {/* 메인 히어로 영역 */}
      <section
        className="main-hero"
        style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          overflow: 'hidden',
          background: '#000',
        }}
      >
        {topVod && (
          <iframe
            src={getEmbeddableVodUrl(topVod)}
            title="추천 영화 예고편"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={
              topVod.includes('tv.kakao.com')
                ? { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000', border: 'none', display: 'block', overflow: 'hidden' }
                : { position: 'absolute', left: '20rem', width: '100%', height: '800px', background: '#000', border: 'none', display: 'block', top: '-4.3rem', overflow: 'hidden' }
            }
          />
        )}
        {/* 오버레이: 왼쪽 중앙 */}
        {topRecommend && (
          <div className="main-hero-overlay" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.2rem', background: 'rgba(0,0,0,0.08)', padding: '2.2rem 2.5rem', borderRadius: '1.2rem' }}>
            <div className="main-hero-badge">CineFinder 추천 영화</div>
            <div className="main-hero-title">{topRecommend.movieResponseDto.movieNm}</div>
            <button className="main-hero-btn" style={{ pointerEvents: 'auto' }} onClick={() => handleDetailClick({
              movieId: topRecommend.movieId,
              movieKey: topRecommend.movieId,
              movieNm: topRecommend.movieResponseDto.movieNm,
              movieResponseDto: topRecommend.movieResponseDto
            })}>상세보기</button>
          </div>
        )}
      </section>

      {/* 탭 헤더 */}
      <div className="movie-tab-header">
        <button className={`movie-tab-btn${activeTab === 'boxoffice' ? ' active' : ''}`} onClick={() => handleTab('boxoffice')}>무비차트</button>
        <button className={`movie-tab-btn${activeTab === 'recommend' ? ' active' : ''}`} onClick={() => handleTab('recommend')}>추천영화</button>
      </div>

      {/* 무비차트 슬라이더 */}
      {activeTab === 'boxoffice' && (
        <div className="movie-slider-container relative w-full flex items-center">
          <ArrowButton direction="left" onClick={handlePrev} disabled={sliderIdx === 0} />
          <div
            className="movie-slider-grid flex-1 overflow-hidden"
            style={{ cursor: 'grab', width: '100%', justifyContent: 'center' }}
          >
            {boxOfficeMovies.slice(sliderIdx, sliderIdx + VISIBLE_COUNT).map((movie, idx) => (
              <div key={movie.movieKey || movie.movieId} className="movie-card">
                <span className="movie-rank">{sliderIdx + idx + 1}</span>
                <img className="movie-poster" src={movie.movieResponseDto?.posters || 'https://via.placeholder.com/300x450'} alt={movie.movieResponseDto?.movieNm || movie.movieNm} />
                <div className="movie-card-title">{movie.movieResponseDto?.movieNm || movie.movieNm}</div>
                <div className="movie-card-btns">
                  <button className="movie-card-btn detail" onClick={() => handleDetailClick({
                    movieId: movie.movieId,
                    movieKey: movie.movieId,
                    movieNm: movie.movieResponseDto?.movieNm || movie.movieNm,
                    movieResponseDto: movie.movieResponseDto
                  })}>상세보기</button>
                  <button className="movie-card-btn reserve" onClick={() => handleBoxOfficeReserve(movie.movieId)}>예매하기</button>
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
            ))}
          </div>
          <ArrowButton direction="right" onClick={handleNext} disabled={sliderIdx >= maxIdx} />
        </div>
      )}

      {/* 추천영화 슬라이더 */}
      {activeTab === 'recommend' && (
        <div className="movie-slider-container relative w-full flex items-center">
          <ArrowButton direction="left" onClick={handlePrev} disabled={sliderIdx === 0} />
          <div
            className="movie-slider-grid flex-1 overflow-hidden"
            style={{ cursor: 'grab', width: '100%', justifyContent: 'center' }}
          >
            {recommendMovies.slice(sliderIdx, sliderIdx + VISIBLE_COUNT).map((movie, idx) => (
              <div key={movie.movieKey || movie.movieId} className="movie-card">
                <span className="movie-rank">{sliderIdx + idx + 1}</span>
                <img className="movie-poster" src={movie.movieResponseDto?.posters || 'https://via.placeholder.com/300x450'} alt={movie.movieResponseDto?.movieNm || movie.movieNm} />
                <div className="movie-card-title">{movie.movieResponseDto?.movieNm || movie.movieNm}</div>
                <div className="movie-card-btns">
                  <button className="movie-card-btn detail" onClick={() => handleDetailClick({
                    movieId: movie.movieId,
                    movieKey: movie.movieId,
                    movieNm: movie.movieResponseDto?.movieNm || movie.movieNm,
                    movieResponseDto: movie.movieResponseDto
                  })}>상세보기</button>
                  <button className="movie-card-btn reserve" onClick={() => handleBoxOfficeReserve(movie.movieId)}>예매하기</button>
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
            ))}
          </div>
          <ArrowButton direction="right" onClick={handleNext} disabled={sliderIdx >= maxIdx} />
        </div>
      )}

      {/* floating action buttons */}
      <div className="floating-btns">
        <button className="floating-reserve-btn" onClick={handleReserveClick} aria-label="예매하기">영화관찾기</button>
        <button className="floating-scrolltop-btn" onClick={handleScrollToTop} aria-label="맨 위로 이동">↑</button>
      </div>

      <Footer />
    </div>
  );
};

export default MainPage;