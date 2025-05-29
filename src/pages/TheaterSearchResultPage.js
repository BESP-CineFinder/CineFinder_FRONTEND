import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMovieDetails, getScreenSchedules, checkFavorite } from '../api/api';
import { useQuery } from '@tanstack/react-query';
import '../utils/css/TheaterSearchResultPage.css';
import FilterButton from '../components/Button/Filter';
import FavoriteButton from '../components/Button/FavoriteButton';
import { AuthContext } from '../utils/auth/contexts/AuthProvider';
import SearchLoader from '../components/Loader/SearchLoader';

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

const DEFAULT_POSTER = '/assets/images/default-poster.png';

const SEOUL_CITY_HALL = { lat: 37.566826, lng: 126.9786567 };

const TheaterSearchResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useState(null);
  const [selectedChains, setSelectedChains] = useState(CHAIN_LIST.map(c => c.name));
  const [filterOpen, setFilterOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [favoriteStatus, setFavoriteStatus] = useState({});
  const filterRef = useRef(null);
  const { user } = useContext(AuthContext);
  const [isLocating, setIsLocating] = useState(false);

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
        movieNames: searchParams.movieNames ? searchParams.movieNames : []
      };

      const data = await getScreenSchedules(requestData);

      console.log(data);
      
      if (!data || !Array.isArray(data)) {
        throw new Error('검색 결과를 불러오는데 실패했습니다.');
      }

      return data;
    },
    enabled: !!searchParams && !!searchParams.lat && !!searchParams.lng,
    staleTime: 5 * 60 * 1000, // 5분 동안 캐시 유지
    cacheTime: 30 * 60 * 1000, // 30분 동안 캐시 저장
    retry: 1, // 실패 시 1번만 재시도
  });

  // 즐겨찾기 상태 가져오기
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!user || !searchResults) return;
      
      try {
        const movieIds = searchResults.map(movie => movie.id);
        const response = await checkFavorite(user.payload.userId, movieIds);
        if (response && response.success) {
          // 응답을 { movieId: favorite } 형태의 객체로 변환
          const statusMap = response.payload.reduce((acc, item) => {
            acc[item.movieId] = item.favorite;
            return acc;
          }, {});
          setFavoriteStatus(statusMap);
        }
      } catch (error) {
        console.error('즐겨찾기 상태 확인 실패:', error);
      }
    };

    fetchFavoriteStatus();
  }, [user, searchResults]);

  // 즐겨찾기 상태 업데이트 핸들러
  const handleFavoriteToggle = (movieId, newStatus) => {
    setFavoriteStatus(prev => ({
      ...prev,
      [movieId]: newStatus
    }));
  };

  const handleChainFilter = (chain) => {
    setSelectedChains((prev) =>
      prev.includes(chain)
        ? prev.filter((c) => c !== chain)
        : [...prev, chain]
    );
  };

  const handleTheaterSelect = (theater, screening, chain) => {
    // 상영일자 형식 변환
    const formatDate = (format) => {
      try {
        // TheaterSearchPage에서 전달받은 날짜 사용
        const searchDate = searchParams.date;
        const [year, month, day] = searchDate.split('-');

        switch(format) {
          case 'CGV':
          case '메가박스':
            return `${year}${month}${day}`;
          case '롯데시네마':
            return `${year}-${month}-${day}`;
          default:
            console.error('Unknown chain format:', format);
            return '';
        }
      } catch (error) {
        console.error('Date formatting error:', error);
        return '';
      }
    };

    let url = '';
    const playDate = formatDate(chain);
    
    if (!playDate) {
      console.error('Invalid play date');
      return;
    }

    if (!screening.multiplexMovieCode || !theater.code) {
      console.error('Missing required parameters:', { 
        multiplexMovieCode: screening.multiplexMovieCode, 
        theaterCode: theater.code 
      });
      return;
    }

    try {
      switch(chain) {
        case 'CGV':
          url = `https://m.cgv.co.kr/WebApp/Reservation/QuickResult.aspx?ymd=${playDate}&mgc=${screening.multiplexMovieCode}&tc=${theater.code}&rt=MOVIE`;
          break;
        case '메가박스':
          url = `https://www.megabox.co.kr/booking?movieNo=${screening.multiplexMovieCode}&brchNo1=${theater.code}&playDe=${playDate}`;
          break;
        case '롯데시네마':
          url = `https://www.lottecinema.co.kr/NLCHS/Ticketing?releaseDate=${playDate}&screenCd=1|1|${theater.code}&screenName=screen&movieCd=${screening.multiplexMovieCode}&movieName=movie`;
          break;
        default:
          console.error('알 수 없는 영화관 체인:', chain);
          return;
      }

      // URL 유효성 검사
      if (!url || url.includes('undefined') || url.includes('NaN')) {
        console.error('Invalid URL generated:', url);
        return;
      }
      console.log(url);

      window.open(url, '_blank');
    } catch (error) {
      console.error('URL generation error:', error);
    }
  };

  const handlePosterClick = async (movie) => {
    try {
      const details = await getMovieDetails(movie.name);
      const movieData = {
        ...details,
        movieId: movie.id,
        movieKey: movie.id,
        movieNm: movie.name,
        title: movie.name,
        posters: details.posters ? details.posters.split('|')[0] : movie.poster,
        stlls: details.stlls ? details.stlls.split('|') : [],
        directors: details.directors ? details.directors.split('|') : [],
        actors: details.actors ? details.actors.split('|') : [],
        vods: details.vods ? details.vods.split('|') : []
      };

      navigate(`/movie/${movie.id}`, {
        state: {
          movieData
        }
      });
    } catch (error) {
      console.error('영화 상세 정보를 가져오는데 실패했습니다:', error);
      navigate(`/movie/${movie.id}`, {
        state: {
          movieData: {
            movieId: movie.id,
            movieKey: movie.id,
            movieNm: movie.name,
            title: movie.name,
            posters: movie.poster
          }
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

  // lat/lng이 없으면 geolocation으로 받아오기
  useEffect(() => {
    if (!searchParams) return;
    if (searchParams.lat && searchParams.lng) return;
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSearchParams({
            ...searchParams,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setIsLocating(false);
        },
        () => {
          setSearchParams({
            ...searchParams,
            lat: SEOUL_CITY_HALL.lat,
            lng: SEOUL_CITY_HALL.lng
          });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setSearchParams({
        ...searchParams,
        lat: SEOUL_CITY_HALL.lat,
        lng: SEOUL_CITY_HALL.lng
      });
      setIsLocating(false);
    }
  }, [searchParams]);

  if (isLoading || isLocating) {
    return (
      <div className="theater-search-result-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%'
      }}>
        <div className="result-box" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}>
          <div className="theater-list" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '600px',
            width: '100%',
            gap: '20px'
          }}>
            <SearchLoader />
            <h3 style={{
              color: '#4f29f0',
              fontSize: '1.2rem',
              fontWeight: '500',
              fontFamily: 'B_Pro',
              margin: '40px auto',
              textAlign: 'center'
            }}>가까운 영화관에 찾아가는 중입니다...</h3>
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

  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="theater-search-result-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%'
      }}>
        <div className="result-box" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}>
          <div className="theater-list" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '600px',
            width: '100%',
            gap: '20px'
          }}>
            <h3 style={{
              color: '#4f29f0',
              fontSize: '1.2rem',
              fontWeight: '500',
              fontFamily: 'B_Pro',
              margin: '40px auto',
              textAlign: 'center'
            }}>주변에 상영 중인 영화관이 없습니다.</h3>
            <p style={{
              color: '#666',
              fontSize: '1rem',
              fontFamily: 'B_Pro',
              textAlign: 'center',
              margin: '0 auto'
            }}>다른 날짜나 시간으로 다시 검색해보세요.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="theater-search-result-container">
      <div className="result-box">
        <div className="tsr-dynamic-title">
          {searchParams && (
            <>
              <span className="tsr-time-range">{searchParams.minTime || '00:00'} ~ {searchParams.maxTime || '23:59'}</span>
              <span className="tsr-title-desc"> 근처 영화관 상영 정보</span>
            </>
          )}
        </div>
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
                    <div key={movie.id} className="tsr-movie-card tsr-movie-card-large">
                      <div className="tsr-movie-poster-area tsr-movie-poster-area-large" onClick={() => handlePosterClick(movie)} style={{ cursor: 'pointer' }}>
                        <img 
                          src={movie.poster ? movie.poster : DEFAULT_POSTER} 
                          alt={movie.name} 
                          className="tsr-movie-poster-large-img" 
                          onError={e => { e.target.src = DEFAULT_POSTER; }}
                        />
                        {user && (
                          <FavoriteButton 
                            userId={user.payload.userId} 
                            movieId={movie.id}
                            isFavorite={favoriteStatus[movie.id] || false}
                            onToggle={(newStatus) => handleFavoriteToggle(movie.id, newStatus)}
                          />
                        )}
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
                                    <div className={`tsr-theater-name-bar tsr-theater-name-bar-${chain === 'CGV' ? 'cgv' : chain === '메가박스' ? 'megabox' : 'lotte'}`}>{theaterName}</div>
                                    {Object.entries(types).map(([type, screens]) => (
                                      Object.entries(screens).map(([screen, screenings]) => (
                                        <div key={type + screen} className="tsr-screen-block">
                                          <div className={`tsr-screen-bar tsr-screen-bar-${chain === 'CGV' ? 'cgv' : chain === '메가박스' ? 'megabox' : 'lotte'}`}>{type} {screen}</div>
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
                                                  onClick={() => handleTheaterSelect(screening.theater, screening, chain)}
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