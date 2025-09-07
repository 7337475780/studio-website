"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { useMap, useMapEvents } from "react-leaflet";
import { FaLocationCrosshairs } from "react-icons/fa6";

// Dynamically import only components (not hooks!)
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

interface MapPickerProps {
  location: { lat: number; lng: number };
  setLocation: (loc: { lat: number; lng: number }) => void;
}

const MapPicker = ({ location, setLocation }: MapPickerProps) => {
  const [leafletReady, setLeafletReady] = useState(false);
  const [markerPos, setMarkerPos] = useState(location);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { display: string; lat: number; lon: number }[]
  >([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Keep reference to map for animations
  const mapRef = useRef<any>(null);

  // Smooth marker animation
  const animateMarker = (target: { lat: number; lng: number }) => {
    const steps = 30; // how smooth
    const duration = 600; // ms
    const interval = duration / steps;

    let i = 0;
    const start = { ...markerPos };
    const timer = setInterval(() => {
      i++;
      const lat = start.lat + ((target.lat - start.lat) * i) / steps;
      const lng = start.lng + ((target.lng - start.lng) * i) / steps;
      setMarkerPos({ lat, lng });
      if (i >= steps) clearInterval(timer);
    }, interval);
  };

  // Update marker when parent location changes
  useEffect(() => {
    if (location.lat !== markerPos.lat || location.lng !== markerPos.lng) {
      animateMarker(location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Load leaflet icons once
  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/marker-icon-2x.png",
        iconUrl: "/marker-icon.png",
        shadowUrl: "/marker-shadow.png",
      });
      setLeafletReady(true);
    });
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(
          data.map((item: any) => ({
            display: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
          }))
        );
        setHighlightIndex(-1);
      } catch (err) {
        if (!(err instanceof DOMException)) {
          console.error("Suggestion fetch failed:", err);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  if (!leafletReady) return null;

  // Helper to move map with animation
  const flyToLocation = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 15, { duration: 1.5 });
    }
  };

  // Handle map click
  const MarkerUpdater = () => {
    const map = useMap();
    useMapEvents({
      click(e) {
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
        setLocation(coords);
        flyToLocation(coords.lat, coords.lng);
      },
    });
    return null;
  };

  // Handle "My Location"
  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(coords);
        flyToLocation(coords.lat, coords.lng);
      });
    } else {
      alert("Geolocation not supported in this browser.");
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (lat: number, lon: number) => {
    setLocation({ lat, lng: lon });
    setSearchQuery("");
    setSuggestions([]);
    flyToLocation(lat, lon);
  };

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[highlightIndex];
      handleSuggestionClick(selected.lat, selected.lon);
    }
  };

  return (
    <div className="relative w-full z-20">
      {/* Controls Overlay */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white text-gray-800 rounded-xl shadow-lg p-3 w-[75%] max-w-md flex flex-col gap-2">
        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <ul className="absolute mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-50 transition-all duration-200">
              {suggestions.map((s, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSuggestionClick(s.lat, s.lon)}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    idx === highlightIndex
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-blue-50"
                  }`}
                >
                  {s.display}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Current coords + my location */}
        <div className="flex justify-between z-30 items-center text-sm">
          <span className="text-gray-600 truncate">
            Lat: {markerPos.lat.toFixed(4)}, Lng: {markerPos.lng.toFixed(4)}
          </span>
          <button
            onClick={handleMyLocation}
            className="text-xl cursor-pointer hover:text-blue-600"
          >
            <FaLocationCrosshairs />
          </button>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={markerPos}
        zoom={13}
        whenReady={(event) => {
          mapRef.current = event.target;
        }}
        className="h-72 w-full  rounded-2xl shadow-lg border border-gray-200"
      >
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
              const coords = { lat: latlng.lat, lng: latlng.lng };
              setLocation(coords);
              flyToLocation(coords.lat, coords.lng);
            },
          }}
        />
        <MarkerUpdater />
      </MapContainer>
    </div>
  );
};

export default MapPicker;
