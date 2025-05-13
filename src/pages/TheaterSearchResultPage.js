import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMovieDetails } from '../api/api';
import { normalizeMovieKey } from '../utils/stringUtils';
import '../utils/css/TheaterSearchResultPage.css';

// 체인별로 상영 정보를 묶는 함수
const groupScreeningsByChain = (theaters) => {
  const chainMap = {};
  theaters.forEach(theater => {
    const chain = theater.chain;
    if (!chainMap[chain]) chainMap[chain] = [];
    theater.screenings.forEach(screening => {
      chainMap[chain].push({
        ...screening,
        theaterName: theater.name.replace(`${chain} `, ''), // 지점명만 추출
      });
    });
  });
  return chainMap;
};

const TheaterSearchResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        // 실제 API 연동 예시 (아래 mockData와 동일한 구조로 받아오면 됨)
        // const res = await fetch('/api/theater-search?쿼리파라미터');
        // const data = await res.json();
        // setSearchResults(data);

        // 임시 데이터 (더 다양한 지점/시간/체인)
        const mockData = [
          {
            id: 1,
            movieTitle: "듄: 파트 2",
            posterUrl: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
            theaters: [
              {
                chain: "CGV",
                name: "CGV 용산",
                address: "서울특별시 용산구 한강대로23길 55",
                screenings: [
                  { time: "10:00", totalSeats: 200, availableSeats: 150, price: 12000 },
                  { time: "14:00", totalSeats: 200, availableSeats: 80, price: 12000 }
                ]
              },
              {
                chain: "CGV",
                name: "CGV 강남",
                address: "서울특별시 강남구 역삼동 814-6",
                screenings: [
                  { time: "11:00", totalSeats: 180, availableSeats: 100, price: 12000 }
                ]
              },
              {
                chain: "롯데시네마",
                name: "롯데시네마 월드타워",
                address: "서울특별시 송파구 올림픽로 300",
                screenings: [
                  { time: "12:00", totalSeats: 220, availableSeats: 200, price: 13000 },
                  { time: "16:00", totalSeats: 220, availableSeats: 120, price: 13000 }
                ]
              },
              {
                chain: "메가박스",
                name: "메가박스 코엑스",
                address: "서울특별시 강남구 영동대로 513",
                screenings: [
                  { time: "13:00", totalSeats: 150, availableSeats: 90, price: 11000 }
                ]
              }
            ]
          },
          {
            id: 2,
            movieTitle: "웡카",
            posterUrl: "https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg",
            theaters: [
              {
                chain: "CGV",
                name: "CGV 홍대",
                address: "서울특별시 마포구 양화로 176",
                screenings: [
                  { time: "09:30", totalSeats: 120, availableSeats: 80, price: 11000 }
                ]
              },
              {
                chain: "롯데시네마",
                name: "롯데시네마 건대입구",
                address: "서울특별시 광진구 아차산로 272",
                screenings: [
                  { time: "10:30", totalSeats: 100, availableSeats: 60, price: 12000 }
                ]
              },
              {
                chain: "메가박스",
                name: "메가박스 신촌",
                address: "서울특별시 서대문구 신촌로 83",
                screenings: [
                  { time: "11:00", totalSeats: 130, availableSeats: 70, price: 11000 },
                  { time: "15:00", totalSeats: 130, availableSeats: 50, price: 11000 }
                ]
              }
            ]
          }
        ];
        setSearchResults(mockData);
      } catch (err) {
        setError('검색 결과를 불러오는데 실패했습니다.');
        console.error('Error fetching search results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [location.search]);

  const handleTheaterSelect = (theater, screening) => {
    // TODO: 예매 페이지로 이동
    console.log('Selected theater:', theater, 'Screening:', screening);
  };

  const handlePosterClick = async (movie) => {
    try {
      const movieKey = normalizeMovieKey(movie.movieTitle);
      const details = await getMovieDetails(movieKey, movie.movieTitle);
      
      const movieData = {
        ...movie,
        ...details,
        movieKey,
        movieNm: movie.movieTitle,
        posterUrl: details.posters ? details.posters.split('|')[0] : movie.posterUrl,
        stills: details.stlls ? details.stlls.split('|') : [],
        actors: Array.isArray(details.actors) ? details.actors.slice(0, 5) : [],
        vods: Array.isArray(details.vods) ? details.vods : 
              typeof details.vods === 'string' ? details.vods.split('|') : []
      };

      navigate(`/movie/${movieKey}`, {
        state: {
          movieData,
          title: movie.movieTitle
        }
      });
    } catch (error) {
      console.error('영화 상세 정보를 가져오는데 실패했습니다:', error);
      // 에러가 발생해도 기본 정보로 상세 페이지로 이동
      navigate(`/movie/${normalizeMovieKey(movie.movieTitle)}`, {
        state: {
          movieData: movie,
          title: movie.movieTitle
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
              {searchResults.map((movie) => {
                const chainMap = groupScreeningsByChain(movie.theaters);
                return (
                  <div key={movie.id} className="tsr-movie-card">
                    <div 
                      className="tsr-movie-poster"
                      onClick={() => handlePosterClick(movie)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={movie.posterUrl} alt={movie.movieTitle} />
                      <h2 className="tsr-movie-title">{movie.movieTitle}</h2>
                    </div>
                    <div className="tsr-movie-info">
                      <div className="tsr-theater-list">
                        {Object.entries(chainMap).map(([chain, screenings]) => (
                          <div key={chain} className="tsr-theater-card">
                            <div className="tsr-theater-header">
                              <span className={`tsr-theater-chain tsr-theater-chain-${chain === 'CGV' ? 'cgv' : chain === '메가박스' ? 'megabox' : 'lotte'}`}>{chain}</span>
                            </div>
                            <div className="tsr-screening-list-cards">
                              {screenings.map((screening, idx) => (
                                <div key={screening.time + screening.theaterName + idx} className="tsr-screening-card">
                                  <div className="tsr-screening-time">{screening.time}</div>
                                  <div className="tsr-screening-info">잔여석: {screening.availableSeats}/{screening.totalSeats}</div>
                                  <div className="tsr-theater-name">{screening.theaterName}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TheaterSearchResultPage; 