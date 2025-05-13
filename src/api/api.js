import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

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
    
    // 토큰 만료 에러 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 토큰 갱신 시도
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          removeTokens();
          window.location.href = '/login';
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
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // 인증이 필요한 경우 로그인 페이지로 리다이렉트
    if (error.response?.status === 403) {
      removeTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export const removeCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const logout = async () => {
  try {
    const accessToken = getAccessToken();
    const response = await fetch('/api/logout', {
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

    // 쿠키 제거
    removeCookie('Refresh-Token');
    removeCookie('JSESSIONID');
    
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
    const response = await api.get('/api/daily-box-office');
    return response.data;
  } catch (error) {
    console.error('Get daily box office error:', error);
    throw error;
  }
};

// 영화 상세 정보 조회
export const getMovieDetails = async (movieKey, title) => {
  try {
    if (!movieKey || !title) {
      throw new Error('movieKey와 title은 필수 파라미터입니다.');
    }

    const response = await api.get(`/api/movie-details?movieKey=${encodeURIComponent(movieKey)}&title=${encodeURIComponent(title)}`);
    return response.data;
  } catch (error) {
    console.error('Get movie details error:', error);
    throw error;
  }
};

export default api;
