import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";

type Place = { display_name: string; lat: string; lon: string; name?: string };

type Props = {
  value: string;
  onSelect: (p: { name: string; lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
};

export function PlaceSearch({ value, onSelect, placeholder = "Search city or place…", className = "" }: Props) {
  const [q, setQ] = useState(value);
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const tRef = useRef<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQ(value), [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const search = (text: string) => {
    if (tRef.current) window.clearTimeout(tRef.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    tRef.current = window.setTimeout(async () => {
      try {
        setLoading(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=0&q=${encodeURIComponent(text)}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data: Place[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            search(e.target.value);
          }}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-md border border-border bg-input py-2 pl-7 pr-7 text-sm outline-none focus:border-primary"
        />
        {loading && <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
          {results.map((r, i) => (
            <li key={`${r.lat}-${r.lon}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  const short = r.display_name.split(",").slice(0, 2).join(",").trim();
                  setQ(short);
                  setOpen(false);
                  onSelect({ name: short, lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
                }}
                className="block w-full px-3 py-2 text-left text-xs hover:bg-accent hover:text-accent-foreground"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
