import React, { useEffect, useState, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap, 
  useMapEvents,
  CircleMarker,
  Circle 
} from 'react-leaflet';
import L from 'leaflet';

// --- COMPONENT CON 1: ĐỊNH VỊ ---
function UserLocationMarker({ onLocationFound, findMeTrigger }) {
  const map = useMap();
  const [position, setPosition] = useState(null); 
  const [accuracy, setAccuracy] = useState(null); 

  const firstLocationRef = useRef(true);
  const latestPositionRef = useRef(null);

  //Bắt đầu "theo dõi" vị trí
  useEffect(() => {
    map.locate({ 
      watch: true,
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 30000 
    })
    .on('locationfound', (e) => {
      setPosition(e.latlng);
      setAccuracy(e.accuracy);
      latestPositionRef.current = e.latlng;

      if (firstLocationRef.current) {
        firstLocationRef.current = false;
        
        map.setView(e.latlng, 15); 
        
        onLocationFound(e.latlng); 
      }
    })
    .on('locationerror', (e) => {
      console.error("Lỗi định vị:", e);
    });

    return () => {
      map.stopLocate();
    };
    
  }, [map, onLocationFound]);

  // Effect 2: Xử lý khi nhấn nút 
  useEffect(() => {
    if (findMeTrigger > 0) {
      if (latestPositionRef.current) {
        map.setView(latestPositionRef.current, 15);
        onLocationFound(latestPositionRef.current);
      }
    }
  }, [findMeTrigger, map, onLocationFound]);

  if (!position) {
    return null; 
  }
  const radius = accuracy / 2;

  // show circlemarker with hiden text show current point
  return (
    <>
      <CircleMarker 
        center={position} 
        radius={8} 
        pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.8, weight: 2 }}
      >
        <Popup>Bạn ở đây (chính xác ~{Math.round(accuracy)}m)</Popup>
      </CircleMarker>
      <Circle
        center={position}
        radius={radius}
        pathOptions={{ color: '#136AEC', fillColor: '#136AEC', fillOpacity: 0.15, weight: 1 }}
      />
    </>
  );
}

// Icon cafe 
const cafeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/924/924514.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

// --- COMPONENT 2: FIND POI WHEN CLICK SOMEWHERE ---
function LocationFinder({ searchID }) {
  const [clickedPosition, setClickedPosition] = useState(null);
  const [address, setAddress] = useState('Đang tìm địa chỉ...');
  const [nearbyPOIs, setNearbyPOIs] = useState([]); 

  useEffect(() => {
    setClickedPosition(null);
    setNearbyPOIs([]);
  }, [searchID]); 

  const map = useMapEvents({
    click(e) {
      map.setView(e.latlng, map.getZoom()); 
      
      const { lat, lng } = e.latlng;
      setClickedPosition(e.latlng);
      setNearbyPOIs([]); 
      setAddress('Đang tìm địa chỉ...');
      
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18`)
        .then((res) => res.json())
        .then((data) => setAddress(data.display_name || 'Không tìm thấy địa chỉ.'))
        .catch(() => setAddress('Lỗi khi tìm địa chỉ.'));
      
      const RADIUS_M = 1000;
      const overpassQuery = `
        [out:json][timeout:60];
        nwr(around:${RADIUS_M},${lat},${lng})["amenity"="cafe"];
        out center 20;
      `;
      fetch("https://overpass-api.de/api/interpreter", { method: 'POST', body: overpassQuery })
        .then((res) => res.json())
        .then((data) => {
          if (data.elements) setNearbyPOIs(data.elements);
        })
        .catch((err) => console.error("Lỗi Overpass:", err));
    },
  });

  return (
    <>
      {clickedPosition && (
        <Popup position={clickedPosition}>
          <b>Địa chỉ:</b><br />
          {address}
        </Popup>
      )}
      {nearbyPOIs.map((poi) => {
        const lat = poi.lat || (poi.center && poi.center.lat);
        const lon = poi.lon || (poi.center && poi.center.lon);
        if (!lat || !lon) return null;
        const name = poi.tags?.name || "(Không có tên)";
        return (
          <Marker key={poi.id} position={[lat, lon]} icon={cafeIcon}>
            <Popup><b>{name}</b><br />Loại: Quán cafe</Popup>
          </Marker>
        );
      })}
    </>
  );
}

//update the view of a map
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom); 
    
  }, [center, zoom, map]);
  return null;
}

//resize map
function MapResizer({ pois, children }) {
  const map = useMap();
  useEffect(() => {

    setTimeout(() => {
      map.invalidateSize();
    }, 100); 
  }, [pois, children, map]); 
  return null;
}

// main of map
function MapComponent({ center, pois, children, onLocationFound, searchID, findMeTrigger }) { 
  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="map-container">
      
      <ChangeView center={center} zoom={13} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {pois.map((poi, index) => (
        <Marker key={poi.id || index} position={[poi.lat, poi.lon]}>
          <Popup>
            <b>{poi.display_name}</b>
            <br/>
            Loại: {poi.type}
          </Popup>
        </Marker>
      ))}

      <LocationFinder searchID={searchID} /> 
      <UserLocationMarker 
        onLocationFound={onLocationFound} 
        findMeTrigger={findMeTrigger} 
      />

      {children}
      
      <MapResizer pois={pois} children={children} />

      <WeatherDisplay pois={pois} />

    </MapContainer>
  );
}

export default MapComponent;

// WEATHER 
function WeatherDisplay({ pois }) {
  // ONLY 1 POI WILL SHOW THIS (Ex: Ho Chi Minh, Da Nang)
  if (!pois || pois.length === 0) {
    return null; 
  }

  // Tìm POI có thông tin thời tiết
  const weatherPoi = pois.find(poi => poi.weather);
  if (!weatherPoi) {
    return null;
  }

  const { weather, display_name } = weatherPoi;

  // Cắt bớt tên địa điểm cho gọn, lấy phần trước dấu phẩy đầu tiên
  const locationName = display_name.split(',')[0]; 

  return (
    <div className="weather-overlay">
      <h4>Thời tiết tại {locationName}</h4>
      
      {/* 1. Thời tiết hiện tại */}
      {weather.current && (
        <div style={{ marginBottom: '10px' }}>
          <b>Hiện tại:</b><br/>
          Nhiệt độ: {weather.current.temperature} °C<br/>
          Mô tả: {weather.current.description}
        </div>
      )}

      {/* 2. Dự báo */}
      {weather.forecast && (
        <div>
          <b>Dự báo (9 giờ tới):</b><br/>
          {/* Lặp qua mảng dự báo và chỉ lấy 3 mốc đầu tiên */}
          {weather.forecast.slice(0, 3).map((item) => (
            <div key={item.dt} className="forecast-item">
              {/* Định dạng lại giờ cho gọn */}
              <i>{new Date(item.dt * 1000).getHours()}:00:</i> {item.main.temp} °C, {item.weather[0].description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}