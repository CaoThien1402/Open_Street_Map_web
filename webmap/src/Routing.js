import React, { useEffect, useState } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import polyline from '@mapbox/polyline';

// Rout destination to destination
function Routing({ start, end }) {
  //OpenStreetMap
  const map = useMap();
  const [route, setRoute] = useState(null);

  useEffect(() => {
    if (!start || !end) {
      return; 
    }
    //  fetch geocoding data
    const geocode = async (query) => {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=vn&limit=1`);
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

        //optional waypoint
        const waypointCoords = await geocode("Đà Nẵng, Việt Nam");

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startCoords};${waypointCoords};${endCoords}?overview=full&geometries=polyline`
        );
        
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const geometry = data.routes[0].geometry;
          
          const decodedRoute = polyline.decode(geometry); 

          setRoute(decodedRoute); 

          map.fitBounds(decodedRoute);
        } else {
          throw new Error("Không tìm thấy tuyến đường.");
        }
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
    <Polyline 
      positions={route} 
      color="blue" 
      weight={5} 
    />
  );
}

export default Routing;