import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavoriteMovieList } from '../api/api';
import styled from 'styled-components';
import BallLoader from '../components/Loader/BallLoader';
import { AuthContext } from '../utils/auth/contexts/AuthProvider';
import FavoriteButton from '../components/Button/FavoriteButton';

const MyPageContainer = styled.div`
  max-width: 1200px;
  height: calc(-64px + 100vh);
  margin: 64px auto 0px;
  padding: 2rem;
  position: fixed;
  inset: 0px;
  min-height: calc(-64px + 100vh);
  background: rgb(26, 26, 26);
  overflow-y: auto;
`;

const PageTitle = styled.h1`
  color: #e8e8e8;
  margin-bottom: 2rem;
  font-size: 2rem;
  padding-top: 1rem;
`;

const SectionTitle = styled.h2`
  color: #e8e8e8;
  margin: 2rem 0 1rem;
  font-size: 1.5rem;
`;

const FavoriteMoviesContainer = styled.div`
  padding: 20px;
  position: relative;
`;

const MovieSliderContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const MovieSlider = styled.div`
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 1rem 0;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  touch-action: pan-x;
  cursor: grab;

  &::-webkit-scrollbar {
    display: none;
  }

  &.dragging {
    cursor: grabbing;
    scroll-behavior: auto;
  }
`;

const MovieCard = styled.div`
  flex: 0 0 auto;
  width: 200px;
  height: 330px;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  padding: 0.4rem 0.4rem 0.6rem 0.4rem;
  transition: all 0.3s cubic-bezier(.4,2,.3,1);
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;

  &:hover {
    transform: translateY(-8px) scale(1.04);
    box-shadow: 0 8px 24px rgba(0,0,0,0.16);
  }
`;

const MoviePoster = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  transition: all 0.3s ease;
`;

const MovieTitle = styled.h3`
  margin-top: 8px;
  font-size: 1rem;
  text-align: center;
  color: #333;
  font-weight: 600;
  line-height: 1.2;
  word-break: keep-all;
`;

const SliderButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f8f8f8;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &.prev {
    left: -1.5rem;
  }

  &.next {
    right: 2rem;
  }

  svg {
    width: 20px;
    height: 20px;
    fill: #333;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #888;
  padding: 2rem;
  font-size: 1.2rem;
  background: #212121;
  border-radius: 10px;
  margin: 1rem 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 64px);
  background: #1a1a1a;
`;

const MyPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const fetchFavoriteMovies = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await getFavoriteMovieList(user.payload.userId);
        if (response && response.success) {
          setFavoriteMovies(response.payload);
        } else {
          throw new Error('즐겨찾기 영화 목록을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError('즐겨찾기 영화 목록을 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteMovies();
  }, [user]);

  const handleMovieClick = (movie) => {
    const movieData = {
      ...movie.movieResponseDto,
      movieId: movie.movieId,
      movieKey: movie.movieResponseDto.movieKey,
      movieNm: movie.title,
      title: movie.title,
      posters: movie.movieResponseDto.posters ? movie.movieResponseDto.posters.split('|')[0] : movie.poster,
      stlls: movie.movieResponseDto.stlls ? movie.movieResponseDto.stlls.split('|') : [],
      directors: movie.movieResponseDto.directors ? movie.movieResponseDto.directors.split('|') : [],
      actors: movie.movieResponseDto.actors ? movie.movieResponseDto.actors.split('|') : [],
      vods: movie.movieResponseDto.vods ? movie.movieResponseDto.vods.split('|') : []
    };

    navigate(`/movie/${movie.movieId}`, {
      state: {
        movieData
      }
    });
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

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  if (loading) {
    return (
      <LoadingContainer>
        <BallLoader />
      </LoadingContainer>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <MyPageContainer>
      <PageTitle>마이페이지</PageTitle>
      <SectionTitle>즐겨찾기한 영화</SectionTitle>
      <FavoriteMoviesContainer>
        {!favoriteMovies || favoriteMovies.length === 0 ? (
          <EmptyMessage>즐겨찾기한 영화가 없습니다.</EmptyMessage>
        ) : (
          <MovieSliderContainer>
            <SliderButton className="prev" onClick={handlePrevClick}>
              <svg viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </SliderButton>
            <MovieSlider
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleMouseMove}
            >
              {favoriteMovies.map((movie) => (
                <MovieCard 
                  key={movie.movieId}
                  onClick={() => handleMovieClick(movie)}
                >
                  <MoviePoster 
                    src={movie.poster} 
                    alt={movie.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
                    }}
                  />
                  <MovieTitle>{movie.title}</MovieTitle>
                  <FavoriteButton 
                    userId={user.payload.userId}
                    movieId={movie.movieId}
                    isFavorite={true}
                    onToggle={() => {
                      setFavoriteMovies(prev => prev.filter(m => m.movieId !== movie.movieId));
                    }}
                  />
                </MovieCard>
              ))}
            </MovieSlider>
            <SliderButton className="next" onClick={handleNextClick}>
              <svg viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </SliderButton>
          </MovieSliderContainer>
        )}
      </FavoriteMoviesContainer>
    </MyPageContainer>
  );
};

export default MyPage; 