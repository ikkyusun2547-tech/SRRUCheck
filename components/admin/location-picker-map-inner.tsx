"use client";

import { useEffect, useRef } from "react";
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

// Deliberately built on raw Leaflet instead of react-leaflet's <MapContainer>.
// react-leaflet's own mount effect doesn't reliably tear itself down before
// React 18 Strict Mode's mount→cleanup→mount double-invoke re-runs it in
// dev, so the second L.map() call lands on a container that still carries
// Leaflet's internal `_leaflet_id` marker and throws "Map container is
// already initialized". Managing the Leaflet instance ourselves with a ref
// guard (mapRef.current stays null until a real map exists, and is reset
// by our own cleanup) survives that double-invoke correctly, without
// having to disable Strict Mode for the rest of the app.
export default function LocationPickerMapInner({ lat, lng, radius, onChange }: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialPosition: [number, number] = lat != null && lng != null ? [lat, lng] : SRRU_DEFAULT;
    const map = L.map(containerRef.current).setView(initialPosition, 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", (e) => onChangeRef.current(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Only ever create the map once per real mount — lat/lng/radius updates
    // are synced into the existing instance by the effect below instead of
    // recreating it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lng == null) return;

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: defaultIcon, draggable: true })
        .addTo(map)
        .on("dragend", (e) => {
          const pos = (e.target as L.Marker).getLatLng();
          onChangeRef.current(pos.lat, pos.lng);
        });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    map.setView([lat, lng]);

    if (radius != null && radius > 0) {
      if (!circleRef.current) {
        circleRef.current = L.circle([lat, lng], { radius }).addTo(map);
      } else {
        circleRef.current.setLatLng([lat, lng]).setRadius(radius);
      }
    } else if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
  }, [lat, lng, radius]);

  return <div ref={containerRef} style={{ height: 320, width: "100%" }} />;
}
