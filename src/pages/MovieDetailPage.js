import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../utils/css/MovieDetailPage.css';

const MovieDetailPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        setLoading(true);
        // TODO: 실제 API 연동
        // const response = await fetch(`/api/movies/${movieId}`);
        // const data = await response.json();
        // setMovie(data);

        // 임시 데이터
        const mockData = {
          id: movieId,
          title: "듄: 파트 2",
          originalTitle: "Dune: Part Two",
          posterUrl: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
          backdropUrl: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
          releaseDate: "2024-03-01",
          runtime: 166,
          rating: 8.5,
          genres: ["SF", "드라마", "모험"],
          director: "드니 빌뇌브",
          cast: ["티모시 샬라메", "젠다야", "레베카 퍼거슨"],
          synopsis: "폴 아트레이드가 샤두크 하라콘과 함께 아라키스의 사막을 여행하며 프레멘 부족과 함께하는 동안, 그는 자신의 운명을 받아들이고 사랑과 가족을 위해 미래를 향해 나아가야 합니다.",
          trailerUrl: "https://www.youtube.com/embed/your-trailer-id"
        };
        setMovie(mockData);
      } catch (err) {
        setError('영화 정보를 불러오는데 실패했습니다.');
        console.error('Error fetching movie details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetail();
  }, [movieId]);

  if (loading) {
    return (
      <div className="movie-detail-container">
        <div className="movie-detail-loading">영화 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movie-detail-container">
        <div className="movie-detail-error">{error}</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="movie-detail-container">
        <div className="movie-detail-error">영화를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="movie-detail-container">
      <div className="movie-detail-backdrop" style={{ backgroundImage: `url(${movie.backdropUrl})` }}>
        <div className="movie-detail-overlay">
          <div className="movie-detail-content">
            <div className="movie-detail-poster">
              <img src={movie.posterUrl} alt={movie.title} />
            </div>
            <div className="movie-detail-info">
              <h1 className="movie-detail-title">{movie.title}</h1>
              <p className="movie-detail-original-title">{movie.originalTitle}</p>
              
              <div className="movie-detail-meta"> 
                <span className="movie-detail-rating">⭐ {movie.rating}</span>
                <span className="movie-detail-year">{movie.releaseDate.split('-')[0]}</span>
                <span className="movie-detail-runtime">{movie.runtime}분</span>
              </div>

              <div className="movie-detail-genres">
                {movie.genres.map((genre, index) => (
                  <span key={index} className="movie-detail-genre">{genre}</span>
                ))}
              </div>

              <div className="movie-detail-section">
                <h3>감독</h3>
                <p>{movie.director}</p>
              </div>

              <div className="movie-detail-section">
                <h3>출연</h3>
                <p>{movie.cast.join(', ')}</p>
              </div>

              <div className="movie-detail-section">
                <h3>줄거리</h3>
                <p>{movie.synopsis}</p>
              </div>

              <div className="movie-detail-actions">
                <button 
                  className="movie-detail-button"
                  onClick={() => navigate(`/theater-search?movieId=${movie.id}`)}
                >
                  예매하기
                </button>
                <button 
                  className="movie-detail-button secondary"
                  onClick={() => window.open(movie.trailerUrl, '_blank')}
                >
                  예고편 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage; 