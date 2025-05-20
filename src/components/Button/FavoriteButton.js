import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { isFavoriteMovie, addFavoriteMovie, removeFavoriteMovie } from '../../utils/favoriteUtils';

const FavoriteButtonWrapper = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.1);
  }
  
  svg {
    width: 24px;
    height: 24px;
    fill: ${props => props.isFavorite ? '#ff4081' : '#888'};
  }
`;

const FavoriteButton = ({ movieId, onToggle }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(isFavoriteMovie(movieId));
  }, [movieId]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isFavorite) {
      removeFavoriteMovie(movieId);
    } else {
      addFavoriteMovie(movieId);
    }
    setIsFavorite(!isFavorite);
    if (onToggle) {
      onToggle(!isFavorite);
    }
  };

  return (
    <FavoriteButtonWrapper 
      onClick={handleClick}
      isFavorite={isFavorite}
      aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
    >
      <svg viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </FavoriteButtonWrapper>
  );
};

export default FavoriteButton; 