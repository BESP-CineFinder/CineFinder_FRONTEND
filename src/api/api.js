import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:8080/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 120000, // 120초 타임아웃 설정
  headers: {
    'Content-Type': 'application/json',
  }
});

// 요청 인터셉터 설정
api.interceptors.request.use(
  config => {
    // 요청 전에 수행할 작업
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
api.interceptors.response.use(
  response => {
    // 응답에서 Refresh-Token 헤더를 읽어 로컬 스토리지에 저장
    const refreshToken = response.headers['refresh-token'];
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    return response;
  },
  async error => {
    const originalRequest = error.config;
    
    // 타임아웃 에러인 경우 재시도
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      return api(originalRequest);
    }

    // 네트워크 에러 처리
    if (!error.response) {
      console.error('네트워크 에러:', error.message);
      throw new Error('서버와의 연결이 불안정합니다. 잠시 후 다시 시도해주세요.');
    }

    // 기타 에러 처리
    console.error('API 에러:', error);
    return Promise.reject(error);
  }
);

export default api;
