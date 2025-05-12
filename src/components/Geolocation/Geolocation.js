import React, { useState } from 'react';
import '../../utils/css/Geolocation.css';

const Geolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGetLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('위치 정보 접근 권한이 거부되었습니다.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('위치 정보를 사용할 수 없습니다.');
            break;
          case error.TIMEOUT:
            setError('위치 정보 요청 시간이 초과되었습니다.');
            break;
          default:
            setError('위치 정보를 가져오는 중 오류가 발생했습니다.');
        }
        setLoading(false);
      }
    );
  };

  return (
    <div className="geolocation-container">
      {!location && !loading && !error && (
        <button 
          className="geolocation-button"
          onClick={handleGetLocation}
          aria-label="현재 위치 가져오기"
        >
          현재 위치 가져오기
        </button>
      )}

      {loading && (
        <div className="geolocation-loading">
          위치 정보를 가져오는 중...
        </div>
      )}

      {error && (
        <div className="geolocation-error">
          {error}
        </div>
      )}

      {location && (
        <div className="geolocation-info">
          <h3>현재 위치</h3>
          <p>위도: {location.latitude.toFixed(6)}</p>
          <p>경도: {location.longitude.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
};

export default Geolocation; 