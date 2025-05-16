import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMovieDetails, getScreenSchedules } from '../api/api';
import { normalizeMovieKey } from '../utils/stringUtils';
import '../utils/css/TheaterSearchResultPage.css';

// HTML 엔티티를 디코딩하는 함수
const decodeHtmlEntities = (text) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

const TheaterSearchResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useState(null);

  useEffect(() => {
    if (location.state) {
      setSearchParams(location.state);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchParams) return;  // searchParams가 없으면 API 호출하지 않음
      
      try {
        setLoading(true);
        
        if (!searchParams.lat || !searchParams.lng) {
          setError('위치 정보가 필요합니다.');
          setLoading(false);
          return;
        }

        // API 요청 데이터 준비
        const requestData = {
          lat: searchParams.lat.toString(),
          lng: searchParams.lng.toString(),
          date: searchParams.date,
          minTime: searchParams.minTime,
          maxTime: searchParams.maxTime,
          distance: searchParams.distance.toString(),
          movieNames: []  // 항상 빈 배열로 설정
        };

        const data = await getScreenSchedules(requestData);
        
        if (!data || !Array.isArray(data)) {
          console.error('API 응답이 올바르지 않습니다:', data);
          setError('검색 결과를 불러오는데 실패했습니다.');
          setLoading(false);
          return;
        }

        setSearchResults(data);
      } catch (err) {
        setError('검색 결과를 불러오는데 실패했습니다.');
        console.error('Error fetching search results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchParams]);

  const handleTheaterSelect = (theater, screening, chain) => {
    let url = '';
    
    switch(chain) {
      case 'CGV':
        url = 'https://www.cgv.co.kr/';
        break;
      case '롯데시네마':
        url = 'https://www.lottecinema.co.kr/';
        break;
      case '메가박스':
        url = 'https://www.megabox.co.kr/';
        break;
      default:
        console.error('알 수 없는 영화관 체인:', chain);
        return;
    }
    
    window.open(url, '_blank');
  };

  const handlePosterClick = async (movie) => {
    try {
      const movieKey = normalizeMovieKey(movie.name);
      const details = await getMovieDetails(movieKey, movie.name);
      
      const movieData = {
        ...movie,
        ...details,
        movieKey,
        movieNm: movie.name,
        posterUrl: movie.poster,
        stills: details.stlls ? details.stlls.split('|') : [],
        actors: Array.isArray(details.actors) ? details.actors.slice(0, 5) : [],
        vods: Array.isArray(details.vods) ? details.vods : 
              typeof details.vods === 'string' ? details.vods.split('|') : []
      };

      navigate(`/movie/${movieKey}`, {
        state: {
          movieData,
          title: movie.name
        }
      });
    } catch (error) {
      console.error('영화 상세 정보를 가져오는데 실패했습니다:', error);
      navigate(`/movie/${normalizeMovieKey(movie.name)}`, {
        state: {
          movieData: movie,
          title: movie.name
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="theater-search-result-container">
        <div className="result-box">
          <h1>검색 결과</h1>
          <div className="theater-list">
            <div className="tsr-loading">검색 결과를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theater-search-result-container">
        <div className="result-box">
          <h1>검색 결과</h1>
          <div className="theater-list">
            <div className="tsr-error">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theater-search-result-container">
      <div className="result-box">
        <h1>검색 결과</h1>
        <div className="theater-list">
          {searchResults.length === 0 ? (
            <div className="tsr-no-results">검색 결과가 없습니다.</div>
          ) : (
            <div className="tsr-movie-list">
              {searchResults.map((movie) => (
                <div key={movie.id} className="tsr-movie-card">
                  <div 
                    className="tsr-movie-poster"
                    onClick={() => handlePosterClick(movie)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={movie.poster} alt={movie.name} />
                    <h2 className="tsr-movie-title">{movie.name}</h2>
                  </div>
                  <div className="tsr-movie-info">
                    <div className="tsr-theater-list">
                      {Object.entries(movie.schedule).map(([chain, screenings]) => (
                        <div key={chain} className="tsr-theater-card">
                          <div className="tsr-theater-header">
                            <span className={`tsr-theater-chain tsr-theater-chain-${chain === 'CGV' ? 'cgv' : chain === '메가박스' ? 'megabox' : 'lotte'}`}>{chain}</span>
                          </div>
                          <div className="tsr-screening-list-cards">
                            {screenings
                              .sort((a, b) => {
                                // 시간 문자열을 Date 객체로 변환하여 비교
                                const timeA = new Date(`2000-01-01T${a.start}`);
                                const timeB = new Date(`2000-01-01T${b.start}`);
                                return timeA - timeB;
                              })
                              .map((screening, idx) => (
                              <div 
                                key={`${screening.theater.id}-${screening.start}-${idx}`} 
                                className="tsr-screening-card"
                                onClick={() => handleTheaterSelect(screening.theater, screening, chain)}
                              >
                                <div className="tsr-screening-name">지점명: {screening.theater.name}</div>
                                <div className="tsr-screening-info">
                                  <div className="tsr-screening-info-remaining-seats">잔여석: {screening.remainingSeats}/{screening.totalSeats}</div>
                                  <div className="tsr-screening-info-screen">상영관: {decodeHtmlEntities(screening.screen)}</div>
                                  {screening.film && (
                                    <div className="tsr-screening-info-platform">상영형식: {decodeHtmlEntities(screening.film)}</div>
                                  )}
                                </div>
                                <div className="tsr-theater-time">{screening.start} ~ {screening.end}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TheaterSearchResultPage; 