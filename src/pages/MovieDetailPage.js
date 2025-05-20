import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../utils/css/MovieDetailPage.css';
import styled from 'styled-components';

// 한글 제목 정제 함수
const cleanTitle = (title) => (title || '').replace(/!HS|!HE|\*/g, '').trim();

// KMDB 예고편 URL을 임베딩 가능한 형식으로 변환
const getEmbeddableVodUrl = (vodUrl) => {
  if (!vodUrl) return '';
  return vodUrl;
};

const ChatButton = styled.button`
  padding: 10px 20px;
  background: #ff4081;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
  
  &:hover {
    background: #f50057;
  }
`;

const MovieDetailPage = () => {
  const { movieKey } = useParams();
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
    navigate(`/chat/${movie.movieId}`);
  };

  return (
    <div className="movie-detail-page">
      <div className="movie-backdrop" style={{ backgroundImage: `url(${movie.posterUrl})` }}>
        <div className="backdrop-overlay">
          <div className="movie-info">
            <div className="movie-poster">
              <img src={movie.posterUrl} alt={cleanTitle(movie.movieNm)} />
            </div>
            <div className="movie-details">
              <h1 className="movie-title">{cleanTitle(movie.movieNm)}</h1>
              {movie.titleEng && <h2 className="movie-original-title">{movie.titleEng}</h2>}
              
              <div className="movie-meta">
                {movie.nation && <span>{movie.nation}</span>}
                {movie.genre && <span>{movie.genre}</span>}
                {movie.runtime && <span>{movie.runtime}분</span>}
                {movie.ratingGrade && <span>{movie.ratingGrade}</span>}
              </div>

              <div className="movie-plot">
                <h3>줄거리</h3>
                <p>{movie.plotText}</p>
              </div>

              <div className="movie-cast">
                <div className="directors">
                  <h3>감독</h3>
                  <p>{Array.isArray(movie.directors) ? movie.directors.join(', ') : movie.directors}</p>
                </div>
                <div className="actors">
                  <h3>출연</h3>
                  <p>{Array.isArray(movie.actors) ? movie.actors.join(', ') : movie.actors}</p>
                </div>
              </div>

              <div className="movie-actions">
                <button 
                  className="reserve-button"
                  onClick={() => navigate(`/theater-search?movieId=${movieKey}`)}
                >
                  예매하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 예고편 슬라이더 - 유효한 예고편이 있을 때만 표시 */}
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
      {Array.isArray(movie.stills) && movie.stills.length > 0 && (
        <section className="movie-stills">
          <h2>스틸컷</h2>
          <div className="stills-grid">
            {movie.stills.map((still, idx) => (
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

      <ChatButton onClick={handleChatClick}>
        채팅방 입장하기
      </ChatButton>
    </div>
  );
};

export default MovieDetailPage; 