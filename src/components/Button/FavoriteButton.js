import React, { useState } from 'react';
import styled from 'styled-components';
import { updateFavoriteMovie } from '../../utils/favoriteUtils';

const FavoriteButtonWrapper = styled.button`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 2;
  
  &:hover {
    transform: scale(1.1);
    background: rgba(0, 0, 0, 0.8);
  }
  
  svg {
    width: 20px;
    height: 20px;
    fill: ${props => props.isFavorite ? '#ff4081' : '#ffffff'};
    transition: fill 0.2s;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const FavoriteButton = ({ userId, movieId, isFavorite, onToggle }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading || !userId || !movieId) return;

    setIsLoading(true);
    try {
      const response = await updateFavoriteMovie(userId, movieId);
      if (response && response.success) {
        onToggle(!isFavorite);
      } else {
        console.error('즐겨찾기 업데이트 실패:', response?.message);
      }
    } catch (error) {
      console.error('즐겨찾기 업데이트 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FavoriteButtonWrapper 
      onClick={handleClick}
      isFavorite={isFavorite}
      disabled={isLoading}
      aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
    >
      <svg viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </FavoriteButtonWrapper>
  );
};

export default FavoriteButton; 