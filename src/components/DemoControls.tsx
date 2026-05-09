import { useState } from "react";
import { Play, RotateCcw, MapPin, Moon, AlertTriangle } from "lucide-react";
import { store, DANGER_ZONES } from "@/lib/store";

export function DemoControls({ clientId }: { clientId: string }) {
  const [running, setRunning] = useState(false);

  const moveTo = (lat: number, lng: number) => store.updateClient(clientId, { lat, lng });

  const simulateUnsafe = () => {
    const z = DANGER_ZONES[0];
    moveTo(z.lat, z.lng);
    store.addAlert({ clientId, kind: "near_danger", message: "🚨 Entered danger zone!" });
    if (!store.activeIncidentFor(clientId)) store.startIncident(clientId, "near_danger", "Auto-detected: client entered danger zone");
  };

  const simulateNoResponse = () => {
    store.updateClient(clientId, { responsive: false });
    store.addAlert({ clientId, kind: "safety_check", message: "Automated safety check — no response received." });
  };

  const runFullDemo = async () => {
    setRunning(true);
    moveTo(17.4156, 78.4347); // home
    await sleep(800);
    moveTo(17.43, 78.46); // walking
    await sleep(800);
    simulateUnsafe();
    await sleep(1500);
    simulateNoResponse();
    await sleep(1500);
    const inc = store.activeIncidentFor(clientId);
    if (inc) {
      store.addEscalation(inc.id, { level: "contacts_notified", note: "Auto-escalation: emergency contacts notified" });
      await sleep(1500);
      store.addEscalation(inc.id, { level: "police_ngo", note: "Auto-escalation: police & NGO alerted with live location" });
    }
    setRunning(false);
  };

  const reset = () => {
    if (confirm("Reset all demo data?")) {
      store.reset();
      location.href = "/";
    }
  };

  return (
    <div className="glass rounded-xl border-l-4 border-accent p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold"><Play className="h-4 w-4 text-accent" />Demo Mode</h3>
        <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"><RotateCcw className="h-3 w-3" />Reset</button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Simulate scenarios for the judges. Watch the safety score & admin dashboard react in real-time.</p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <button onClick={() => moveTo(17.4156, 78.4347)} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs hover:border-primary"><MapPin className="h-3.5 w-3.5" />Go Home</button>
        <button onClick={simulateUnsafe} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs hover:border-destructive"><AlertTriangle className="h-3.5 w-3.5" />Enter Danger</button>
        <button onClick={simulateNoResponse} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs hover:border-primary"><Moon className="h-3.5 w-3.5" />No Response</button>
        <button onClick={runFullDemo} disabled={running} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground glow-primary disabled:opacity-50">
          <Play className="h-3.5 w-3.5" />{running ? "Running…" : "Run Full Demo"}
        </button>
      </div>
    </div>
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
