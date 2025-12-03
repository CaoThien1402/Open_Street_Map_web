import React, { useState, useCallback, useEffect } from 'react';
import MapComponent from './MapComponent';
import Routing from './Routing';
import TranslationPopup from './TranslationPopup';
import AuthForm from './AuthForm'; 
import SearchHistory from './SearchHistory'; 
import { auth, db} from './firebase'; 
import { onAuthStateChanged, signOut} from 'firebase/auth'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './App.css';

// KEY API WEATHER
const OWM_API_KEY = "6522a2c7adbdafe697d81c73b019b453"; 

// items search
const LOCAL_POI_KEYWORDS = [
  'cà phê', 'cafe', 'nhà hàng', 'restaurant', 'atm', 'cây xăng', 
  'hotel', 'khách sạn', 'pizza', 'phở', 'bún'
];


function App() {
  // trạng thái tải
  const [isLoading, setIsLoading] = useState(false); 
  // quản lý trạng thái đăng nhập
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [mainQuery, setMainQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [pois, setPois] = useState([]);
  const [route, setRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState([21.028511, 105.804817]);
  const [error, setError] = useState(null);
  const [searchID, setSearchID] = useState(0);
  const [findMeTrigger, setFindMeTrigger] = useState(0);

  // --- EFFECT KIỂM TRA ĐĂNG NHẬP ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // --- HÀM ĐĂNG XUẤT ---
  const handleLogout = async () => {
    await signOut(auth);
    setPois([]); // Xóa dữ liệu cũ khi đăng xuất
    setRoute(null);
  };
  
  const handleLocationFound = useCallback((latlng) => { setUserLocation(latlng); }, []);

  // --- HÀM LƯU LỊCH SỬ VÀO FIREBASE ---
  const saveToHistory = async (text, type = 'place') => {
    if (!user || !text) return; // Chỉ lưu nếu đã đăng nhập

    try {
      await addDoc(collection(db, "searchHistory"), {
        uid: user.uid,        // Của ai?
        text: text,           // Tìm gì?
        type: type,           // Loại tìm kiếm (place/route)
        timestamp: serverTimestamp() // Thời gian server
      });
    } catch (e) {
      console.error("Lỗi lưu lịch sử:", e);
    }
  };

  // --- HÀM XỬ LÝ KHI CHỌN TỪ LỊCH SỬ ---
  const handleHistorySelect = (text) => {
    setMainQuery(text); // Điền vào ô input
    // Vì state cập nhật bất đồng bộ, ta gọi tìm kiếm thủ công một chút
    // Nhưng cách tốt nhất là dùng useEffect hoặc gọi trực tiếp logic tìm kiếm với tham số 'text'
    // Ở đây ta setMainQuery và gọi handleSearch ngay sau đó sẽ bị cũ state.
    // Cách sửa nhanh: Tách logic tìm kiếm ra hoặc gọi đệ quy.
    
    // Tạm thời ta setQuery rồi gọi logic tìm kiếm với text truyền vào
    handleSearch(text); 
  };

  // handle search words
  const handleSearch = (manualQuery = null) => {
    // Nếu có manualQuery (từ lịch sử) thì dùng, không thì dùng mainQuery từ input
    const queryRaw = typeof manualQuery === 'string' ? manualQuery : mainQuery;
    const query = queryRaw.toLowerCase().trim();

    if (!query) return;

    setSearchID(id => id + 1); 
    setPois([]);
    setRoute(null);
    setError(null);
    
    // Nếu dùng query từ input, cập nhật lại state input cho khớp
    if (typeof manualQuery === 'string') setMainQuery(manualQuery);

    // --- LOGIC TÌM ĐƯỜNG ---
    const routeKeywords = [' đến ', ' to '];
    let routeKeywordFound = routeKeywords.find(k => query.includes(k));

    if (routeKeywordFound) {
      const parts = query.split(new RegExp(routeKeywordFound, 'i'));
      if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
        const start = parts[0].trim();
        const end = parts[1].trim();
        setRoute({ start, end });
        
        // --> LƯU LỊCH SỬ TÌM ĐƯỜNG
        saveToHistory(`${start} đến ${end}`, 'route');
        return; 
      }
    }

    // --- LOGIC TÌM POI ---
    if (LOCAL_POI_KEYWORDS.includes(query)) {
      if (!userLocation) {
        alert("Vui lòng cho phép truy cập vị trí.");
        return;
      }
      findPoisOverpass(query, userLocation.lat, userLocation.lng);
      
      // --> LƯU LỊCH SỬ TÌM POI
      saveToHistory(query, 'poi');
      return; 
    }

    // --- LOGIC TÌM ĐỊA ĐIỂM ---
    findPlaceNominatim(query);
    // --> LƯU LỊCH SỬ TÌM ĐỊA ĐIỂM
    saveToHistory(query, 'place');
  };

 const findPlaceNominatim = async (query) => {
    setIsLoading(true); // Bắt đầu tải -> Hiện loading
    setError(null);

    try {
      // BƯỚC 1: LẤY TỌA ĐỘ (Bắt buộc phải xong trước)
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=vn&limit=1&addressdetails=1`;
      const nominatimResponse = await fetch(nominatimUrl);
      const nominatimData = await nominatimResponse.json();
      
      if (!nominatimData || nominatimData.length === 0) {
        setError(`Không tìm thấy "${query}"`);
        setIsLoading(false);
        return;
      }
      
      const place = nominatimData[0];
      const { lat, lon } = place;

      // BƯỚC 2: CHUẨN BỊ 3 YÊU CẦU API (Nhưng chưa chờ kết quả ngay)
      
      // 2.1. Overpass (Tìm POI)
      const RADIUS_M = 3000; // Giảm bán kính xuống 3km cho nhanh hơn (5km hơi nặng)
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node(around:${RADIUS_M},${lat},${lon})["tourism"];
          node(around:${RADIUS_M},${lat},${lon})["amenity"~"restaurant|cafe|bank|hospital"];
        );
        out center 10;
      `; // Giới hạn loại tìm kiếm cho nhẹ bớt
      
      const overpassPromise = fetch("https://overpass.kumi.systems/api/interpreter", {
        method: 'POST',
        body: overpassQuery
      }).then(res => res.json());

      // 2.2. Weather (Hiện tại)
      const weatherPromise = fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric`
      ).then(res => res.json());

      // 2.3. Forecast (Dự báo)
      const forecastPromise = fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric&cnt=8`
      ).then(res => res.json());


      // BƯỚC 3: BẮN CẢ 3 CÙNG LÚC VÀ CHỜ TẤT CẢ VỀ ĐÍCH
      // Đây là phép thuật giúp tăng tốc độ!
      const [overpassData, weatherData, forecastData] = await Promise.all([
        overpassPromise, 
        weatherPromise, 
        forecastPromise
      ]);


      // BƯỚC 4: XỬ LÝ DỮ LIỆU (Như cũ)
      let poisArray = [];
      if (overpassData.elements && overpassData.elements.length > 0) {
        poisArray = overpassData.elements.slice(0, 5).map(poi => ({
          id: poi.id,
          lat: poi.lat || (poi.center && poi.center.lat),
          lon: poi.lon || (poi.center && poi.center.lon),
          display_name: poi.tags?.name || poi.tags?.amenity || "POI",
          type: poi.tags?.amenity || "Điểm đến"
        }));
      }

      poisArray.unshift({
        id: place.osm_id,
        lat: place.lat,
        lon: place.lon,
        display_name: place.display_name,
        type: place.type,
        weather: {
          current: { 
            temperature: weatherData.main.temp,
            windspeed: weatherData.wind.speed,
            humidity: weatherData.main.humidity,
            description: weatherData.weather[0].description
          },
          forecast: forecastData.list 
        }
      });

      setPois(poisArray);
      setMapCenter([parseFloat(lat), parseFloat(lon)]);

    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsLoading(false); // Kết thúc tải -> Tắt loading
    }
  };

  // find 5 poi near current location
  const findPoisOverpass = async (query, lat, lon) => {
    let tag = `["name"~"${query}",i]`;
    if (query === 'cà phê' || query === 'cafe') tag = '["amenity"="cafe"]';
    else if (query === 'nhà hàng' || query === 'restaurant') tag = '["amenity"="restaurant"]';
    else if (query === 'atm') tag = '["amenity"="atm"]';

    const RADIUS_M = 1000;
    const overpassQuery = `
      [out:json][timeout:60];
      ( nwr(around:${RADIUS_M},${lat},${lon})${tag}; );
      out center 5;
    `;
    
    try {
      //  API overpass
      const response = await fetch("https://overpass.kumi.systems/api/interpreter", {
        method: 'POST', body: overpassQuery
      });
      const data = await response.json();

      //setPOI - limit to 5
      if (data.elements && data.elements.length > 0) {
        const normalizedPois = data.elements.slice(0, 5).map(poi => ({
          id: poi.id,
          lat: poi.lat || (poi.center && poi.center.lat),
          lon: poi.lon || (poi.center && poi.center.lon),
          display_name: poi.tags?.name || `(${query} không tên)`,
          type: poi.tags?.amenity || query
        }));
        setPois(normalizedPois);
        setMapCenter([lat, lon]); 
      } else {
        setError(`Không tìm thấy "${query}" nào gần bạn.`);
      }
    } catch (err) {
      setError('Lỗi khi tìm POI lân cận.');
    }
  };

  const handleFindMe = () => {
    setFindMeTrigger(t => t + 1);
  };

  // 1. Màn hình chờ khi đang tải Firebase
  if (loadingAuth) return <div>Đang tải...</div>;

  // 2. Nếu CHƯA đăng nhập -> Hiện Form Auth
  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="App">
      <header className="App-header">
        
        <div className="global-search-container">
          <button onClick={handleFindMe} className="find-me-btn">
            🎯
          </button>
          {/* INPUT */}
          <input 
            type="text" 
            placeholder="Tìm địa điểm, POI, hoặc đường đi (ví dụ: Hà Nội đến Đà Nẵng)"
            value={mainQuery}
            onChange={(e) => setMainQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />

          <button 
            onClick={handleSearch} 
            disabled={isLoading} // Khóa nút khi đang tải
            style={{ 
              backgroundColor: isLoading ? '#ccc' : '#0078d4',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>

          <SearchHistory user={user} onSelectHistory={handleHistorySelect} />

        </div>

        {/* NÚT ĐĂNG XUẤT */}
        <div className="user-profile-container">
             {/* 1. Avatar bên trái */}
             <div className="user-avatar">
               {user.email.charAt(0).toUpperCase()}
             </div>
             
             {/* 2. Cột bên phải: Chứa Tên và Nút */}
             <div className="user-details">
               {/* Tên ở trên */}
               <span className="user-name">
                 {user.email.split('@')[0]}
               </span>

               {/* Nút đăng xuất ở dưới */}
               <button onClick={handleLogout} className="logout-btn-small">
                 Đăng xuất
               </button>
             </div>
          </div>

        {error && <p className="error-message">{error}</p>}
      </header>
      
      <MapComponent 
        center={mapCenter} 
        pois={pois}
        onLocationFound={handleLocationFound}
        searchID={searchID} 
        findMeTrigger={findMeTrigger} 
      >
        {route && <Routing start={route.start} end={route.end} />}
      </MapComponent>

      <TranslationPopup />

      
    </div>
  );
}

export default App;