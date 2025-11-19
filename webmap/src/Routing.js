import React, { useEffect, useState } from 'react';
import { Polyline, useMap, Popup } from 'react-leaflet';
import polyline from '@mapbox/polyline';

// Rout destination to destination
function Routing({ start, end }) {
  //OpenStreetMap
  const map = useMap();
  const [route, setRoute] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    if (!start || !end) {
      return; 
    }
    //  fetch geocoding data
    const geocode = async (query) => {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, Việt Nam&format=json&countrycodes=vn&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {

        return `${data[0].lon},${data[0].lat}`;
      }
      throw new Error(`Không tìm thấy ${query}`);
    };

    //uses the Open Source Routing Machine (OSRM) API
    const fetchRoute = async () => {
      try {
        setRoute(null); 
        const startCoords = await geocode(start);
        const endCoords = await geocode(end);

        // Try without excluding ferry first for better route coverage
        let response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startCoords};${endCoords}?overview=full&geometries=polyline&alternatives=true&steps=true`
        );
        
        let data = await response.json();
        
        // If no route found, it might be an OSRM issue - check the response
        if (!data.routes || data.routes.length === 0) {
          console.error("OSRM response:", data);
          throw new Error("Không tìm thấy tuyến đường. Vui lòng thử lại với các địa điểm khác.");
        }
        
        // Select the shortest route (first route is usually the fastest/shortest)
        const geometry = data.routes[0].geometry;
        const distanceInMeters = data.routes[0].distance;
        const durationInSeconds = data.routes[0].duration;
        
        const decodedRoute = polyline.decode(geometry); 

        setRoute(decodedRoute); 
        setDistance((distanceInMeters / 1000).toFixed(2)); // Convert to km
        setDuration((durationInSeconds / 3600).toFixed(2)); // Convert to hours

        map.fitBounds(decodedRoute);
      } catch (error) {
        console.error("Lỗi tìm đường:", error);
        alert(error.message);
      }
    };

    fetchRoute();

  }, [start, end, map]); 

  if (!route) return null;

  //display route
  return (
    <>
      <Polyline 
        positions={route} 
        color="blue" 
        weight={5} 
      >
        <Popup>
          <div>
            <b>Thông tin lộ trình:</b><br/>
            Khoảng cách: {distance} km<br/>
            Thời gian dự kiến: {duration} giờ
          </div>
        </Popup>
      </Polyline>
    </>
  );
}

export default Routing;