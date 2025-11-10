import React, { useEffect, useState } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import polyline from '@mapbox/polyline'; // Thư viện vừa cài

function Routing({ start, end }) {
  const map = useMap();
  const [route, setRoute] = useState(null); // Lưu trữ các tọa độ đường đi

  useEffect(() => {
    if (!start || !end) {
      return; // Không làm gì nếu chưa có đủ 2 điểm
    }

    // Hàm gọi API Nominatim
    const geocode = async (query) => {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=vn&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        // OSRM dùng (lon, lat)
        return `${data[0].lon},${data[0].lat}`;
      }
      throw new Error(`Không tìm thấy ${query}`);
    };

    // Hàm gọi API OSRM (giống code Python của bạn)
    const fetchRoute = async () => {
      try {
        setRoute(null); // Xóa đường cũ
        const startCoords = await geocode(start);
        const endCoords = await geocode(end);

        // --- THAY ĐỔI LỚN Ở ĐÂY ---
        // 1. Thêm một điểm tham chiếu (waypoint) ở giữa Việt Nam
        const waypointCoords = await geocode("Đà Nẵng, Việt Nam");

        // 2. Thêm điểm tham chiếu vào giữa API call
        // Định dạng là: start;waypoint1;waypoint2;...;end
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startCoords};${waypointCoords};${endCoords}?overview=full&geometries=polyline`
        );
        // --- KẾT THÚC THAY ĐỔI ---
        
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const geometry = data.routes[0].geometry;
          
          // Giải mã 'geometry' bằng thư viện @mapbox/polyline
          const decodedRoute = polyline.decode(geometry); 

          setRoute(decodedRoute); // Lưu tuyến đường
          
          // Tự động zoom bản đồ để thấy toàn bộ tuyến đường
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

  }, [start, end, map]); // Chạy lại khi start, end hoặc map thay đổi

  // Nếu không có tuyến đường, không hiển thị gì
  if (!route) return null;

  // Vẽ Polyline lên bản đồ
  return (
    <Polyline 
      positions={route} 
      color="blue" 
      weight={5} 
    />
  );
}

export default Routing;