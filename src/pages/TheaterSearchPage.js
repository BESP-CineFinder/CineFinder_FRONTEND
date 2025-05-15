import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../utils/css/TheaterSearchPage.css';
import CinemaMap from '../components/Map/CinemaMap';
import styles from '../utils/css/CinemaMap.module.css';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import StyledButton from '../components/Button/StyledButton';
import BallLoader from '../components/Loader/BallLoader';
import DropDown from '../components/DropDown/DropDown';

const SEOUL_CITY_HALL = { lat: 37.566826, lng: 126.9786567 };

const StyledInput = styled.input`
  border: 2px solid #e8e8e8;
  padding: 15px;
  border-radius: 10px;
  background-color: #212121;
  font-size: small;
  font-weight: bold;
  text-align: center;
  color: #e8e8e8;
  width: 100%;
  box-sizing: border-box;
  &::placeholder {
    color: #888;
    opacity: 1;
  }
  &:focus {
    outline-color: white;
    background-color: #212121;
    color: #e8e8e8;
    box-shadow: 5px 5px #888888;
  }
`;

const TheaterSearchPage = () => {
  const navigate = useNavigate();
  const [selectedLatLng, setSelectedLatLng] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('24:00');
  const startTimeOptions = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`); // 00:00~23:00
  const endTimeOptions = Array.from({ length: 24 }, (_, i) => `${(i+1).toString().padStart(2, '0')}:00`); // 01:00~24:00

  // 오늘~7일 후까지만 선택 가능
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);

  // 오늘 날짜를 선택한 경우, 현재 시간 이후만 시작 시간으로 선택 가능
  const isToday = selectedDate.toDateString() === today.toDateString();
  const currentHour = today.getHours();
  const filteredStartTimeOptions = isToday
    ? startTimeOptions.filter((time, idx) => idx >= currentHour)
    : startTimeOptions;

  // 종료 시간은 시작 시간보다 이후 시간대만 선택 가능, 24:00까지만
  const filteredEndTimeOptions = endTimeOptions.filter(time => time > startTime);

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
    console.log('검색 파라미터:', params);
    const searchParams = new URLSearchParams(params);
    navigate(`/theater-search-result?${searchParams.toString()}`);
  };

  return (
    <div className="theater-search-layout">
      <form className="search-form" onSubmit={e => { e.preventDefault(); handleSearch(); }}>
        <h2>상영관 검색</h2>
        <div className="search-form-row">
          <div className="form-group">
            <label className="form-group-label" htmlFor="date">날짜</label>
            <DatePicker
              className="search-form-date-input"
              id="date"
              selected={selectedDate}
              onChange={setSelectedDate}
              dateFormat="yyyy-MM-dd"
              minDate={today}
              maxDate={maxDate}
              customInput={<StyledInput />}
            />
          </div>
          <div className="form-group">
            <label className="form-group-label" htmlFor="startTime">시작 시간</label>
            <DropDown
              id="startTime"
              options={filteredStartTimeOptions.map(time => ({ label: time, value: time }))}
              value={startTime}
              onChange={setStartTime}
            />
          </div>
          <div className="form-group">
            <label className="form-group-label" htmlFor="endTime">종료 시간</label>
            <DropDown
              id="endTime"
              options={filteredEndTimeOptions.map(time => ({ label: time, value: time }))}
              value={endTime}
              onChange={setEndTime}
            />
          </div>
        </div>
        <StyledButton type="submit" text="영화관 찾기"/>
      </form>
      <div style={{ marginBottom: 0, marginTop: 0 }}>
          <label>반경 1km 내 영화관 탐색 기준 정하기</label><br />
          <span style={{ color: "#888" }}>지도를 클릭 or 장소 검색 후 위치를 선택하세요.</span>
        </div>
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
          <BallLoader />
        </div>
      )}
    </div>
  );
};

export default TheaterSearchPage; 