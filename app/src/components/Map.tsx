import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import 'leaflet.heat';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function MapRecenter({ points }: { points: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const firstPoint = points[0].pos.coordinates;
      map.setView([firstPoint[1], firstPoint[0]], 5, { animate: true });
    }
  }, [points, map]);
  return null;
}

function HeatmapLayer({ points }: { points: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    
    const heatData = points.map(p => [
      p.pos.coordinates[1], // lat
      p.pos.coordinates[0], // long
      p.similarity || 0.5  
    ]);

    const heatLayer = (L as any).heatLayer(heatData, { radius: 25, blur: 15 }).addTo(map);
    return () => { map.removeLayer(heatLayer); };
  }, [points, map]);
  return null;
}

export default function Map({ points, onPointClick }: { points: any[], onPointClick: (lat: number, lon: number) => void }) {
  return (
    <MapContainer 
      center={[55, 10]} 
      zoom={4} 
      style={{ height: '100%', width: '100%' }}
      dragging={true}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <MapRecenter points={points} />
      
      <HeatmapLayer points={points} />

      {points.map((p, i) => {
        // GeoJSON: [lon, lat]
        const lon = p.pos.coordinates[0];
        const lat = p.pos.coordinates[1];
        
        return (
          <Marker 
            key={`${i}-${lat}-${lon}`} 
            position={[lat, lon]} 
            icon={DefaultIcon}
            eventHandlers={{ click: () => onPointClick(lat, lon) }}
          />
        );
      })}
    </MapContainer>
  );
}