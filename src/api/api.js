import axios from 'axios';
import cookie from 'react-cookies';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost';

// 토큰 관리 함수들
const getAccessToken = () => {
  const token = localStorage.getItem('accessToken');
  return token ? `Bearer ${token}` : null;
};

const getRefreshToken = () => {
  const token = localStorage.getItem('refreshToken');
  return token ? `Bearer ${token}` : null;
};

export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    // Bearer 접두사가 있다면 제거
    const cleanToken = accessToken.replace('Bearer ', '');
    localStorage.setItem('accessToken', cleanToken);
  }
  if (refreshToken) {
    // Bearer 접두사가 있다면 제거
    const cleanToken = refreshToken.replace('Bearer ', '');
    localStorage.setItem('refreshToken', cleanToken);
  }
};

const removeTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 요청 인터셉터
api.interceptors.request.use(
  config => {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  response => {
    // 새로운 토큰이 헤더에 있으면 저장
    const newAccessToken = response.headers['authorization'];
    const newRefreshToken = response.headers['refresh-token'];
    
    if (newAccessToken || newRefreshToken) {
      setTokens(newAccessToken, newRefreshToken);
    }
    
    return response;
  },
  async error => {
    const originalRequest = error.config;
    
    // 인증이 필요한 API에 대해서만 토큰 체크
    const requiresAuth = originalRequest.url.includes('/api/chat/') || 
                        originalRequest.url.includes('/api/info/') ||
                        originalRequest.url.includes('/api/signup/nickname');

    if (requiresAuth) {
      // 토큰 만료 에러 처리
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // 토큰 갱신 시도
          const refreshToken = getRefreshToken();
          if (!refreshToken) {
            removeTokens();
            window.location.href = '/api/login/';
            return Promise.reject(error);
          }

          const response = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            {},
            { 
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': refreshToken
              }
            }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          setTokens(accessToken, newRefreshToken);

          // 원래 요청 재시도
          originalRequest.headers['Authorization'] = getAccessToken();
          return api(originalRequest);
        } catch (refreshError) {
          removeTokens();
          window.location.href = '/api/login/';
          return Promise.reject(refreshError);
        }
      }

      // 인증이 필요한 경우 로그인 페이지로 리다이렉트
      if (error.response?.status === 403) {
        removeTokens();
        window.location.href = '/api/login/';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const logout = async () => {
  try {
    const accessToken = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken
      },
    });

    if (!response.ok) {
      throw new Error('로그아웃 실패');
    }

    // localStorage에서 토큰 제거
    removeTokens();
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// 현재 사용자 정보 조회
export const getCurrentUser = async () => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }
    
    const response = await api.get('/api/me', {
      headers: {
        'Authorization': token
      }
    });

    // 응답 데이터에 googleSub가 없는 경우 에러 발생
    if (!response.data || !response.data.googleSub) {
      throw new Error('사용자 정보가 올바르지 않습니다.');
    }

    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

// 닉네임 설정
export const setNickname = async (googleSub, nickname) => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }
    
    if (!googleSub) {
      throw new Error('Google Sub is required');
    }

    const response = await api.post('/api/signup-nickname', 
      { googleSub, nickname },
      {
        headers: {
          'Authorization': token
        }
      }
    );

    // 닉네임 설정 후 사용자 정보 업데이트
    const userData = await getCurrentUser();
    return userData;
  } catch (error) {
    console.error('Set nickname error:', error);
    throw error;
  }
};

// 박스오피스 정보 조회
export const getDailyBoxOffice = async () => {
  try {
    const response = await api.get('/api/movie/box-office/daily');
    return response.data;
  } catch (error) {
    console.error('Get daily box office error:', error);
    throw error;
  }
};

// 영화 상세 정보 조회
export const getMovieDetails = async (title) => {
  try {
    const response = await api.get(`/api/movie/details?title=${encodeURIComponent(title)}`);
    
    // 응답 구조 확인 및 데이터 추출
    if (response.data && response.data.payload) {
      return response.data.payload;
    }
    
    throw new Error('영화 상세 정보를 찾을 수 없습니다.');
  } catch (error) {
    console.error('Get movie details error:', error);
    throw error;
  }
};

export const getScreenSchedules = async (requestData) => {
  try {
    console.log('API 요청 데이터:', JSON.stringify(requestData, null, 2));
    const response = await api.post('/api/screen/schedule', requestData);
    
    if (!response.data) {
      throw new Error('상영 일정을 가져오는데 실패했습니다.');
    }
    
    return response.data.payload;
  } catch (error) {
    console.error('Error fetching screen schedules:', error);
    throw error;
  }
};

// 즐겨찾기 영화 목록 조회
export const getFavoriteMovieList = async (userId) => {
  try {
    const response = await api.get(`/api/favorite/movie-list?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get favorite movie list error:', error);
    throw error;
  }
};

// 즐겨찾기 추가/제거
export const updateFavorite = async (favoriteRequestDto) => {
  try {
    const response = await api.post('/api/favorite', favoriteRequestDto);
    return response.data;
  } catch (error) {
    console.error('Update favorite error:', error);
    throw error;
  }
};

// 즐겨찾기 여부 확인
export const checkFavorite = async (userId, movieIds) => {
  try {
    // movieIds를 배열 형태로 전달
    const params = new URLSearchParams();
    params.append('userId', userId);
    movieIds.forEach(id => params.append('movieId', id));
    
    const response = await api.get(`/api/favorite?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Check favorite error:', error);
    throw error;
  }
};

// 채팅 히스토리 조회
export const getChatHistory = async (movieId, cursorCreatedAt) => {
  try {
    const params = {
      movieId,
      size: 20
    };
    console.log(cursorCreatedAt);
    if (cursorCreatedAt) {
      params.cursorCreatedAt = cursorCreatedAt;
    }
    console.log(params);
    const response = await api.get('/api/chat-log', { params });
    if (!response.data || !response.data.payload) {
      throw new Error('채팅 기록을 가져오는데 실패했습니다.');
    }
    console.log(response.data.payload);
    return response.data.payload.map(msg => ({
      type: msg.type,
      movieId,
      senderId: msg.senderId,
      nickName: msg.nickName,
      message: msg.message,
      timestamp: msg.createdAt,
      filteredMessage: msg.message
    }));
  } catch (error) {
    console.error('채팅 히스토리 조회 실패:', error);
    throw error;
  }
};

// 영화 키워드 검색 (제목 리스트 반환)
export const searchMovies = async (keyword) => {
  try {
    const response = await api.get(`/api/movie/search?keyword=${encodeURIComponent(keyword)}`);
    if (response.data && response.data.payload && Array.isArray(response.data.payload)) {
      return response.data.payload;
    }
    return [];
  } catch (error) {
    console.error('영화 키워드 검색 실패:', error);
    return [];
  }
};

// 추천 영화 목록 조회
export const getRecommendMovies = async () => {
  try {
    const response = await api.get('/api/recommend');
    return response.data;
  } catch (error) {
    console.error('Get recommend movies error:', error);
    throw error;
  }
};

export default api;
