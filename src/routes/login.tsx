import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shield } from "lucide-react";
import { store } from "@/lib/store";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    role: (s.role as "admin" | "client") ?? "client",
  }),
  component: LoginPage,
});

function LoginPage() {
  const { role: initial } = Route.useSearch();
  const nav = useNavigate();
  const [role, setRole] = useState<"admin" | "client">(initial);
  const [email, setEmail] = useState(initial === "admin" ? "admin@suraksha.in" : "ananya@demo.in");
  const [password, setPassword] = useState(initial === "admin" ? "admin123" : "client123");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = role === "admin" ? store.loginAdmin(email, password) : store.loginClient(email, password);
    if (!ok) return setErr("Invalid credentials");
    nav({ to: role === "admin" ? "/admin" : "/client" });
  };

  return (
    <div className="min-h-screen px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary"><Shield className="h-4 w-4 text-primary-foreground" /></div>
        <span className="font-bold">Suraksha</span>
      </Link>

      <div className="mx-auto mt-12 max-w-md">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose a role and sign in.</p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg border border-border bg-card p-1">
          {(["client", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-md px-3 py-2 text-sm font-medium capitalize transition ${role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {r === "client" ? "User" : "Admin"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="glass mt-6 space-y-4 rounded-xl p-6">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 glow-primary">Sign in</button>

          {role === "client" && (
            <p className="text-center text-xs text-muted-foreground">
              New here? <Link to="/register" className="text-primary hover:underline">Create account</Link>
            </p>
          )}

          <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Demo:</strong> {role === "admin" ? "admin@suraksha.in / admin123" : "ananya@demo.in / client123"}
          </div>
        </form>
      </div>
    </div>
  );
}
