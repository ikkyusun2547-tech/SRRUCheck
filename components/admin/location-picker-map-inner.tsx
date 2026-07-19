"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet's default marker icon paths don't resolve after bundling — point
// them at the bundler-resolved asset URLs instead.
const defaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const SRRU_DEFAULT: [number, number] = [14.881, 103.493];

type LocationPickerMapProps = {
  lat: number | null;
  lng: number | null;
  radius: number | null;
  onChange: (lat: number, lng: number) => void;
};

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

export default function LocationPickerMapInner({ lat, lng, radius, onChange }: LocationPickerMapProps) {
  const position: [number, number] = lat != null && lng != null ? [lat, lng] : SRRU_DEFAULT;

  return (
    <MapContainer center={position} zoom={16} style={{ height: 320, width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onChange={onChange} />
      {lat != null && lng != null && (
        <>
          <Marker
            position={[lat, lng]}
            icon={defaultIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target as L.Marker;
                const pos = marker.getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          />
          {radius != null && radius > 0 && <Circle center={[lat, lng]} radius={radius} />}
          <RecenterOnChange lat={lat} lng={lng} />
        </>
      )}
    </MapContainer>
  );
}
