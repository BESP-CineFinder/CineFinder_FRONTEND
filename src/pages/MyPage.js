import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovieDetails } from '../api/api';
import styled from 'styled-components';
import BallLoader from '../components/Loader/BallLoader';

const MyPageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageTitle = styled.h1`
  color: #e8e8e8;
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const FavoriteMoviesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const MovieCard = styled.div`
  background: #212121;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.2s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const MoviePoster = styled.img`
  width: 100%;
  height: 300px;
  object-fit: cover;
`;

const MovieInfo = styled.div`
  padding: 1rem;
`;

const MovieTitle = styled.h3`
  color: #e8e8e8;
  margin: 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #888;
  padding: 2rem;
  font-size: 1.2rem;
`;

const MyPage = () => {
  const navigate = useNavigate();
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavoriteMovies = async () => {
      try {
        // localStorage에서 즐겨찾기 영화 ID 목록 가져오기
        const favoriteIds = JSON.parse(localStorage.getItem('favoriteMovies') || '[]');
        
        // 각 영화의 상세 정보 가져오기
        const movieDetails = await Promise.all(
          favoriteIds.map(id => getMovieDetails(id))
        );
        
        setFavoriteMovies(movieDetails);
      } catch (error) {
        console.error('즐겨찾기 영화를 불러오는데 실패했습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteMovies();
  }, []);

  const handleMovieClick = (movie) => {
    navigate(`/movie/${movie.id}`, {
      state: {
        movieData: movie,
        title: movie.name
      }
    });
  };

  if (loading) {
    return (
      <MyPageContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <BallLoader />
        </div>
      </MyPageContainer>
    );
  }

  return (
    <MyPageContainer>
      <PageTitle>마이페이지</PageTitle>
      <h2>즐겨찾기한 영화</h2>
      {favoriteMovies.length === 0 ? (
        <EmptyMessage>즐겨찾기한 영화가 없습니다.</EmptyMessage>
      ) : (
        <FavoriteMoviesGrid>
          {favoriteMovies.map((movie) => (
            <MovieCard key={movie.id} onClick={() => handleMovieClick(movie)}>
              <MoviePoster src={movie.poster} alt={movie.name} />
              <MovieInfo>
                <MovieTitle>{movie.name}</MovieTitle>
              </MovieInfo>
            </MovieCard>
          ))}
        </FavoriteMoviesGrid>
      )}
    </MyPageContainer>
  );
};

export default MyPage; 