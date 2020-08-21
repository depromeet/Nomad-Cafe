/* global kakao */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useHistory } from "react-router-dom";
import debounce from "lodash.debounce";
import { toJS } from "mobx";
import { observer } from "mobx-react";
import useStore from "../hooks/useStore";
import Map from "../components/Map/Map";
import { ReactComponent as LocationIcon } from "../images/icon-locate.svg";
import { ReactComponent as LocationActiveIcon } from "../images/icon-locate-active.svg";
import FloatingActionButton from "../components/FloatingActionButton/FloatingActionButton";
import Card from "../components/Card/Card";
import useGeoLocation from "../hooks/useGeoLocation";
import MapPickerSprite from "../images/icon-mappicker-sprite.png";

const selectedMarkerImage = new kakao.maps.MarkerImage(MapPickerSprite, new kakao.maps.Size(48, 48), {
  spriteOrigin: new kakao.maps.Point(24, 0),
  spriteSize: new kakao.maps.Size(72, 48),
  offset: new kakao.maps.Point(23, 46),
});
const unselectedMarkerImage = new kakao.maps.MarkerImage(MapPickerSprite, new kakao.maps.Size(24, 24), {
  spriteOrigin: new kakao.maps.Point(0, 0),
  spriteSize: new kakao.maps.Size(72, 48),
});

const MapContainer = () => {
  const history = useHistory();
  const mapRef = useRef(null);
  const { currentCoordinates, fetch, isFetching } = useGeoLocation();

  const { CardStore } = useStore();

  const [mapInstance, setMapInstance] = useState(null);
  const [cafeData, setCafeData] = useState([]);
  const [nowSelectingCafe, setNowSelectingCafe] = useState({
    marker: null,
    info: null,
  });
  const [isOutOfCenter, setIsOutOfCenter] = useState(true);

  const getKakaoMapObject = useCallback(() => {
    const container = mapRef.current;
    const options = {
      center: new kakao.maps.LatLng(33.450701, 126.570667),
      level: 3,
    };

    const kakaoMap = new window.kakao.maps.Map(container, options);
    return kakaoMap;
  }, []);

  const createMarker = useCallback((title, position, image) => {
    const marker = new kakao.maps.Marker({
      title,
      position,
      image,
      clickable: true,
    });

    return marker;
  }, []);

  const handleClickMarker = useCallback(data => {
    setNowSelectingCafe(prevState => {
      if (prevState.marker) {
        prevState.marker.setImage(unselectedMarkerImage);
      }
      return data;
    });

    data.marker.setImage(selectedMarkerImage);
  }, []);

  const deleteAllMarkers = useCallback(() => {
    setCafeData(prevState => {
      prevState.forEach(data => {
        data.marker.setMap(null);
      });
      return [];
    });
  }, []);

  const showAllMarkers = useCallback(() => {
    if (!mapInstance || cafeData.length <= 0) {
      return;
    }

    cafeData.forEach(data => {
      const { marker } = data;
      kakao.maps.event.addListener(marker, "click", () => handleClickMarker(data));
      kakao.maps.event.addListener(mapInstance, "click", () => {
        marker.setImage(unselectedMarkerImage);
        setNowSelectingCafe({
          marker: null,
          info: null,
        });
        mapInstance && mapInstance.relayout();
      });
      marker.setMap(mapInstance);
    });
  }, [handleClickMarker, cafeData, mapInstance]);

  const moveToCurrentCoordinates = useCallback(() => {
    if (!mapInstance || !currentCoordinates) {
      return;
    }

    const lat = currentCoordinates.latitude;
    const lng = currentCoordinates.longitude;
    const nowLatLng = new kakao.maps.LatLng(lat, lng);
    mapInstance.setCenter(nowLatLng);

    // 마커 클릭 테스트용
    // 현위치를 기반으로 마커를 생성하기 위해 cafeData에 더미 데이터를 생성합니다.
    setCafeData(prevState => {
      const newCafeData = [...prevState];
      const currentLocationItem = {
        info: {
          id: 1,
          title: "현위치",
          location: "현위치 주소",
          distance: "0km",
          rating: 0,
          tags: [
            { name: "study", follow: 12, isSelected: false },
            { name: "concent", follow: 23, isSelected: false },
            { name: "mute", follow: 21, isSelected: false },
          ],
          latlng: nowLatLng,
          isSelected: false,
        },
        marker: createMarker("현위치", nowLatLng, unselectedMarkerImage),
      };
      newCafeData.push(currentLocationItem);

      return newCafeData;
    });
  }, [currentCoordinates, mapInstance, createMarker]);

  const getCurrentCoordinates = useCallback(() => {
    deleteAllMarkers();
    setNowSelectingCafe({
      marker: null,
      location: null,
    });
    fetch();
  }, [deleteAllMarkers, fetch]);

  const convertCardDataToCafeData = useCallback(() => {
    setCafeData(() => {
      const newCafeData = [];
      const cardData = [...toJS(CardStore.cardDatas)];
      cardData.forEach(item => {
        const { id, name, roadAddress, rating, tags, dist, location } = item;
        const longitude = location[0];
        const latitude = location[1];
        const nowLatLng = new kakao.maps.LatLng(latitude, longitude);
        const currentLocationItem = {
          info: {
            id,
            name,
            address: roadAddress,
            distance: dist,
            rating,
            tags,
            latlng: nowLatLng,
            isSelected: false,
          },
          marker: createMarker(name, nowLatLng, unselectedMarkerImage),
        };
        newCafeData.push(currentLocationItem);
      });

      return newCafeData;
    });
  }, [CardStore.cardDatas, createMarker]);

  const loadCafeData = useCallback(async () => {
    await CardStore.fetchCard();
  }, [CardStore]);

  const checkKakaoMapDragEnd = useCallback(() => {
    if (mapInstance && currentCoordinates) {
      kakao.maps.event.addListener(mapInstance, "dragend", () => {
        const latlng = mapInstance.getCenter();
        const centerLatitude = latlng.getLat();
        const centerLongitude = latlng.getLng();

        const currentLatitude = currentCoordinates.latitude;
        const currentLongitude = currentCoordinates.longitude;

        const latitudeDifference = Math.abs(currentLatitude - centerLatitude);
        const longitudeDifference = Math.abs(currentLongitude - centerLongitude);

        // 현위치와 지도의 중심이 0.0025만큼 차이가 있을 때
        // 현위치에서 지도의 중심이 멀어져서 현위치가 아니라고 한다.
        if (latitudeDifference > 0.0025 || longitudeDifference > 0.0025) {
          setIsOutOfCenter(false);
        } else {
          setIsOutOfCenter(true);
        }
      });
    }
  }, [mapInstance, currentCoordinates]);

  const handleCardLinkClick = useCallback(
    card => {
      history.push(`/detail/${card.id}`);
    },
    [history],
  );

  const handleLocationButtonClick = useCallback(() => {
    getCurrentCoordinates();
    loadCafeData();
  }, [getCurrentCoordinates, loadCafeData]);

  const setViewportHeight = useCallback(() => {
    document.body.style.height = `${window.innerHeight}px`;
    mapInstance && mapInstance.relayout();
  }, [mapInstance]);

  useEffect(() => {
    const kakaoMap = getKakaoMapObject();
    setMapInstance(kakaoMap);
  }, [getKakaoMapObject]);

  useEffect(() => {
    checkKakaoMapDragEnd();
  }, [checkKakaoMapDragEnd]);

  useEffect(() => {
    const debounced = debounce(setViewportHeight, 200);
    window.addEventListener("resize", debounced);

    return function cleanup() {
      debounced.cancel();
      window.removeEventListener("resize", debounced);
    };
  }, [mapInstance, setViewportHeight]);

  useEffect(() => {
    moveToCurrentCoordinates();
    setIsOutOfCenter(true);
  }, [moveToCurrentCoordinates, setIsOutOfCenter]);

  useEffect(() => {
    if (CardStore.cardDatas && CardStore.cardDatas.length <= 0) {
      loadCafeData();
    }
    convertCardDataToCafeData();
  }, [CardStore.cardDatas, convertCardDataToCafeData, loadCafeData]);

  useEffect(() => {
    showAllMarkers();
  }, [showAllMarkers]);

  useEffect(() => {
    setViewportHeight();
  }, [setViewportHeight]);

  return (
    <>
      <Map mapRef={mapRef} isSelected={!!(nowSelectingCafe.marker && nowSelectingCafe.info)}>
        <FloatingActionButton onClick={handleLocationButtonClick}>{!currentCoordinates || isFetching || !isOutOfCenter ? <LocationIcon /> : <LocationActiveIcon />}</FloatingActionButton>
      </Map>
      {nowSelectingCafe.marker && nowSelectingCafe.info && <Card showOnlyInfo={true} onCardLinkClick={() => handleCardLinkClick(nowSelectingCafe.info)} cardData={nowSelectingCafe.info} />}
    </>
  );
};

export default observer(MapContainer);
