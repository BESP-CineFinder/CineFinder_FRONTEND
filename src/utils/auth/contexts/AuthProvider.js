import React, { createContext, useEffect, useState } from 'react';
import { setTokens } from '../../../api/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 쿠키에 RefreshToken 있으면 /api/info 호출
    fetch('/api/info', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    })
      .then(res => {
        if (!res.ok) return null;
        
        // 응답 헤더에서 토큰 추출
        const accessToken = res.headers.get('Authorization');
        const refreshToken = res.headers.get('refresh-token');
        
        // 토큰이 있으면 localStorage에 저장
        if (accessToken && refreshToken) {
          setTokens(accessToken, refreshToken);
        }
        
        return res.json();
      })
      .then(data => {
        if (data && data.success) {
          // 응답 데이터 구조에 맞게 user 상태 설정
          setUser({
            ...data,
            isAuthenticated: true
          });
        } else {
          setUser(null);
        }
      })
      .catch(error => {
        console.error('사용자 정보 조회 실패:', error);
        setUser(null);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}