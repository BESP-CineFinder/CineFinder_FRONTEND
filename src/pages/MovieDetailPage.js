import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../utils/css/MovieDetailPage.css';
import styled from 'styled-components';

// 한글 제목 정제 함수
const cleanTitle = (title) => (title || '').replace(/!HS|!HE|\*/g, '').trim();

// KMDB 예고편 URL을 임베딩 가능한 형식으로 변환
const getEmbeddableVodUrl = (vodUrl) => {
  if (!vodUrl) return '';
  
  // 카카오TV URL 처리
  if (vodUrl.includes('tv.kakao.com')) {
    // URL에서 cliplink ID 추출
    const clipId = vodUrl.split('cliplink/')[1];
    if (clipId) {
      return `https://play-tv.kakao.com/embed/player/cliplink/${clipId}?service=player_share&autoplay=0&width=640&height=360`;
    }
  }
  
  return vodUrl;
};

const ActionButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 10px;
  
  &.reserve-button {
    background: #ff4081;
    color: white;
    
    &:hover {
      background: #f50057;
    }
  }
  
  &.chat-button {
    background: #3a3a3a;
    color: white;
    
    &:hover {
      background: #4a4a4a;
    }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const MovieDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const movie = location.state?.movieData;
  const [currentVodIndex, setCurrentVodIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!movie) {
    return <div className="error">영화 정보를 찾을 수 없습니다.</div>;
  }

  const handlePrevVod = () => {
    setCurrentVodIndex((prev) => (prev === 0 ? movie.vods.length - 1 : prev - 1));
  };

  const handleNextVod = () => {
    setCurrentVodIndex((prev) => (prev === movie.vods.length - 1 ? 0 : prev + 1));
  };

  // 유효한 예고편이 있는지 확인
  const hasValidVods = Array.isArray(movie.vods) && movie.vods.length > 0 && movie.vods[0];

  const handleChatClick = () => {
    navigate(`/chat/${movie.movieId}`, {
      state: {
        movieData: {
          movieId: movie.movieId,
          movieNm: movie.movieNm || movie.title,
          plotText: movie.plotText,
          posterUrl: movie.posters,
          directors: movie.directors,
          actors: movie.actors,
          genre: movie.genre,
          releaseDate: movie.releaseDate,
          title: movie.movieNm || movie.title
        }
      }
    });
  };

  const handleReserve = async () => {
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
      movieIds: [movie.movieId]
    };
    navigate('/theater-search-result', { state: searchParams });
  };

  return (
    <div className="movie-detail-page">
      <div className="movie-backdrop" style={{ backgroundImage: `url(${movie.posters})` }}>
        <div className="backdrop-overlay">
          <div className="movie-info">
            <div className="movie-poster">
              <img 
                src={movie.posters || '/images/default-poster.jpg'} 
                alt={cleanTitle(movie.title)} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default-poster.jpg';
                }}
              />
            </div>
            <div className="movie-details">
              <h1 className="movie-title">{cleanTitle(movie.title) || '제목 정보 없음'}</h1>
              {movie.titleEng && <h2 className="movie-original-title">{movie.titleEng}</h2>}
              
              <div className="movie-meta">
                {movie.nation ? <span>{movie.nation}</span> : <span>국가 정보 없음</span>}
                {movie.genre ? <span>{movie.genre}</span> : <span>장르 정보 없음</span>}
                {movie.runtime ? <span>{movie.runtime}분</span> : <span>상영시간 정보 없음</span>}
                {movie.ratingGrade ? <span>{movie.ratingGrade}</span> : <span>등급 정보 없음</span>}
                {movie.rank && <span>박스오피스 {movie.rank}위</span>}
              </div>

              <div className="movie-plot">
                <h3>줄거리</h3>
                <p>{movie.plotText || '아직 줄거리 정보가 준비되지 않았습니다. 최신 개봉 영화의 경우 정보 업데이트에 시간이 걸릴 수 있습니다.'}</p>
              </div>

              <div className="movie-cast">
                <div className="directors">
                  <h3>감독</h3>
                  <p>
                    {Array.isArray(movie.directors) && movie.directors.length > 0
                      ? movie.directors.join(', ')
                      : typeof movie.directors === 'string'
                        ? movie.directors.split('|').map(d => d.trim()).join(', ')
                        : '감독 정보 없음'}
                  </p>
                </div>
                <div className="actors">
                  <h3>출연</h3>
                  <p>
                    {Array.isArray(movie.actors) && movie.actors.length > 0
                      ? movie.actors.join(', ')
                      : typeof movie.actors === 'string'
                        ? movie.actors.split('|').map(a => a.trim()).join(', ')
                        : '출연 정보 없음'}
                  </p>
                </div>
              </div>

              <div className="movie-actions">
                <ButtonContainer>
                  <ActionButton 
                    className="reserve-button"
                    onClick={handleReserve}
                  >
                    예매하기
                  </ActionButton>
                  <ActionButton 
                    className="chat-button"
                    onClick={handleChatClick}
                  >
                    채팅방 입장
                  </ActionButton>
                </ButtonContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 예고편 슬라이더 */}
      {hasValidVods && (
        <section className="movie-vods">
          <h2>예고편</h2>
          <div className="vods-container">
            {movie.vods.length > 1 && (
              <button
                className="vod-nav-button prev"
                onClick={handlePrevVod}
                aria-label="이전 예고편"
              >
                &#8592;
              </button>
            )}
            <div className="vod-container">
              <iframe
                src={getEmbeddableVodUrl(movie.vods[currentVodIndex])}
                title={`예고편 ${currentVodIndex + 1}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {movie.vods.length > 1 && (
              <button
                className="vod-nav-button next"
                onClick={handleNextVod}
                aria-label="다음 예고편"
              >
                &#8594;
              </button>
            )}
          </div>
        </section>
      )}

      {/* 스틸컷 */}
      {Array.isArray(movie.stlls) && movie.stlls.length > 0 && (
        <section className="movie-stills">
          <h2>스틸컷</h2>
          <div className="stills-grid">
            {movie.stlls.map((still, idx) => (
              <img
                key={idx}
                src={still}
                alt={`스틸컷 ${idx + 1}`}
                loading="lazy"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MovieDetailPage; 