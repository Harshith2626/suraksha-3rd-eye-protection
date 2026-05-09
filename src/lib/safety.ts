import { DANGER_ZONES, store, type Client } from "./store";

const R = 6371000;
export function distMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isNightTime(d = new Date()) {
  const h = d.getHours();
  return h >= 21 || h < 5;
}

export function nearestDanger(lat: number, lng: number) {
  let best: { name: string; d: number } | null = null;
  for (const z of DANGER_ZONES) {
    const d = distMeters({ lat, lng }, z);
    if (!best || d < best.d) best = { name: z.name, d };
  }
  return best!;
}

export function inAnySafeZone(c: Client) {
  return c.safeZones.some((z) => distMeters(c, z) <= z.radius);
}

export function inAnyDanger(lat: number, lng: number) {
  return DANGER_ZONES.find((z) => distMeters({ lat, lng }, z) <= z.radius) ?? null;
}

export function computeSafety(c: Client): { score: number; status: Client["status"]; reasons: string[] } {
  let score = 100;
  const reasons: string[] = [];
  const safe = inAnySafeZone(c);
  const danger = inAnyDanger(c.lat, c.lng);
  const nd = nearestDanger(c.lat, c.lng);
  const night = isNightTime();

  if (danger) {
    score -= 55;
    reasons.push(`Inside danger zone: ${danger.name}`);
  } else if (nd.d < 800) {
    score -= 25;
    reasons.push(`Near danger area (${Math.round(nd.d)}m)`);
  }
  if (!safe) {
    score -= 10;
    reasons.push("Outside registered safe zones");
  } else {
    reasons.push("Inside a safe zone");
  }
  if (night && !safe) {
    score -= 20;
    reasons.push("Outside safe zone at night");
  }
  if (!c.responsive) {
    score -= 25;
    reasons.push("Not responding to safety check");
  }

  score = Math.max(0, Math.min(100, score));
  const status: Client["status"] =
    score >= 75 ? "safe" : score >= 45 ? "medium" : "emergency";
  return { score, status, reasons };
}

export function recomputeAll() {
  for (const c of store.get().clients) {
    const { score, status } = computeSafety(c);
    const inSafe = inAnySafeZone(c);
    if (c.safetyScore === score && c.status === status && c.inSafeZone === inSafe) continue;
    store.updateClient(c.id, { safetyScore: score, status, inSafeZone: inSafe });
  }
}
