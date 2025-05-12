import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../utils/css/TheaterSearchPage.css';
import { metropolitanCities, districts } from '../utils/data/locationData';
import { useNavigate } from 'react-router-dom';

const TheaterSearchPage = () => {
  const navigate = useNavigate();
  const [selectedMetro, setSelectedMetro] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:30');
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [isCustomTime, setIsCustomTime] = useState(false);

  // 광역지방자치단체 선택 시 해당하는 기초지방자치단체 목록 업데이트
  useEffect(() => {
    if (selectedMetro) {
      setAvailableDistricts(districts[selectedMetro] || []);
      setSelectedDistrict(''); // 광역지방자치단체가 변경되면 기초지방자치단체 선택 초기화
    } else {
      setAvailableDistricts([]);
    }
  }, [selectedMetro]);

  // 30분 간격의 시간 옵션 생성
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const handleStartTimeChange = (e) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    
    // 종료 시간이 시작 시간보다 이전이면 종료 시간을 시작 시간으로 설정
    if (newStartTime > endTime) {
      setEndTime(newStartTime);
    }
  };

  const handleEndTimeChange = (e) => {
    const newEndTime = e.target.value;
    setEndTime(newEndTime);
    
    // 시작 시간이 종료 시간보다 이후면 시작 시간을 종료 시간으로 설정
    if (newEndTime < startTime) {
      setStartTime(newEndTime);
    }
  };

  const handleCustomTimeChange = (e) => {
    const { name, value } = e.target;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (timeRegex.test(value)) {
      if (name === 'startTime') {
        setStartTime(value);
        if (value > endTime) {
          setEndTime(value);
        }
      } else {
        setEndTime(value);
        if (value < startTime) {
          setStartTime(value);
        }
      }
    }
  };

  const handleSearch = () => {
    if (!selectedMetro || !selectedDistrict || !startDate || !endDate) {
      alert('지역과 시간을 모두 선택해주세요.');
      return;
    }

    // 시작 날짜와 종료 날짜가 같은 경우 시간 비교
    if (startDate.toDateString() === endDate.toDateString() && startTime > endTime) {
      alert('종료 시간은 시작 시간보다 이후여야 합니다.');
      return;
    }

    // 검색 조건을 쿼리 파라미터로 변환
    const searchParams = new URLSearchParams({
      metro: selectedMetro,
      district: selectedDistrict,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startTime,
      endTime
    });

    // 검색 결과 페이지로 이동
    navigate(`/theater-search-result?${searchParams.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <div className="theater-search-container">
          <h1>영화관 찾기</h1>
          
          <div className="search-section">
            <div className="location-section">
              <h2>지역 선택</h2>
              <div className="select-group">
                <select
                  value={selectedMetro}
                  onChange={(e) => setSelectedMetro(e.target.value)}
                  className="select-input"
                >
                  <option value="">광역지방자치단체 선택</option>
                  {metropolitanCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="select-input"
                  disabled={!selectedMetro}
                >
                  <option value="">기초지방자치단체 선택</option>
                  {availableDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="time-section">
              <h2>시간 선택</h2>
              <div className="date-time-group">
                <div className="date-time-input">
                  <label>시작 날짜</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="yyyy년 MM월 dd일"
                    className="date-input"
                    minDate={new Date()}
                  />
                </div>
                <div className="date-time-input">
                  <label>종료 날짜</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="yyyy년 MM월 dd일"
                    className="date-input"
                    minDate={startDate}
                  />
                </div>
              </div>

              <div className="time-input-group">
                <div className="time-input-section">
                  <label>시작 시간</label>
                  {isCustomTime ? (
                    <input
                      type="text"
                      name="startTime"
                      value={startTime}
                      onChange={handleCustomTimeChange}
                      placeholder="HH:MM"
                      className="time-input"
                    />
                  ) : (
                    <select
                      value={startTime}
                      onChange={handleStartTimeChange}
                      className="time-input"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="time-input-section">
                  <label>종료 시간</label>
                  {isCustomTime ? (
                    <input
                      type="text"
                      name="endTime"
                      value={endTime}
                      onChange={handleCustomTimeChange}
                      placeholder="HH:MM"
                      className="time-input"
                    />
                  ) : (
                    <select
                      value={endTime}
                      onChange={handleEndTimeChange}
                      className="time-input"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="time-input-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={isCustomTime}
                    onChange={(e) => setIsCustomTime(e.target.checked)}
                  />
                  직접 입력
                </label>
              </div>
            </div>

            <button 
              className="search-button"
              onClick={handleSearch}
              disabled={!selectedMetro || !selectedDistrict || !startDate || !endDate}
            >
              영화관 찾기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TheaterSearchPage; 