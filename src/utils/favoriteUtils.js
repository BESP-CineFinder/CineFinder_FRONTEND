// 즐겨찾기 영화 ID 목록 가져오기
export const getFavoriteMovies = () => {
  return JSON.parse(localStorage.getItem('favoriteMovies') || '[]');
};

// 즐겨찾기 추가
export const addFavoriteMovie = (movieId) => {
  const favorites = getFavoriteMovies();
  if (!favorites.includes(movieId)) {
    favorites.push(movieId);
    localStorage.setItem('favoriteMovies', JSON.stringify(favorites));
  }
};

// 즐겨찾기 제거
export const removeFavoriteMovie = (movieId) => {
  const favorites = getFavoriteMovies();
  const updatedFavorites = favorites.filter(id => id !== movieId);
  localStorage.setItem('favoriteMovies', JSON.stringify(updatedFavorites));
};

// 즐겨찾기 여부 확인
export const isFavoriteMovie = (movieId) => {
  const favorites = getFavoriteMovies();
  return favorites.includes(movieId);
}; 