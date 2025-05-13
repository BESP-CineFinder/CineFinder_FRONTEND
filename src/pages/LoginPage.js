import React, { useState } from 'react';

function LoginPage() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 리다이렉트 URL도 상대 경로로 변경
      window.location.href = 'https://localhost/api/login/';
    } catch (err) {
      setError(err.message);
      console.error('로그인 에러:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4rem' }}>
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      <button
        onClick={handleKakaoLogin}
        disabled={isLoading}
        aria-label="카카오로 로그인"
        style={{
          background: '#FEE500',
          color: '#181600',
          border: 'none',
          borderRadius: '8px',
          padding: '1rem 2.5rem',
          fontWeight: 700,
          fontSize: '1.1rem',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? '로그인 중...' : '카카오로 로그인'}
      </button>
    </div>
  );
}

export default LoginPage;