"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const useMapEvents = dynamic(
  () => import("react-leaflet").then((mod) => mod.useMapEvents),
  { ssr: false }
);

interface MapPickerProps {
  location: { lat: number; lng: number };
  setLocation: (loc: { lat: number; lng: number }) => void;
}

const MapPicker = ({ location, setLocation }: MapPickerProps) => {
  const [leafletReady, setLeafletReady] = useState(false);
  const [markerPos, setMarkerPos] = useState(location);

  useEffect(() => {
    import("leaflet").then((L) => {
      // Fix for default marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/marker-icon-2x.png",
        iconUrl: "/marker-icon.png",
        shadowUrl: "/marker-shadow.png",
      });
      setLeafletReady(true);
    });
  }, []);

  if (!leafletReady) return null;

  const MarkerUpdater = () => {
    const map = useMapEvents({
      click(e) {
        setMarkerPos({ lat: e.latlng.lat, lng: e.latlng.lng });
        setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  };

  return (
    <MapContainer center={markerPos} zoom={13} className="h-64 w-full rounded">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <Marker
        position={markerPos}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const latlng = e.target.getLatLng();
            setMarkerPos({ lat: latlng.lat, lng: latlng.lng });
            setLocation({ lat: latlng.lat, lng: latlng.lng });
          },
        }}
      />
      <MarkerUpdater />
    </MapContainer>
  );
};

export default MapPicker;
