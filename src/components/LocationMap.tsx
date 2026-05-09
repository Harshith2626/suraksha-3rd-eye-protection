import { lazy, Suspense, useEffect, useState } from "react";
import type { Client } from "@/lib/store";

const Impl = lazy(() => import("./LocationMapImpl").then((m) => ({ default: m.LocationMap })));

type Props = { clients: Client[]; height?: number; focus?: { lat: number; lng: number } };

export function LocationMap(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div style={{ height: props.height ?? 400 }} className="animate-pulse rounded-xl bg-secondary" />;
  }
  return (
    <Suspense fallback={<div style={{ height: props.height ?? 400 }} className="animate-pulse rounded-xl bg-secondary" />}>
      <Impl {...props} />
    </Suspense>
  );
}
