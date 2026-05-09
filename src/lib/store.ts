// LocalStorage-backed mock store for the Suraksha hackathon prototype.
// Exposes a tiny pub/sub so React views re-render on changes.

export type Contact = { name: string; phone: string; relation: string };
export type SafeZone = { name: string; lat: number; lng: number; radius: number };
export type AlertStatus = "pending" | "acknowledged" | "ignored";
export type AlertKind =
  | "safety_check"
  | "deviation"
  | "unsafe_zone"
  | "near_danger"
  | "night_unsafe"
  | "sos"
  | "missed_call";

export type Alert = {
  id: string;
  clientId: string;
  kind: AlertKind;
  message: string;
  createdAt: number;
  status: AlertStatus;
  fromAdmin?: boolean;
};

export type EscalationStep = {
  at: number;
  level: "safety_check" | "contacts_notified" | "police_ngo" | "rescue_dispatched" | "resolved";
  note: string;
};

export type Incident = {
  id: string;
  clientId: string;
  startedAt: number;
  active: boolean;
  steps: EscalationStep[];
  trigger: AlertKind;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  age: number;
  address: string;
  contacts: Contact[];
  safeZones: SafeZone[];
  // dynamic
  lat: number;
  lng: number;
  safetyScore: number; // 0-100
  status: "safe" | "medium" | "emergency";
  lastSeen: number;
  inSafeZone: boolean;
  responsive: boolean; // last alert response state
};

export type Admin = { email: string; password: string; name: string };

type Session =
  | { role: "admin"; email: string }
  | { role: "client"; id: string }
  | null;

type State = {
  admins: Admin[];
  clients: Client[];
  alerts: Alert[];
  incidents: Incident[];
  session: Session;
};

const KEY = "suraksha_state_v1";

const DEFAULT_ADMIN: Admin = {
  email: "admin@suraksha.in",
  password: "admin123",
  name: "Suraksha Control",
};

// Hyderabad coords for demo
const seedClients = (): Client[] => [
  {
    id: "c1",
    name: "Ananya Sharma",
    email: "ananya@demo.in",
    password: "client123",
    phone: "+919876500001",
    age: 22,
    address: "Banjara Hills, Hyderabad",
    contacts: [
      { name: "Mom", phone: "+919876511111", relation: "Mother" },
      { name: "Brother", phone: "+919876522222", relation: "Brother" },
    ],
    safeZones: [
      { name: "Home", lat: 17.4156, lng: 78.4347, radius: 250 },
      { name: "College", lat: 17.4474, lng: 78.3568, radius: 300 },
    ],
    lat: 17.4156,
    lng: 78.4347,
    safetyScore: 92,
    status: "safe",
    lastSeen: Date.now(),
    inSafeZone: true,
    responsive: true,
  },
  {
    id: "c2",
    name: "Priya Reddy",
    email: "priya@demo.in",
    password: "client123",
    phone: "+919876500002",
    age: 28,
    address: "Madhapur, Hyderabad",
    contacts: [
      { name: "Husband", phone: "+919876533333", relation: "Spouse" },
    ],
    safeZones: [{ name: "Office", lat: 17.4485, lng: 78.3908, radius: 200 }],
    lat: 17.452,
    lng: 78.395,
    safetyScore: 68,
    status: "medium",
    lastSeen: Date.now(),
    inSafeZone: false,
    responsive: true,
  },
  {
    id: "c3",
    name: "Kavya Iyer",
    email: "kavya@demo.in",
    password: "client123",
    phone: "+919876500003",
    age: 19,
    address: "Secunderabad",
    contacts: [
      { name: "Dad", phone: "+919876544444", relation: "Father" },
      { name: "Friend", phone: "+919876555555", relation: "Friend" },
    ],
    safeZones: [{ name: "Hostel", lat: 17.4399, lng: 78.4983, radius: 200 }],
    lat: 17.435,
    lng: 78.51,
    safetyScore: 34,
    status: "emergency",
    lastSeen: Date.now() - 1000 * 60 * 3,
    inSafeZone: false,
    responsive: false,
  },
];

// Simulated danger zones (lat/lng/radius m + label)
export const DANGER_ZONES = [
  { name: "Reported unsafe alley", lat: 17.438, lng: 78.505, radius: 600 },
  { name: "Low-light industrial area", lat: 17.46, lng: 78.41, radius: 500 },
  { name: "Abandoned construction site", lat: 17.402, lng: 78.478, radius: 450 },
  { name: "High-crime market lane", lat: 17.385, lng: 78.486, radius: 550 },
  { name: "Isolated highway stretch", lat: 17.471, lng: 78.552, radius: 700 },
  { name: "Unlit park area", lat: 17.428, lng: 78.452, radius: 400 },
  { name: "Reported harassment hotspot", lat: 17.395, lng: 78.435, radius: 500 },
  { name: "Late-night liquor zone", lat: 17.448, lng: 78.498, radius: 450 },
];

// Suraksha emergency hotline — same number for all users, code identifies caller.
export const SURAKSHA_HOTLINE = "+91 80000-78725742";

// Deterministic 6-digit emergency code for a client (derived from id+phone).
export function emergencyCodeFor(clientId: string, phone: string): string {
  let h = 0;
  const s = clientId + "|" + phone;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return String(100000 + (h % 900000));
}

const initialState = (): State => ({
  admins: [DEFAULT_ADMIN],
  clients: seedClients(),
  alerts: [],
  incidents: [],
  session: null,
});

let state: State = load();
const listeners = new Set<() => void>();

// Per-tab origin id so we can ignore realtime echoes of our own writes.
const ORIGIN =
  typeof window !== "undefined"
    ? (window.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
    : "ssr";
const ROW_ID = "global";

function load(): State {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = initialState();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  } catch {
    return initialState();
  }
}

// Merge a remote snapshot. Preserve this tab's local session (auth is local).
function applyRemote(remote: State) {
  const localSession = state.session;
  state = { ...remote, session: localSession };
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((fn) => fn());
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;
let lastSeenUpdatedAt = "";

async function pushToCloud() {
  if (typeof window === "undefined") return;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    pushing = true;
    // Strip per-tab session before sharing globally.
    const { session: _omit, ...shared } = state;
    const updatedAt = new Date().toISOString();
    lastSeenUpdatedAt = updatedAt;
    await supabase
      .from("app_state")
      .upsert({ id: ROW_ID, data: shared as never, origin: ORIGIN, updated_at: updatedAt });
  } catch (e) {
    console.warn("[store] cloud push failed", e);
  } finally {
    pushing = false;
  }
}

// Polling fallback in case realtime websocket events don't arrive.
async function pollCloud() {
  if (typeof window === "undefined") return;
  if (pushing) return;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("app_state")
      .select("data, origin, updated_at")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (error || !data) return;
    const row = data as { data: State; origin: string | null; updated_at: string };
    if (!row.updated_at || row.updated_at === lastSeenUpdatedAt) return;
    lastSeenUpdatedAt = row.updated_at;
    if (row.origin === ORIGIN) return; // our own write
    applyRemote(row.data as State);
  } catch {
    // ignore polling errors
  }
}

function schedulePush() {
  if (typeof window === "undefined") return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(pushToCloud, 250);
}

function persist() {
  // bump state reference so selectors / memos see a change
  state = { ...state };
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((fn) => fn());
  schedulePush();
}

// One-time bootstrap: pull cloud state, then subscribe to realtime updates.
let bootstrapped = false;
async function bootstrapCloud() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("app_state")
      .select("data, updated_at")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (error) throw error;
    if (data?.data) {
      lastSeenUpdatedAt = (data as { updated_at?: string }).updated_at ?? "";
      applyRemote(data.data as unknown as State);
    } else {
      // First boot: seed cloud with our local state.
      await pushToCloud();
    }
    supabase
      .channel("app_state_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_state", filter: `id=eq.${ROW_ID}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { data?: State; origin?: string; updated_at?: string } | undefined;
          if (!row?.data) return;
          if (row.updated_at) lastSeenUpdatedAt = row.updated_at;
          if (row.origin === ORIGIN) return; // ignore self-echo
          if (pushing) return;
          applyRemote(row.data as State);
        },
      )
      .subscribe();
    // Polling fallback every 1.5s in case realtime events are dropped.
    setInterval(pollCloud, 1500);
    // Also poll when the tab regains focus for snappier sync.
    window.addEventListener("focus", pollCloud);
  } catch (e) {
    console.warn("[store] cloud bootstrap failed", e);
  }
}

if (typeof window !== "undefined") {
  // Defer to next tick so the supabase client lazy-import doesn't block module init.
  setTimeout(bootstrapCloud, 0);
}

export const store = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  reset() {
    state = initialState();
    persist();
  },
  // auth
  loginAdmin(email: string, password: string): boolean {
    const a = state.admins.find((x) => x.email === email && x.password === password);
    if (!a) return false;
    state.session = { role: "admin", email };
    persist();
    return true;
  },
  loginClient(email: string, password: string): boolean {
    const c = state.clients.find((x) => x.email === email && x.password === password);
    if (!c) return false;
    state.session = { role: "client", id: c.id };
    persist();
    return true;
  },
  logout() {
    state.session = null;
    persist();
  },
  registerClient(c: Omit<Client, "id" | "lat" | "lng" | "safetyScore" | "status" | "lastSeen" | "inSafeZone" | "responsive">): Client {
    const id = "c" + Math.random().toString(36).slice(2, 8);
    const first = c.safeZones[0];
    const newClient: Client = {
      ...c,
      id,
      lat: first?.lat ?? 17.4,
      lng: first?.lng ?? 78.45,
      safetyScore: 90,
      status: "safe",
      lastSeen: Date.now(),
      inSafeZone: true,
      responsive: true,
    };
    state.clients.push(newClient);
    state.session = { role: "client", id };
    persist();
    return newClient;
  },
  // mutations
  updateClient(id: string, patch: Partial<Client>) {
    const i = state.clients.findIndex((c) => c.id === id);
    if (i < 0) return;
    state.clients[i] = { ...state.clients[i], ...patch, lastSeen: Date.now() };
    persist();
  },
  addAlert(a: Omit<Alert, "id" | "createdAt" | "status">): Alert {
    const alert: Alert = {
      ...a,
      id: "a" + Math.random().toString(36).slice(2, 8),
      createdAt: Date.now(),
      status: "pending",
    };
    state.alerts.unshift(alert);
    persist();
    return alert;
  },
  setAlertStatus(id: string, status: AlertStatus) {
    const a = state.alerts.find((x) => x.id === id);
    if (a) {
      a.status = status;
      persist();
    }
  },
  startIncident(clientId: string, trigger: AlertKind, note: string): Incident {
    const inc: Incident = {
      id: "i" + Math.random().toString(36).slice(2, 8),
      clientId,
      startedAt: Date.now(),
      active: true,
      trigger,
      steps: [{ at: Date.now(), level: "safety_check", note }],
    };
    state.incidents.unshift(inc);
    persist();
    return inc;
  },
  addEscalation(incidentId: string, step: Omit<EscalationStep, "at">) {
    const inc = state.incidents.find((i) => i.id === incidentId);
    if (!inc) return;
    inc.steps.push({ ...step, at: Date.now() });
    if (step.level === "resolved") inc.active = false;
    persist();
  },
  activeIncidentFor(clientId: string) {
    return state.incidents.find((i) => i.clientId === clientId && i.active);
  },
};

// React hook — use selector with equality check to avoid infinite render loops
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (!Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
    return true;
  }
  return false;
}
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStoreWithSelector(
    (cb) => store.subscribe(cb),
    () => state,
    () => state,
    selector,
    shallowEqual,
  );
}
