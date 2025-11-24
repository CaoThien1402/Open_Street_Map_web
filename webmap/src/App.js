import React, { useState, useCallback } from 'react';
import MapComponent from './MapComponent';
import Routing from './Routing';
import TranslationPopup from './TranslationPopup';
import './App.css'; 

// KEY API WEATHER
const OWM_API_KEY = "6522a2c7adbdafe697d81c73b019b453"; 

// items search
const LOCAL_POI_KEYWORDS = [
  'cà phê', 'cafe', 'nhà hàng', 'restaurant', 'atm', 'cây xăng', 
  'hotel', 'khách sạn', 'pizza', 'phở', 'bún'
];


function App() {
  const [mainQuery, setMainQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [pois, setPois] = useState([]);
  const [route, setRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState([21.028511, 105.804817]);
  const [error, setError] = useState(null);
  const [searchID, setSearchID] = useState(0);
  const [findMeTrigger, setFindMeTrigger] = useState(0);

  const handleLocationFound = useCallback((latlng) => {
    setUserLocation(latlng);
  }, []); 

  // handle search words
  const handleSearch = () => {
    setSearchID(id => id + 1); 
    const query = mainQuery.toLowerCase().trim();
    if (!query) return;
    setPois([]);
    setRoute(null);
    setError(null);

    const routeKeywords = [' đến ', ' to '];
    let routeKeywordFound = routeKeywords.find(k => query.includes(k));

    if (routeKeywordFound) {
      const parts = query.split(new RegExp(routeKeywordFound, 'i'));
      if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
        setRoute({ start: parts[0].trim(), end: parts[1].trim() });
        return; 
      }
    }

    // ask for use location
    if (LOCAL_POI_KEYWORDS.includes(query)) {
      if (!userLocation) {
        alert("Vui lòng cho phép truy cập vị trí để tìm POI lân cận.");
        setError('Vui lòng cho phép truy cập vị trí.');
        return;
      }
      findPoisOverpass(query, userLocation.lat, userLocation.lng);
      return; 
    }
    findPlaceNominatim(query);
  };

 const findPlaceNominatim = async (query) => {
    try {
      // API  nominatim
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=vn&limit=1&addressdetails=1`;
      const nominatimResponse = await fetch(nominatimUrl);
      const nominatimData = await nominatimResponse.json();
      
      if (!nominatimData || nominatimData.length === 0) {
        setError(`Không tìm thấy "${query}"`);
        return;
      }
      
      const place = nominatimData[0];
      const { lat, lon } = place;

      // Tìm 5 POI xung quanh địa điểm
      const RADIUS_M = 5000; // 5km radius
      const overpassQuery = `
        [out:json][timeout:60];
        (
          node(around:${RADIUS_M},${lat},${lon})["tourism"];
          node(around:${RADIUS_M},${lat},${lon})["amenity"~"restaurant|cafe|bank|hospital|school"];
          node(around:${RADIUS_M},${lat},${lon})["shop"];
        );
        out center 5;
      `;

      const overpassResponse = await fetch("https://overpass-api.de/api/interpreter", {
        method: 'POST',
        body: overpassQuery
      });
      const overpassData = await overpassResponse.json();

      //API WEATHER
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric`;
      const weatherResponse = await fetch(weatherUrl);
      const weatherData = await weatherResponse.json();

      //API FORECAST
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}&units=metric&cnt=8`;
      const forecastResponse = await fetch(forecastUrl);
      const forecastData = await forecastResponse.json();

      // Xử lý POIs
      let poisArray = [];
      if (overpassData.elements && overpassData.elements.length > 0) {
        poisArray = overpassData.elements.slice(0, 5).map(poi => ({
          id: poi.id,
          lat: poi.lat || (poi.center && poi.center.lat),
          lon: poi.lon || (poi.center && poi.center.lon),
          display_name: poi.tags?.name || poi.tags?.tourism || poi.tags?.amenity || poi.tags?.shop || "POI",
          type: poi.tags?.tourism || poi.tags?.amenity || poi.tags?.shop || "point of interest"
        }));
      }

      // Thêm địa điểm chính với thông tin thời tiết
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

      // update the application's state with the location and POI data
      setPois(poisArray);
      // update the map's center to the location's coordinates.
      setMapCenter([parseFloat(lat), parseFloat(lon)]);

    } catch (err) {
      setError('Lỗi khi tìm địa điểm hoặc POI.');
      console.error(err);
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
      const response = await fetch("https://overpass-api.de/api/interpreter", {
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
          <button onClick={handleSearch}>Tìm kiếm</button>
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