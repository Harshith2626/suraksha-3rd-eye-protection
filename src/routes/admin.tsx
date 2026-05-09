import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Shield, LogOut, Users, AlertTriangle, Bell, Activity } from "lucide-react";
import { store, useStore } from "@/lib/store";
import { recomputeAll } from "@/lib/safety";
import { StatusBadge } from "@/components/SafetyMeter";
import { LocationMap } from "@/components/LocationMap";
import { ClientOnly } from "@/components/ClientOnly";

export const Route = createFileRoute("/admin")({ component: AdminDash });

function AdminDash() {
  const nav = useNavigate();
  const session = useStore((s) => s.session);
  const clients = useStore((s) => s.clients);
  const alerts = useStore((s) => s.alerts);
  const incidents = useStore((s) => s.incidents);

  useEffect(() => {
    if (!session || session.role !== "admin") nav({ to: "/login", search: { role: "admin" } });
  }, [session, nav]);

  useEffect(() => {
    const t = setInterval(() => recomputeAll(), 2000);
    return () => clearInterval(t);
  }, []);

  const counts = {
    safe: clients.filter((c) => c.status === "safe").length,
    medium: clients.filter((c) => c.status === "medium").length,
    emergency: clients.filter((c) => c.status === "emergency").length,
  };
  const activeIncidents = incidents.filter((i) => i.active);
  const pendingAlerts = alerts.filter((a) => a.status === "pending");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary glow-primary"><Shield className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <div className="text-sm font-bold leading-none">Suraksha</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin Control</div>
          </div>
        </Link>
        <button onClick={() => { store.logout(); nav({ to: "/" }); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary"><LogOut className="h-3.5 w-3.5" />Sign out</button>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 pb-12">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={Users} label="Total clients" value={clients.length} />
          <Stat icon={Activity} label="Safe" value={counts.safe} color="var(--color-safe)" />
          <Stat icon={Bell} label="Medium" value={counts.medium} color="var(--color-warn)" />
          <Stat icon={AlertTriangle} label="Emergency" value={counts.emergency} color="var(--color-danger)" pulse={counts.emergency > 0} />
        </div>

        {activeIncidents.length > 0 && (
          <div className="glass rounded-xl border-l-4 border-destructive p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" />Active incidents ({activeIncidents.length})</h3>
            <div className="space-y-2">
              {activeIncidents.map((inc) => {
                const c = clients.find((x) => x.id === inc.clientId);
                if (!c) return null;
                const lastStep = inc.steps[inc.steps.length - 1];
                return (
                  <Link key={inc.id} to="/admin/client/$id" params={{ id: c.id }} className="flex items-center justify-between rounded-lg border border-border bg-card/60 p-3 hover:border-destructive">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">Trigger: {inc.trigger} · Stage: {lastStep.level} · {new Date(inc.startedAt).toLocaleTimeString()}</p>
                    </div>
                    <span className="rounded-md bg-destructive/20 px-2 py-1 text-xs text-destructive">Open →</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="glass rounded-xl p-5">
            <h3 className="mb-3 font-semibold">Live map</h3>
            <ClientOnly fallback={<div className="h-[420px] animate-pulse rounded-xl bg-secondary" />}>
              <LocationMap clients={clients} height={420} />
            </ClientOnly>
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="mb-3 font-semibold">Pending alerts ({pendingAlerts.length})</h3>
            {pendingAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">All clear.</p>
            ) : (
              <ul className="space-y-2">
                {pendingAlerts.slice(0, 8).map((a) => {
                  const c = clients.find((x) => x.id === a.clientId);
                  return (
                    <li key={a.id} className="rounded-lg border border-border bg-card/60 p-3">
                      <p className="text-sm">{a.message}</p>
                      <p className="text-xs text-muted-foreground">{c?.name} · {new Date(a.createdAt).toLocaleTimeString()}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="mb-3 font-semibold">All clients</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Safety</th>
                  <th className="pb-3 pr-4">Phone</th>
                  <th className="pb-3 pr-4">Address</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-t border-border/60">
                    <td className="py-3 pr-4 font-medium">{c.name}</td>
                    <td className="py-3 pr-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full" style={{ width: `${c.safetyScore}%`, background: c.status === "safe" ? "var(--color-safe)" : c.status === "medium" ? "var(--color-warn)" : "var(--color-danger)" }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{c.safetyScore}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{c.phone}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{c.address}</td>
                    <td className="py-3"><Link to="/admin/client/$id" params={{ id: c.id }} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">Track</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color, pulse }: { icon: any; label: string; value: number; color?: string; pulse?: boolean }) {
  return (
    <div className={`glass rounded-xl p-4 ${pulse ? "animate-pulse" : ""}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" style={{ color }} />{label}
      </div>
      <div className="mt-2 text-3xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
