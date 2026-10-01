"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

/** Shows a banner when the browser goes offline, and a brief "back online" confirmation. */
export function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [recovered, setRecovered] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => {
      setOnline(true);
      setRecovered(true);
      setTimeout(() => setRecovered(false), 3000);
    };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (online && !recovered) return null;
  return (
    <div
      role="status"
      aria-live="assertive"
      className={`fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-2xl px-4 py-2.5 sm:rounded-full sm:px-5 text-sm font-semibold text-white ${online ?"bg-moss":"bg-ink"}`}
    >
      {online ? <Wifi aria-hidden className="h-4 w-4 shrink-0" /> : <WifiOff aria-hidden className="h-4 w-4 shrink-0" />}
      {online ? "Back online — prices and stock are up to date again." : "You're offline. Prices and stock may be out of date until you reconnect."}
    </div>
  );
}
