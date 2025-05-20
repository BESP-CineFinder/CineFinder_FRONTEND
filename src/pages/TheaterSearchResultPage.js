import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMovieDetails, getScreenSchedules } from '../api/api';
import { useQuery } from '@tanstack/react-query';
import '../utils/css/TheaterSearchResultPage.css';
import FilterButton from '../components/Button/Filter';

// HTML 엔티티를 디코딩하는 함수
const decodeHtmlEntities = (text) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

// 지점 → 상영형식 → 상영관(스크린명) → 상영정보로 그룹핑하는 함수
function groupByTheaterTypeScreen(screenings) {
  const result = {};
  screenings.forEach(s => {
    const theaterName = s.theater.name;
    const type = decodeHtmlEntities(s.film || '일반');
    const screen = decodeHtmlEntities(s.screen || '');
    if (!result[theaterName]) result[theaterName] = {};
    if (!result[theaterName][type]) result[theaterName][type] = {};
    if (!result[theaterName][type][screen]) result[theaterName][type][screen] = [];
    result[theaterName][type][screen].push(s);
  });
  return result;
}

const CHAIN_LIST = [
  { name: 'CGV', color: 'linear-gradient(90deg, #e31837 60%, #b71c1c 100%)' },
  { name: '롯데시네마', color: 'linear-gradient(90deg, #ed1c24 60%, #ff6f61 100%)' },
  { name: '메가박스', color: 'linear-gradient(90deg, #4a1e8f 60%, #6c2eb7 100%)' },
];

const TheaterSearchResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useState(null);
  const [selectedChains, setSelectedChains] = useState(CHAIN_LIST.map(c => c.name));
  const [filterOpen, setFilterOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    if (location.state) {
      setSearchParams(location.state);
    }
  }, [location.state]);

  useEffect(() => {
    if (!filterOpen) return;
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filterOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // React Query를 사용한 검색 결과 캐싱
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['screenSchedules', searchParams],
    queryFn: async () => {
      if (!searchParams) return null;
      
      if (!searchParams.lat || !searchParams.lng) {
        throw new Error('위치 정보가 필요합니다.');
      }

      const requestData = {
        lat: searchParams.lat.toString(),
        lng: searchParams.lng.toString(),
        date: searchParams.date,
        minTime: searchParams.minTime,
        maxTime: searchParams.maxTime,
        distance: searchParams.distance.toString(),
        movieNames: []
      };

      const data = await getScreenSchedules(requestData);
      
      if (!data || !Array.isArray(data)) {
        throw new Error('검색 결과를 불러오는데 실패했습니다.');
      }

      return data;
    },
    enabled: !!searchParams,
    staleTime: 5 * 60 * 1000, // 5분 동안 캐시 유지
    cacheTime: 30 * 60 * 1000, // 30분 동안 캐시 저장
    retry: 1, // 실패 시 1번만 재시도
  });

  const handleChainFilter = (chain) => {
    setSelectedChains((prev) =>
      prev.includes(chain)
        ? prev.filter((c) => c !== chain)
        : [...prev, chain]
    );
  };

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
      const details = await getMovieDetails(movie.name);
      const movieData = {
        ...movie,
        ...details,
        movieId: movie.id,
        movieKey: movie.id,
        movieNm: movie.name,
        posterUrl: movie.poster,
        stills: details.stlls ? details.stlls.split('|') : [],
        actors: Array.isArray(details.actors) ? details.actors.slice(0, 5) : [],
        vods: Array.isArray(details.vods) ? details.vods : 
              typeof details.vods === 'string' ? details.vods.split('|') : []
      };

      navigate(`/movie/${movie.id}`, {
        state: {
          movieData,
          title: movie.name
        }
      });
    } catch (error) {
      console.error('영화 상세 정보를 가져오는데 실패했습니다:', error);
      navigate(`/movie/${movie.id}`, {
        state: {
          movieData: {
            ...movie,
            movieId: movie.id,
            movieKey: movie.id
          },
          title: movie.name
        }
      });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (isLoading) {
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
            <div className="tsr-error">{error.message}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theater-search-result-container">
      <div className="result-box">
        <h1>검색 결과</h1>
        <div className="tsr-chain-filter-bar">
          <span onClick={() => setFilterOpen((v) => !v)} aria-label="필터 열기" style={{display:'inline-flex', cursor:'pointer'}}>
            <FilterButton />
          </span>
          {showScrollTop && (
            <button 
              className="tsr-scroll-to-top-btn" 
              onClick={handleScrollToTop}
              aria-label="맨 위로 이동"
            >
              <svg viewBox="0 0 24 24">
                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
              </svg>
            </button>
          )}
          {filterOpen && (
            <div className="tsr-chain-filter-popover" ref={filterRef}>
              {CHAIN_LIST.map((chain) => (
                <label key={chain.name} className="tsr-chain-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedChains.includes(chain.name)}
                    onChange={() => handleChainFilter(chain.name)}
                  />
                  <span className="tsr-chain-checkbox-color" style={{ background: chain.color }} />
                  <span className="tsr-chain-checkbox-text">{chain.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="theater-list">
          {!searchResults || searchResults.length === 0 ? (
            <div className="tsr-no-results">검색 결과가 없습니다.</div>
          ) : (
            <div className="tsr-movie-list">
              {searchResults
                .filter((movie) => Object.keys(movie.schedule).some(chain => selectedChains.includes(chain)))
                .map((movie) => {
                  return (
                    <div key={movie.id} className="tsr-movie-card">
                      <div className="tsr-movie-poster-area" onClick={() => handlePosterClick(movie)} style={{ cursor: 'pointer' }}>
                        <img src={movie.poster} alt={movie.name} className="tsr-movie-poster-large" />
                        <div className="tsr-movie-title">{movie.name}</div>
                      </div>
                      <div className="tsr-movie-content-area">
                        {Object.entries(movie.schedule)
                          .filter(([chain]) => selectedChains.includes(chain))
                          .map(([chain, screenings]) => {
                            const grouped = groupByTheaterTypeScreen(screenings);
                            return (
                              <div key={chain} className="tsr-chain-block">
                                <div className={`tsr-theater-chain tsr-theater-chain-${chain === 'CGV' ? 'cgv' : chain === '메가박스' ? 'megabox' : 'lotte'}`}>{chain}</div>
                                {Object.entries(grouped).map(([theaterName, types]) => (
                                  <div key={theaterName} className="tsr-theater-block">
                                    <div className="tsr-theater-name-bar">{theaterName}</div>
                                    {Object.entries(types).map(([type, screens]) => (
                                      Object.entries(screens).map(([screen, screenings]) => (
                                        <div key={type + screen} className="tsr-screen-block">
                                          <div className="tsr-screen-bar">{type} {screen}</div>
                                          <div className="tsr-screening-list-cards">
                                            {screenings
                                              .sort((a, b) => {
                                                const timeA = new Date(`2000-01-01T${a.start}`);
                                                const timeB = new Date(`2000-01-01T${b.start}`);
                                                return timeA - timeB;
                                              })
                                              .map((screening, idx) => (
                                                <div 
                                                  key={`${screening.theater.id}-${screening.start}-${idx}`} 
                                                  className="tsr-screening-card"
                                                  onClick={() => handleTheaterSelect(screening.theater, screening, screening.chain)}
                                                >
                                                  <div className="tsr-theater-time">{screening.start} ~ {screening.end}</div>
                                                  <div className="tsr-screening-info-remaining-seats">{screening.remainingSeats} / {screening.totalSeats}</div>
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      ))
                                    ))}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
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