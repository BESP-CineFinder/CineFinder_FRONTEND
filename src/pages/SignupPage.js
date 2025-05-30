import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
  const [kakaoSub, setKakaoSub] = useState('');
  const [kakaoEmail, setKakaoEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/signup/session', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('세션 정보를 불러올 수 없습니다.');
        return res.json();
      })
      .then(data => {
        setKakaoSub(data.payload.kakaoSub);
        setKakaoEmail(data.payload.kakaoEmail);
      })
      .catch(() => setError('카카오 인증 세션이 만료되었습니다. 다시 로그인 해주세요.'));
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/signup/nickname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ kakaoSub, kakaoEmail, nickname }),
    });
    console.log(res);
    if (res.status === 201) {
      navigate('/');
    } else {
      setError('회원가입에 실패했습니다. 닉네임을 다시 확인해주세요.');
    }
  };

  if (error) {
    return <div style={{ color: 'red', marginTop: '2rem', textAlign: 'center' }}>{error}</div>;
  }

  return (
    <form onSubmit={handleSignup} style={{ maxWidth: 360, margin: '4rem auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: 24 }}>카카오 회원가입</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600 }}>카카오 이메일</label>
        <div style={{ marginTop: 4, color: '#555', fontSize: 15 }}>{kakaoEmail}</div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label htmlFor="nickname" style={{ fontWeight: 600 }}>닉네임</label>
        <input
          id="nickname"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="닉네임 입력"
          required
          aria-label="닉네임"
          style={{ width: '88%', padding: '0.7rem', borderRadius: 6, border: '1px solid #ccc', marginTop: 4, fontSize: 15 }}
        />
      </div>
      <button type="submit" style={{ width: '100%', background: '#FEE500', color: '#181600', border: 'none', borderRadius: 8, padding: '0.9rem', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer' }}>
        회원가입 완료
      </button>
    </form>
  );
}

export default SignupPage;