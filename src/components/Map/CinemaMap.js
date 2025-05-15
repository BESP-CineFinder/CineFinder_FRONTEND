import React, { useEffect, useRef, useState } from "react";
import styles from "../../utils/css/CinemaMap.module.css";

const MAX_PLACES = 15;

const CinemaMap = ({ onSelectLocation, selectedLatLng, mapHeight = 420 }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const infoWindowClick = useRef(null);
  const infoWindowHover = useRef(null);
  const [mapType, setMapType] = useState("roadmap");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [error, setError] = useState(null);
  const [places, setPlaces] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [activePlaceIdx, setActivePlaceIdx] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const selectedMarkerRef = useRef(null);
  const selectedInfoWindowRef = useRef(null);

  const getMarkerSpriteY = (idx) => (idx * 46) + 10;

  // 지도 및 마커 관리
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps || !selectedLatLng) return;

    // 지도 생성 또는 center 이동
    if (!mapInstance.current) {
      try {
        const container = mapRef.current;
        const options = {
          center: new window.kakao.maps.LatLng(selectedLatLng.lat, selectedLatLng.lng),
          level: 5
        };
        mapInstance.current = new window.kakao.maps.Map(container, options);
        mapInstance.current.setZoomable(false);
      } catch (err) {
        setError("지도를 불러오는데 실패했습니다.");
        return;
      }
    } else {
      const pos = new window.kakao.maps.LatLng(selectedLatLng.lat, selectedLatLng.lng);
      mapInstance.current.setCenter(pos);
    }

    // 현 위치 마커
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(selectedLatLng.lat, selectedLatLng.lng),
      map: mapInstance.current
    });
  }, [selectedLatLng]);

  // 검색 결과 마커 관리
  useEffect(() => {
    if (!mapInstance.current) return;
    // 기존 마커 제거
    markers.forEach(m => m.setMap(null));
    if (!places.length) return;
    const newMarkers = places.map((place, idx) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(place.y, place.x),
        map: mapInstance.current,
        zIndex: 2,
        image: new window.kakao.maps.MarkerImage(
          `https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png`,
          new window.kakao.maps.Size(36, 37),
          { spriteOrigin: new window.kakao.maps.Point(0, getMarkerSpriteY(idx)), spriteSize: new window.kakao.maps.Size(36, 691) }
        )
      });
      // 마커 hover InfoWindow
      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
        if (infoWindowHover.current) infoWindowHover.current.close();
        infoWindowHover.current = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px 10px;font-size:13px;">${place.place_name}</div>`,
          zIndex: 3
        });
        infoWindowHover.current.open(mapInstance.current, marker);
        setHoveredIdx(idx);
      });
      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
        if (infoWindowHover.current) infoWindowHover.current.close();
        setHoveredIdx(null);
      });
      // 마커 클릭 InfoWindow
      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (infoWindowClick.current) infoWindowClick.current.close();
        setActivePlaceIdx(idx);
        const content = `
          <div style="padding:10px;min-width:160px;max-width:220px;align-items:center;">
            <div style="font-size:14px;margin-bottom:8px;align-items:center;">${place.place_name}</div>
            <button id="set-location-btn" style="width:100%;padding:6px 0;background:#2196F3;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">이 위치로 설정</button>
          </div>
        `;
        infoWindowClick.current = new window.kakao.maps.InfoWindow({ content, removable: true, zIndex: 1000 });
        infoWindowClick.current.open(mapInstance.current, marker);
        setTimeout(() => {
          const btn = document.getElementById('set-location-btn');
          if (btn) btn.onclick = () => {
            onSelectLocation({ lat: parseFloat(place.y), lng: parseFloat(place.x) });
            infoWindowClick.current.close();
          };
        }, 0);
      });
      return marker;
    });
    setMarkers(newMarkers);
    // 지도 bounds 조정
    const bounds = new window.kakao.maps.LatLngBounds();
    places.forEach(place => bounds.extend(new window.kakao.maps.LatLng(place.y, place.x)));
    mapInstance.current.setBounds(bounds);
    // eslint-disable-next-line
  }, [places]);

  // placeList 클릭/hover 시 해당 마커/위치로 이동/InfoWindow
  const handlePlaceItemMouseOver = (idx) => {
    if (!markers[idx]) return;
    window.kakao.maps.event.trigger(markers[idx], 'mouseover');
  };
  const handlePlaceItemMouseOut = (idx) => {
    if (!markers[idx]) return;
    window.kakao.maps.event.trigger(markers[idx], 'mouseout');
  };
  const handlePlaceItemClick = (idx) => {
    if (!markers[idx]) return;
    window.kakao.maps.event.trigger(markers[idx], 'click');
    mapInstance.current.setCenter(markers[idx].getPosition());
  };

  // 지도 클릭 시 InfoWindow 닫기
  useEffect(() => {
    if (!mapInstance.current) return;
    const handleMapClick = () => {
      if (infoWindowClick.current) infoWindowClick.current.close();
      if (infoWindowHover.current) infoWindowHover.current.close();
      setHoveredIdx(null);
    };
    window.kakao.maps.event.addListener(mapInstance.current, 'click', handleMapClick);
    return () => {
      window.kakao.maps.event.removeListener(mapInstance.current, 'click', handleMapClick);
    };
  }, []);

  // 지도 타입/줌 컨트롤
  const handleMapType = (type) => {
    if (!mapInstance.current) return;
    setMapType(type);
    mapInstance.current.setMapTypeId(
      type === "roadmap"
        ? window.kakao.maps.MapTypeId.ROADMAP
        : window.kakao.maps.MapTypeId.HYBRID
    );
  };
  const handleZoomIn = () => {
    if (!mapInstance.current) return;
    mapInstance.current.setLevel(mapInstance.current.getLevel() - 1);
  };
  const handleZoomOut = () => {
    if (!mapInstance.current) return;
    mapInstance.current.setLevel(mapInstance.current.getLevel() + 1);
  };

  // 키워드 검색
  const handleSearch = () => {
    if (!searchKeyword.trim() || !window.kakao?.maps?.services) return;
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchKeyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        setPlaces(data.slice(0, MAX_PLACES));
        setActivePlaceIdx(null);
      } else {
        setPlaces([]);
        alert("검색 결과가 없습니다.");
      }
    });
  };

  // 지도 클릭 시 선택 마커 생성
  useEffect(() => {
    if (!mapInstance.current) return;
    const handleMapClick = (mouseEvent) => {
      const latlng = mouseEvent.latLng;
      setSelectedMarker({ lat: latlng.getLat(), lng: latlng.getLng() });
    };
    window.kakao.maps.event.addListener(mapInstance.current, 'click', handleMapClick);
    return () => {
      window.kakao.maps.event.removeListener(mapInstance.current, 'click', handleMapClick);
    };
  }, []);

  // 선택 마커 관리
  useEffect(() => {
    if (!mapInstance.current) return;
    // 기존 선택 마커 제거
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setMap(null);
      selectedMarkerRef.current = null;
    }
    if (selectedInfoWindowRef.current) {
      selectedInfoWindowRef.current.close();
      selectedInfoWindowRef.current = null;
    }
    if (!selectedMarker) return;
    // 새 마커 생성
    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(selectedMarker.lat, selectedMarker.lng),
      map: mapInstance.current,
      zIndex: 3,
      image: new window.kakao.maps.MarkerImage(
        '/assets/images/my-location.png',
        new window.kakao.maps.Size(36, 37),
        { spriteOrigin: new window.kakao.maps.Point(0, 0), spriteSize: new window.kakao.maps.Size(36, 37) }
      )
    });
    selectedMarkerRef.current = marker;
    // 마커 클릭 시 InfoWindow
    window.kakao.maps.event.addListener(marker, 'click', () => {
      if (selectedInfoWindowRef.current) selectedInfoWindowRef.current.close();
      const content = `
        <div style="padding:10px;min-width:140px;max-width:200px;text-align:center;">
          <div style="font-size:14px;margin-bottom:8px;">이 위치로 설정</div>
          <button id="set-selected-location-btn" style="width:100%;padding:6px 0;background:#2196F3;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">이 위치로 설정</button>
        </div>
      `;
      selectedInfoWindowRef.current = new window.kakao.maps.InfoWindow({ content, removable: true, zIndex: 2000 });
      selectedInfoWindowRef.current.open(mapInstance.current, marker);
      setTimeout(() => {
        const btn = document.getElementById('set-selected-location-btn');
        if (btn) btn.onclick = () => {
          onSelectLocation({ lat: selectedMarker.lat, lng: selectedMarker.lng });
          selectedInfoWindowRef.current.close();
        };
      }, 0);
    });
  }, [selectedMarker, onSelectLocation]);

  if (error) {
    return (
      <section className={styles.cinemaMapSection}>
        <div className={styles.errorMessage}>
          {error}
          <p className={styles.errorSubMessage}>
            기본 위치(서울시청)가 표시됩니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.cinemaMapSection} style={{ height: mapHeight, width: '100%' }}>
      <div
        className={styles.cinemaMapMapWrapper}
        style={{
          width: '100%',
          height: '80%',
          marginTop: '10%',
          marginBottom: '10%',
          minHeight: 0,
          minWidth: 0,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 검색창+검색리스트 왼쪽 상단 고정 */}
        <div
          className={styles.cinemaMapSearchPanel}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 10,
            maxHeight: '90%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
          }}
        >
          <div className={styles.cinemaMapSearchBar}>
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="주소 또는 장소 검색"
              aria-label="주소 또는 장소 검색"
            />
            <button onClick={handleSearch}>검색</button>
          </div>
          {places.length > 0 && (
            <div className={styles.cinemaMapPlacesList}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {places.map((place, idx) => (
                  <li
                    key={place.id || idx}
                    className={
                      `${styles.cinemaMapPlaceItem} ${idx === hoveredIdx ? styles.active : ''}`
                    }
                    onMouseOver={() => handlePlaceItemMouseOver(idx)}
                    onMouseOut={() => handlePlaceItemMouseOut(idx)}
                    onClick={() => handlePlaceItemClick(idx)}
                    tabIndex={0}
                    aria-label={place.place_name}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handlePlaceItemClick(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <div style={{ width: 40, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <span
                          className={`${styles['cinemaMap-markerbg']} ${styles[`cinemaMap-marker_${idx + 1}`]}`}
                          aria-hidden="true"
                          style={{ display: 'inline-block' }}
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 48 }}>
                        <div style={{ fontSize: 15 }}>{place.place_name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{place.address_name}</div>
                        {place.road_address_name && (
                          <div style={{ fontSize: 11, color: '#999' }}>{place.road_address_name}</div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* 지도 */}
        <div
          className={styles.cinemaMapMapArea}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0,
            minWidth: 0,
          }}
        >
          <div
            ref={mapRef}
            className={styles.cinemaMapMap}
            style={{ width: '100%', height: '100%' }}
          ></div>
          {/* 지도 타입 변경 버튼 */}
          <div className={`${styles.cinemaMapCustomTypeControl} ${styles.cinemaMapRadiusBorder}`} role="group" aria-label="지도 형태 변경">
            <span
              className={mapType === 'roadmap' ? styles.cinemaMapSelectedBtn : styles.cinemaMapBtn}
              onClick={() => handleMapType('roadmap')}
              tabIndex={0}
              role="button"
              aria-label="일반 지도"
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleMapType('roadmap')}
            >
              지도
            </span>
            <span
              className={mapType === 'hybrid' ? styles.cinemaMapSelectedBtn : styles.cinemaMapBtn}
              onClick={() => handleMapType('hybrid')}
              tabIndex={0}
              role="button"
              aria-label="스카이뷰"
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleMapType('hybrid')}
            >
              스카이뷰
            </span>
          </div>
          {/* 줌 인/아웃 버튼 */}
          <div className={`${styles.cinemaMapCustomZoomControl} ${styles.cinemaMapRadiusBorder}`} role="group" aria-label="지도 확대/축소">
            <span onClick={handleZoomIn} tabIndex={0} role="button" aria-label="지도 확대" onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleZoomIn()}>
              <img src="https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/ico_plus.png" alt="확대" />
            </span>
            <span onClick={handleZoomOut} tabIndex={0} role="button" aria-label="지도 축소" onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleZoomOut()}>
              <img src="https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/ico_minus.png" alt="축소" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CinemaMap;