import { getFavoriteMovieList, updateFavorite, checkFavorite } from '../api/api';

// 즐겨찾기 영화 목록 가져오기
export const getFavoriteMovies = async (userId) => {
  try {
    const response = await getFavoriteMovieList(userId);
    return response.payload || [];
  } catch (error) {
    console.error('즐겨찾기 목록을 가져오는데 실패했습니다:', error);
    return [];
  }
};

// 즐겨찾기 추가/제거
export const updateFavoriteMovie = async (userId, movieId) => {
  try {
    const response = await updateFavorite({ userId, movieId });
    return response;
  } catch (error) {
    console.error('즐겨찾기 업데이트에 실패했습니다:', error);
    throw error;
  }
};

// 즐겨찾기 여부 확인
export const isFavoriteMovie = async (userId, movieId) => {
  try {
    const response = await checkFavorite(userId, movieId);
    return response;
  } catch (error) {
    console.error('즐겨찾기 확인에 실패했습니다:', error);
    throw error;
  }
}; 