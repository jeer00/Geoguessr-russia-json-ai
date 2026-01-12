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

function HeatmapLayer({ points }: { points: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const heatData = points.map(p => {
      const coords = p.pos.match(/-?\d+\.\d+/g);
      return [parseFloat(coords[1]), parseFloat(coords[0]), 0.5];
    });
    const heatLayer = (L as any).heatLayer(heatData, { radius: 20, blur: 15 }).addTo(map);
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
      <HeatmapLayer points={points} />
      {points.map((p, i) => {
        const coords = p.pos.match(/-?\d+\.\d+/g);
        const lat = parseFloat(coords[1]);
        const lon = parseFloat(coords[0]);
        return (
          <Marker 
            key={i} 
            position={[lat, lon]} 
            icon={DefaultIcon}
            eventHandlers={{ click: () => onPointClick(lat, lon) }}
          />
        );
      })}
    </MapContainer>
  );
}