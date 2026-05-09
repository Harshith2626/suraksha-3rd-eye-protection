import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ShieldAlert, MapPin, BellRing, PhoneCall, Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Suraksha — Women & Child Safety Platform" },
      { name: "description", content: "AI-powered safety with live tracking, escalation chains, and emergency response for women and children." },
      { property: "og:title", content: "Suraksha — Safety, Reimagined" },
      { property: "og:description", content: "Real-time safety scores, SOS, and multi-level emergency escalation." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary glow-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Suraksha</span>
        </div>
        <Link to="/login" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-safe)]" />
          Live monitoring · AI escalation · 24×7 response
        </div>
        <h1 className="mt-6 text-5xl font-bold leading-tight md:text-6xl">
          Safety that <span className="bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] bg-clip-text text-transparent">never sleeps</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          Suraksha protects women & children with real-time safety scoring, automated alert escalation, and instant rescue dispatch — built for India.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/login" search={{ role: "client" } as never} className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow-primary hover:opacity-90">
            I'm a User
          </Link>
          <Link to="/login" search={{ role: "admin" } as never} className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-secondary">
            Suraksha Admin
          </Link>
          <Link to="/register" className="rounded-lg px-6 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground">
            Create account →
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3">
        {[
          { icon: Activity, title: "Live Safety Score", desc: "Continuously updates from location, time, and zone risk." },
          { icon: BellRing, title: "Smart Escalation", desc: "Safety check → contacts → police/NGO, automatically." },
          { icon: PhoneCall, title: "Missed-Call SOS", desc: "Trigger help with a single missed call from your number." },
          { icon: MapPin, title: "Safe & Danger Zones", desc: "Geo-fenced intelligence with night-time risk modelling." },
          { icon: ShieldAlert, title: "Admin Rescue Console", desc: "Track, alert, and dispatch in real time." },
          { icon: Shield, title: "Built for India", desc: "Designed for low-bandwidth, multi-stakeholder rescue flows." },
        ].map((f) => (
          <div key={f.title} className="glass rounded-xl p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        Suraksha · Hackathon Prototype · Demo credentials available on the login page
      </footer>
    </div>
  );
}
