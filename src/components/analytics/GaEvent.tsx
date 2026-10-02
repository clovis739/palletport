"use client";

import { useEffect, useRef } from "react";
import { gaEvent, type GaParams } from "@/lib/analytics";

/**
 * Sends one GA4 event when it mounts (e.g. view_item on a lot page). Renders nothing.
 * `onceKey` stops repeats in the same browser tab, e.g. a purchase when the confirmation page is refreshed.
 */
export function GaEvent({ name, params, onceKey }: { name: string; params?: GaParams; onceKey?: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    if (onceKey) {
      try {
        const k = `ga-once:${onceKey}`;
        if (sessionStorage.getItem(k)) return;
        sessionStorage.setItem(k, "1");
      } catch {
        /* storage blocked: send anyway */
      }
    }
    gaEvent(name, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/**
 * Place inside a <form> to send a GA4 event when that form is submitted (works with server-action forms).
 * If the form has a "quantity" field, its value is applied to every item and to the event value.
 */
export function GaOnSubmit({ name, params }: { name: string; params: GaParams }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const onSubmit = () => {
      const q = Number(new FormData(form).get("quantity") ?? 1) || 1;
      const items = params.items?.map((i) => ({ ...i, quantity: q }));
      const value = items ? items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0) : params.value;
      gaEvent(name, { ...params, items, value });
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [name, params]);
  return <span ref={ref} hidden />;
}
