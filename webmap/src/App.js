import React, { useState, useCallback } from 'react';
import MapComponent from './MapComponent';
import Routing from './Routing'; // Chúng ta vẫn dùng Routing.js
import './App.css'; 

// Danh sách các từ khóa "chung chung"
// Nếu người dùng gõ 1 trong các từ này, ta sẽ tìm xung quanh vị trí của họ
const LOCAL_POI_KEYWORDS = [
  'cà phê', 'cafe', 'nhà hàng', 'restaurant', 'atm', 'cây xăng', 
  'hotel', 'khách sạn', 'pizza', 'phở', 'bún'
];

function App() {
  // State cho thanh tìm kiếm duy nhất
  const [mainQuery, setMainQuery] = useState('');
  
  // State cho vị trí của người dùng (lấy từ MapComponent)
  const [userLocation, setUserLocation] = useState(null); // { lat: ..., lng: ... }

  // State cho kết quả
  const [pois, setPois] = useState([]);
  const [route, setRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState([21.028511, 105.804817]); // Hà Nội
  const [error, setError] = useState(null);

  // Hàm này được gọi bởi UserLocationMarker bên trong MapComponent
  const handleLocationFound = useCallback((latlng) => {
    setUserLocation(latlng);
  }, []); // Thêm mảng phụ thuộc rỗng

  /**
   * HÀM TÌM KIẾM THÔNG MINH (BỘ PHÂN TÍCH)
   */
  const handleSearch = () => {
    const query = mainQuery.toLowerCase().trim();
    if (!query) return;

    // Xóa kết quả cũ
    setPois([]);
    setRoute(null);
    setError(null);

    // --- Ý ĐỊNH 1: TÌM ĐƯỜNG ---
    // Kiểm tra các từ khóa "đến", "to"
    const routeKeywords = [' đến ', ' to '];
    let routeKeywordFound = routeKeywords.find(k => query.includes(k));

    if (routeKeywordFound) {
      const parts = query.split(new RegExp(routeKeywordFound, 'i'));
      if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
        setRoute({ start: parts[0].trim(), end: parts[1].trim() });
        return; // Kết thúc
      }
    }

    // --- Ý ĐỊNH 2: TÌM POI LÂN CẬN (Dùng vị trí người dùng) ---
    if (LOCAL_POI_KEYWORDS.includes(query)) {
      if (!userLocation) {
        alert("Vui lòng cho phép truy cập vị trí để tìm POI lân cận.");
        setError('Vui lòng cho phép truy cập vị trí.');
        return;
      }
      // Dùng vị trí người dùng để tìm POI
      findPoisOverpass(query, userLocation.lat, userLocation.lng);
      return; // Kết thúc
    }

    // --- Ý ĐỊNH 3: TÌM ĐỊA ĐIỂM CỤ THỂ (Geocode) ---
    findPlaceNominatim(query);
  };

  /**
   * (Hàm con) Dùng Nominatim để tìm 1 địa điểm
   */
  const findPlaceNominatim = async (query) => {
    const API_URL = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=vn&limit=1&addressdetails=1`;
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data && data.length > 0) {
        const place = data[0];
        // Hiển thị 1 POI duy nhất
        setPois([
          {
            lat: place.lat,
            lon: place.lon,
            display_name: place.display_name,
            type: place.type
          }
        ]);
        setMapCenter([place.lat, place.lon]);
      } else {
        setError(`Không tìm thấy "${query}"`);
      }
    } catch (err) {
      setError('Lỗi khi tìm địa điểm.');
    }
  };

  /**
   * (Hàm con) Dùng Overpass để tìm POI lân cận
   */
  const findPoisOverpass = async (query, lat, lon) => {
    // Chuyển "cà phê" -> '["amenity"="cafe"]'
    let tag = `["name"~"${query}",i]`; // Mặc định tìm theo tên
    if (query === 'cà phê' || query === 'cafe') {
      tag = '["amenity"="cafe"]';
    } else if (query === 'nhà hàng' || query === 'restaurant') {
      tag = '["amenity"="restaurant"]';
    } else if (query === 'atm') {
      tag = '["amenity"="atm"]';
    }

    const RADIUS_M = 3000; // Tìm trong 3km
    const overpassQuery = `
      [out:json][timeout:60];
      ( nwr(around:${RADIUS_M},${lat},${lon})${tag}; );
      out center 20;
    `;
    
    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: 'POST', body: overpassQuery
      });
      const data = await response.json();
      if (data.elements && data.elements.length > 0) {
        const normalizedPois = data.elements.map(poi => ({
          id: poi.id,
          lat: poi.lat || (poi.center && poi.center.lat),
          lon: poi.lon || (poi.center && poi.center.lon),
          display_name: poi.tags?.name || `(${query} không tên)`,
          type: poi.tags?.amenity || query
        }));
        setPois(normalizedPois);
        setMapCenter([lat, lon]); // Zoom về vị trí người dùng
      } else {
        setError(`Không tìm thấy "${query}" nào gần bạn.`);
      }
    } catch (err) {
      setError('Lỗi khi tìm POI lân cận.');
    }
  };

  // --- GIAO DIỆN (ĐÃ THAY ĐỔI) ---
  return (
    <div className="App">
      <header className="App-header">
        
        {/* --- THANH TÌM KIẾM DUY NHẤT --- */}
        <div className="global-search-container">
          <input 
            type="text" 
            placeholder="Tìm địa điểm, POI, hoặc đường đi (ví dụ: Hà Nội đến Đà Nẵng)"
            value={mainQuery}
            onChange={(e) => setMainQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Tìm kiếm</button>
        </div>

        {error && <p className="error-message">{error}</p>}
      </header>
      
      <MapComponent 
        center={mapCenter} 
        pois={pois}
        onLocationFound={handleLocationFound} // Truyền callback xuống
      >
        {/* Component <Routing /> vẫn hoạt động như cũ */}
        {route && <Routing start={route.start} end={route.end} />}
      </MapComponent>
    </div>
  );
}

export default App;