import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../utils/css/TheaterSearchPage.css';
import CinemaMap from '../components/CinemaMap';
import styles from '../utils/css/CinemaMap.module.css';
import { useNavigate } from 'react-router-dom';

const SEOUL_CITY_HALL = { lat: 37.566826, lng: 126.9786567 };

const TheaterSearchPage = () => {
  const navigate = useNavigate();
  const [selectedLatLng, setSelectedLatLng] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('24:00');
  const timeOptions = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  useEffect(() => {
    if (selectedLatLng) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setSelectedLatLng({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setSelectedLatLng(SEOUL_CITY_HALL),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setSelectedLatLng(SEOUL_CITY_HALL);
    }
  }, [selectedLatLng]);

  const handleSearch = () => {
    if (!selectedLatLng) {
      alert('지도를 클릭해 위치를 선택하세요.');
      return;
    }
    const params = {
      lat: selectedLatLng.lat,
      lng: selectedLatLng.lng,
      date: selectedDate.toISOString().slice(0, 10),
      startTime,
      endTime
    };
    const searchParams = new URLSearchParams(params);
    navigate(`/theater-search-result?${searchParams.toString()}`);
  };

  return (
    <div className="theater-search-layout">
      <form className="search-form" onSubmit={e => { e.preventDefault(); handleSearch(); }}>
        <h2>상영관 검색</h2>
        <div style={{ marginBottom: 16 }}>
          <label>날짜</label><br />
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            dateFormat="yyyy-MM-dd"
            minDate={new Date()}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>시작 시간</label><br />
          <select value={startTime} onChange={e => setStartTime(e.target.value)}>
            {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>종료 시간</label><br />
          <select value={endTime} onChange={e => setEndTime(e.target.value)}>
            {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>선택 위치</label><br />
          {selectedLatLng
            ? <span>위도: {selectedLatLng.lat}, 경도: {selectedLatLng.lng}</span>
            : <span style={{ color: "#888" }}>지도를 클릭해 위치를 선택하세요.</span>
          }
        </div>
        <button type="submit">검색</button>
      </form>
      {selectedLatLng ? (
        <div className={styles.cinemaMapMapMini}>
          <CinemaMap
            onSelectLocation={setSelectedLatLng}
            selectedLatLng={selectedLatLng}
            mapHeight={650}
          />
        </div>
      ) : (
        <div className={styles.cinemaMapMapMini} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span style={{color: '#888', fontSize: '1.1rem'}}>지도를 불러오는 중...</span>
        </div>
      )}
    </div>
  );
};

export default TheaterSearchPage; 