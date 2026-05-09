import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Send, Siren, Phone, Users, MapPin, ShieldCheck } from "lucide-react";
import { store, useStore, type AlertKind } from "@/lib/store";
import { computeSafety } from "@/lib/safety";
import { SafetyMeter, StatusBadge } from "@/components/SafetyMeter";
import { LocationMap } from "@/components/LocationMap";
import { ClientOnly } from "@/components/ClientOnly";

export const Route = createFileRoute("/admin_/track/$id")({ component: TrackClient });

const ALERT_TEMPLATES: { kind: AlertKind; label: string; message: string }[] = [
  { kind: "deviation", label: "Route deviation", message: "⚠️ You've deviated from your usual route. Are you safe?" },
  { kind: "unsafe_zone", label: "Outside safe zone (long)", message: "⚠️ You've been outside your safe zones for a long time. Please confirm safety." },
  { kind: "night_unsafe", label: "Unsafe at night", message: "🌙 You're outside a safe zone during night hours. Please respond." },
  { kind: "near_danger", label: "Near danger zone", message: "🚨 You're near a flagged danger zone. Are you okay?" },
  { kind: "safety_check", label: "Routine safety check", message: "👋 Quick safety check — please confirm you're okay." },
];

function TrackClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { id } = Route.useParams();
  const nav = useNavigate();
  const session = useStore((s) => s.session);
  const client = useStore((s) => s.clients.find((c) => c.id === id));
  const alerts = useStore((s) => s.alerts.filter((a) => a.clientId === id));
  const incident = useStore((s) => s.incidents.find((i) => i.clientId === id && i.active));
  const allIncidents = useStore((s) => s.incidents.filter((i) => i.clientId === id));
  const [sent, setSent] = useState("");

  useEffect(() => {
    if (!session || session.role !== "admin") nav({ to: "/login", search: { role: "admin" } });
  }, [session, nav]);

  if (!client) return <div className="p-6">Client not found.</div>;
  const safety = computeSafety(client);

  const sendAlert = (t: typeof ALERT_TEMPLATES[number]) => {
    store.addAlert({ clientId: client.id, kind: t.kind, message: t.message, fromAdmin: true });
    if (!incident) store.startIncident(client.id, t.kind, `Admin sent: ${t.label}`);
    setSent(t.label);
    setTimeout(() => setSent(""), 1500);
  };

  const notifyContacts = () => {
    if (incident) store.addEscalation(incident.id, { level: "contacts_notified", note: `Notified ${client.contacts.length} emergency contacts` });
  };
  const escalatePolice = () => {
    if (incident) store.addEscalation(incident.id, { level: "police_ngo", note: "Police & nearest NGO alerted with live location" });
  };
  const dispatchRescue = () => {
    if (incident) store.addEscalation(incident.id, { level: "rescue_dispatched", note: "Rescue team dispatched to live location" });
  };
  const resolve = () => {
    if (incident) store.addEscalation(incident.id, { level: "resolved", note: "Incident resolved by admin" });
    store.updateClient(client.id, { responsive: true });
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to dashboard</Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">{client.phone} · {client.address}</p>
          </div>
          <StatusBadge status={safety.status} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <div className="glass flex flex-col items-center rounded-xl p-6">
              <SafetyMeter score={safety.score} />
              <ul className="mt-5 w-full space-y-1.5 text-xs text-muted-foreground">
                {safety.reasons.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-3 flex items-center gap-2"><Send className="h-4 w-4 text-primary" /><h3 className="font-semibold">Send alert</h3></div>
              <div className="space-y-1.5">
                {ALERT_TEMPLATES.map((t) => (
                  <button key={t.kind} onClick={() => sendAlert(t)} className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-left text-sm hover:border-primary">
                    {t.label}
                  </button>
                ))}
              </div>
              {sent && <p className="mt-2 text-xs text-[color:var(--color-safe)]">✓ Sent: {sent}</p>}
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><h3 className="font-semibold">Emergency contacts</h3></div>
              <ul className="space-y-1.5">
                {client.contacts.map((c, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border border-border bg-card/60 px-3 py-2 text-sm">
                    <span>{c.name} <span className="text-xs text-muted-foreground">({c.relation})</span></span>
                    <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Phone className="h-3 w-3" />{c.phone}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-xl p-5">
              <div className="mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><h3 className="font-semibold">Live tracking</h3></div>
              <ClientOnly fallback={<div className="h-[380px] animate-pulse rounded-xl bg-secondary" />}>
                <LocationMap clients={[client]} height={380} focus={{ lat: client.lat, lng: client.lng }} />
              </ClientOnly>
              <p className="mt-2 text-xs text-muted-foreground">Last seen: {new Date(client.lastSeen).toLocaleTimeString()} · {client.lat.toFixed(4)}, {client.lng.toFixed(4)}</p>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold"><Siren className="h-4 w-4 text-destructive" />Escalation</h3>
                {incident ? (
                  <span className="rounded-md bg-destructive/20 px-2 py-1 text-xs text-destructive">Active incident</span>
                ) : (
                  <span className="rounded-md bg-[color:var(--color-safe)]/20 px-2 py-1 text-xs text-[color:var(--color-safe)]">No active incident</span>
                )}
              </div>

              {incident && (
                <>
                  <ol className="mb-4 space-y-2 border-l border-border pl-4">
                    {incident.steps.map((s, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <p className="text-sm font-medium capitalize">{s.level.replaceAll("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{s.note} · {new Date(s.at).toLocaleTimeString()}</p>
                      </li>
                    ))}
                  </ol>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={notifyContacts} className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:border-primary">Notify contacts</button>
                    <button onClick={escalatePolice} className="rounded-md bg-destructive/20 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/30">Alert Police & NGO</button>
                    <button onClick={dispatchRescue} className="rounded-md bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90">Dispatch rescue</button>
                    <button onClick={resolve} className="inline-flex items-center justify-center gap-1 rounded-md bg-[color:var(--color-safe)]/20 px-3 py-2 text-xs font-medium text-[color:var(--color-safe)] hover:bg-[color:var(--color-safe)]/30"><ShieldCheck className="h-3 w-3" />Mark resolved</button>
                  </div>
                </>
              )}
            </div>

            <div className="glass rounded-xl p-5">
              <h3 className="mb-3 font-semibold">Alert history</h3>
              {alerts.length === 0 ? <p className="text-sm text-muted-foreground">No alerts yet.</p> : (
                <ul className="space-y-1.5">
                  {alerts.slice(0, 12).map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded-md border border-border bg-card/60 px-3 py-2 text-sm">
                      <span>{a.message}</span>
                      <span className="text-xs text-muted-foreground">{a.status} · {new Date(a.createdAt).toLocaleTimeString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {allIncidents.length > 0 && (
              <div className="glass rounded-xl p-5">
                <h3 className="mb-3 font-semibold">Past incidents</h3>
                <ul className="space-y-1.5 text-sm">
                  {allIncidents.map((i) => (
                    <li key={i.id} className="flex items-center justify-between rounded-md border border-border bg-card/60 px-3 py-2">
                      <span>{i.trigger} · {i.steps.length} steps</span>
                      <span className="text-xs text-muted-foreground">{i.active ? "active" : "resolved"} · {new Date(i.startedAt).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
