import { cn } from "@/lib/utils";

export function SafetyMeter({ score, size = 180 }: { score: number; size?: number }) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 75 ? "var(--color-safe)" : score >= 45 ? "var(--color-warn)" : "var(--color-danger)";
  const label = score >= 75 ? "SAFE" : score >= 45 ? "MEDIUM" : "EMERGENCY";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-secondary)" strokeWidth="10" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset .8s, stroke .4s", filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold" style={{ color }}>{score}%</div>
        <div className={cn("mt-1 text-xs font-semibold tracking-widest")} style={{ color }}>{label}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "safe" | "medium" | "emergency" }) {
  const map = {
    safe: { bg: "bg-[color:var(--color-safe)]/15", text: "text-[color:var(--color-safe)]", label: "Safe" },
    medium: { bg: "bg-[color:var(--color-warn)]/15", text: "text-[color:var(--color-warn)]", label: "Medium" },
    emergency: { bg: "bg-[color:var(--color-danger)]/15", text: "text-[color:var(--color-danger)]", label: "Emergency" },
  } as const;
  const m = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", m.bg, m.text)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
      {m.label}
    </span>
  );
}
