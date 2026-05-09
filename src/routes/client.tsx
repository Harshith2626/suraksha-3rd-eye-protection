import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, LogOut, PhoneCall, Bell, MapPin, Sparkles, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { store, useStore } from "@/lib/store";
import { computeSafety, recomputeAll } from "@/lib/safety";
import { SafetyMeter, StatusBadge } from "@/components/SafetyMeter";
import { LocationMap } from "@/components/LocationMap";
import { ClientOnly } from "@/components/ClientOnly";
import { DemoControls } from "@/components/DemoControls";

export const Route = createFileRoute("/client")({ component: ClientDash });

function ClientDash() {
  const nav = useNavigate();
  const session = useStore((s) => s.session);
  const client = useStore((s) => {
    if (!s.session || s.session.role !== "client") return undefined;
    const sid = s.session.id;
    return s.clients.find((c) => c.id === sid);
  });
  const alerts = useStore((s) => (client ? s.alerts.filter((a) => a.clientId === client.id) : []));

  useEffect(() => {
    if (!session || session.role !== "client") nav({ to: "/login", search: { role: "client" } });
  }, [session, nav]);

  useEffect(() => {
    const t = setInterval(() => recomputeAll(), 2000);
    return () => clearInterval(t);
  }, []);

  if (!client) return null;
  const safety = computeSafety(client);

  const sos = () => {
    store.updateClient(client.id, { responsive: false });
    store.addAlert({ clientId: client.id, kind: "sos", message: "🆘 SOS triggered by user!" });
    store.startIncident(client.id, "sos", "User pressed SOS");
  };

  const missedCall = () => {
    store.addAlert({ clientId: client.id, kind: "missed_call", message: `📞 Missed-call SOS from ${client.phone}` });
    store.startIncident(client.id, "missed_call", "Missed-call SOS received");
  };

  const respond = (id: string, ok: boolean) => {
    store.setAlertStatus(id, ok ? "acknowledged" : "ignored");
    store.updateClient(client.id, { responsive: ok });
    if (ok) {
      const inc = store.activeIncidentFor(client.id);
      if (inc) store.addEscalation(inc.id, { level: "resolved", note: "User confirmed they are safe" });
    }
  };

  return (
    <div className="min-h-screen">
      <Header right={<button onClick={() => { store.logout(); nav({ to: "/" }); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary"><LogOut className="h-3.5 w-3.5" />Sign out</button>} />

      <main className="mx-auto max-w-6xl space-y-6 px-6 pb-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-3xl font-bold">{client.name}</h1>
          </div>
          <StatusBadge status={safety.status} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="glass flex flex-col items-center rounded-xl p-6">
            <SafetyMeter score={safety.score} />
            <ul className="mt-6 w-full space-y-1.5 text-xs text-muted-foreground">
              {safety.reasons.map((r, i) => (
                <li key={i} className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-primary" />{r}</li>
              ))}
            </ul>
            <div className="mt-6 grid w-full grid-cols-2 gap-2">
              <button onClick={sos} className="pulse-ring inline-flex items-center justify-center gap-1.5 rounded-lg bg-destructive px-3 py-3 text-sm font-bold text-destructive-foreground glow-danger">
                <AlertTriangle className="h-4 w-4" /> SOS
              </button>
              <button onClick={missedCall} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-3 text-sm font-medium hover:bg-secondary">
                <PhoneCall className="h-4 w-4" /> Missed Call
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-xl p-5">
              <div className="mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><h3 className="font-semibold">Your location</h3></div>
              <ClientOnly fallback={<div className="h-[300px] animate-pulse rounded-xl bg-secondary" />}>
                <LocationMap clients={[client]} height={300} focus={{ lat: client.lat, lng: client.lng }} />
              </ClientOnly>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-3 flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /><h3 className="font-semibold">Alerts from Suraksha</h3></div>
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No alerts. You're all clear.</p>
              ) : (
                <ul className="space-y-2">
                  {alerts.slice(0, 6).map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card/60 p-3">
                      <div>
                        <p className="text-sm">{a.message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleTimeString()} · {a.status}</p>
                      </div>
                      {a.status === "pending" && (
                        <div className="flex gap-1.5">
                          <button onClick={() => respond(a.id, true)} className="inline-flex items-center gap-1 rounded-md bg-[color:var(--color-safe)]/20 px-2 py-1 text-xs text-[color:var(--color-safe)] hover:bg-[color:var(--color-safe)]/30"><CheckCircle2 className="h-3 w-3" />I'm Safe</button>
                          <button onClick={() => respond(a.id, false)} className="inline-flex items-center gap-1 rounded-md bg-destructive/20 px-2 py-1 text-xs text-destructive hover:bg-destructive/30"><X className="h-3 w-3" />Need Help</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DemoControls clientId={client.id} />
      </main>
    </div>
  );
}

function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary glow-primary"><Shield className="h-5 w-5 text-primary-foreground" /></div>
        <div>
          <div className="text-sm font-bold leading-none">Suraksha</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">User Console</div>
        </div>
      </Link>
      {right}
    </header>
  );
}
