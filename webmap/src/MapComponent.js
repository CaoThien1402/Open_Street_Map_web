/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap, 
  useMapEvents,
  CircleMarker // Dùng chấm tròn xanh cho vị trí người dùng
} from 'react-leaflet';
import L from 'leaflet';

// --- COMPONENT MỚI: TỰ ĐỘNG ĐỊNH VỊ NGƯỜI DÙNG ---
function UserLocationMarker({ onLocationFound }) {
  const map = useMap();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    // Kích hoạt 'locate' của Leaflet
    map.locate({ setView: true, maxZoom: 15, watch: false })
       .on('locationfound', (e) => {
          setPosition(e.latlng);
          map.flyTo(e.latlng, 15); // Bay tới vị trí người dùng
          
          // Gửi vị trí này về cho App.js để dùng cho tìm kiếm POI
          onLocationFound(e.latlng); 
       })
       .on('locationerror', (e) => {
          console.error("Lỗi định vị:", e);
          alert("Không thể lấy vị trí của bạn. Tìm kiếm POI lân cận sẽ không hoạt động.");
       });
  }, [map, onLocationFound]);

  return position === null ? null : (
    <CircleMarker 
      center={position} 
      radius={8} 
      pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.5 }}
    >
      <Popup>Bạn ở đây</Popup>
    </CircleMarker>
  );
}

// Icon cafe (như cũ)
const cafeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/128/924/924514.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

// Component tìm POI khi click (như cũ)
function LocationFinder() {
  const [clickedPosition, setClickedPosition] = useState(null);
  const [address, setAddress] = useState('Đang tìm địa chỉ...');
  const [nearbyPOIs, setNearbyPOIs] = useState([]); 

  const map = useMapEvents({
    click(e) {
      // (Giữ nguyên toàn bộ logic của LocationFinder như cũ)
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

// Component di chuyển tâm bản đồ (như cũ)
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// --- COMPONENT MAP CHÍNH (ĐÃ CẬP NHẬT) ---
function MapComponent({ center, pois, children, onLocationFound }) {
  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="map-container">
      <ChangeView center={center} zoom={13} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Hiển thị POI từ thanh tìm kiếm */}
      {pois.map((poi, index) => (
        <Marker key={poi.id || index} position={[poi.lat, poi.lon]}>
          <Popup>
            <b>{poi.display_name}</b><br/>
            Loại: {poi.type}
          </Popup>
        </Marker>
      ))}

      {/* Tính năng click tìm cafe (như cũ) */}
      <LocationFinder />

      {/* TÍNH NĂNG MỚI: Định vị người dùng */}
      <UserLocationMarker onLocationFound={onLocationFound} />

      {/* Hiển thị đường đi (nếu có) */}
      {children}

    </MapContainer>
  );
}

export default MapComponent;