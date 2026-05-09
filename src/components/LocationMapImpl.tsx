import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import { DANGER_ZONES, type Client } from "@/lib/store";

// Fix default icon
const icon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 0 12px ${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const colorFor = (s: Client["status"]) =>
  s === "safe" ? "#22c55e" : s === "medium" ? "#eab308" : "#ef4444";

export function LocationMap({
  clients,
  height = 400,
  focus,
}: {
  clients: Client[];
  height?: number;
  focus?: { lat: number; lng: number };
}) {
  const center = focus ?? (clients[0] ? { lat: clients[0].lat, lng: clients[0].lng } : { lat: 17.42, lng: 78.45 });
  return (
    <div style={{ height }} className="overflow-hidden rounded-xl border border-border">
      <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {DANGER_ZONES.map((z) => (
          <Circle
            key={z.name}
            center={[z.lat, z.lng]}
            radius={z.radius}
            pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.18 }}
          >
            <Popup>Danger: {z.name}</Popup>
          </Circle>
        ))}
        {clients.flatMap((c) =>
          c.safeZones.map((z) => (
            <Circle
              key={c.id + z.name}
              center={[z.lat, z.lng]}
              radius={z.radius}
              pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.12 }}
            >
              <Popup>Safe zone: {z.name}</Popup>
            </Circle>
          )),
        )}
        {clients.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={icon(colorFor(c.status))}>
            <Popup>
              <strong>{c.name}</strong>
              <br />
              Safety: {c.safetyScore}% ({c.status})
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
