import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Plus, X } from "lucide-react";
import { store, type Contact, type SafeZone } from "@/lib/store";
import { PlaceSearch } from "@/components/PlaceSearch";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+91");
  const [age, setAge] = useState(20);
  const [address, setAddress] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([{ name: "", phone: "+91", relation: "Parent" }]);
  const [zones, setZones] = useState<SafeZone[]>([{ name: "Home", lat: 17.4156, lng: 78.4347, radius: 250 }]);
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return setErr("Fill required fields");
    store.registerClient({ name, email, password, phone, age: Number(age), address, contacts, safeZones: zones });
    nav({ to: "/client" });
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary"><Shield className="h-4 w-4 text-primary-foreground" /></div>
        <span className="font-bold">Suraksha</span>
      </Link>

      <div className="mx-auto mt-10 max-w-2xl">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">We'll use this to keep you safe and reachable in emergencies.</p>

        <form onSubmit={submit} className="glass mt-6 space-y-6 rounded-xl p-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personal info</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name" value={name} onChange={setName} />
              <Field label="Age" type="number" value={String(age)} onChange={(v) => setAge(+v)} />
              <Field label="Email" value={email} onChange={setEmail} />
              <Field label="Phone (for missed-call SOS)" value={phone} onChange={setPhone} />
              <Field label="Password" type="password" value={password} onChange={setPassword} />
              <Field label="Address" value={address} onChange={setAddress} />
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Emergency contacts</h2>
              <button type="button" onClick={() => setContacts([...contacts, { name: "", phone: "+91", relation: "" }])} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3" />Add</button>
            </div>
            <div className="space-y-2">
              {contacts.map((c, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                  <input placeholder="Name" value={c.name} onChange={(e) => upd(setContacts, contacts, i, { name: e.target.value })} className={inp} />
                  <input placeholder="Phone" value={c.phone} onChange={(e) => upd(setContacts, contacts, i, { phone: e.target.value })} className={inp} />
                  <input placeholder="Relation" value={c.relation} onChange={(e) => upd(setContacts, contacts, i, { relation: e.target.value })} className={inp} />
                  <button type="button" onClick={() => setContacts(contacts.filter((_, j) => j !== i))} className="rounded-md border border-border px-2 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Safe zones</h2>
              <button type="button" onClick={() => setZones([...zones, { name: "", lat: 17.42, lng: 78.45, radius: 200 }])} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3" />Add</button>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">Places you frequently visit (home, college, office).</p>
            <div className="space-y-2">
              {zones.map((z, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3">
                  <div className="grid grid-cols-[1fr_110px_auto] items-start gap-2">
                    <div>
                      <PlaceSearch
                        value={z.name}
                        onSelect={({ name, lat, lng }) => upd(setZones, zones, i, { name, lat, lng } as Partial<SafeZone>)}
                        placeholder="Search city or place…"
                      />
                    </div>
                    <input placeholder="Radius m" type="number" value={z.radius} onChange={(e) => upd(setZones, zones, i, { radius: +e.target.value })} className={inp} />
                    <button type="button" onClick={() => setZones(zones.filter((_, j) => j !== i))} className="rounded-md border border-border px-2 py-2 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Latitude</span>
                      <input
                        type="number"
                        step="any"
                        value={Number.isFinite(z.lat) ? z.lat : ""}
                        onChange={(e) => upd(setZones, zones, i, { lat: parseFloat(e.target.value) })}
                        placeholder="e.g. 17.4156"
                        className={`mt-1 w-full ${inp}`}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Longitude</span>
                      <input
                        type="number"
                        step="any"
                        value={Number.isFinite(z.lng) ? z.lng : ""}
                        onChange={(e) => upd(setZones, zones, i, { lng: parseFloat(e.target.value) })}
                        placeholder="e.g. 78.4347"
                        className={`mt-1 w-full ${inp}`}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {err && <p className="text-xs text-destructive">{err}</p>}
          <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 glow-primary">Create account & continue</button>
        </form>
      </div>
    </div>
  );
}

const inp = "rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary";

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={`mt-1 w-full ${inp}`} />
    </label>
  );
}

function upd<T>(set: (v: T[]) => void, arr: T[], i: number, patch: Partial<T>) {
  const next = [...arr];
  next[i] = { ...next[i], ...patch };
  set(next);
}
