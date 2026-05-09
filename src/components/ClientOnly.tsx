import { useEffect, useState } from "react";

export function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return <>{m ? children : fallback}</>;
}
