"use client";

import { useState } from "react";

type Props = {
  onLocation: (loc: { lat: number; lng: number; label?: string }) => void;
};

export function LocationGate({ onLocation }: Props) {
  const [mode, setMode] = useState<"idle" | "asking" | "denied" | "working">("idle");
  const [zip, setZip] = useState("");
  const [error, setError] = useState<string | null>(null);

  const requestGeo = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setMode("denied");
      return;
    }
    setMode("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setMode("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  };

  const submitZip = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{5}$/.test(zip)) {
      setError("Enter a 5-digit US ZIP code.");
      return;
    }
    setMode("working");
    try {
      const res = await fetch(`/api/geocode?zip=${zip}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as { lat: number; lng: number; label: string };
      onLocation({ lat: data.lat, lng: data.lng, label: data.label });
    } catch (err) {
      setMode("denied");
      setError(err instanceof Error ? err.message : "Lookup failed.");
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Find cheap gas near you</h2>
      <p className="mt-1 text-sm text-slate-600">
        We can use your device location, or you can enter a ZIP.
      </p>

      <button
        type="button"
        onClick={requestGeo}
        disabled={mode === "asking"}
        className="mt-4 w-full rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {mode === "asking" ? "Requesting…" : "Use my location"}
      </button>

      <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        <span>or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submitZip} className="flex gap-2">
        <input
          inputMode="numeric"
          pattern="\d{5}"
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
          placeholder="ZIP code"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-brand px-4 py-2 text-brand hover:bg-brand hover:text-white"
        >
          Go
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {mode === "denied" && !error && (
        <p className="mt-3 text-sm text-slate-500">
          Location unavailable. Enter a ZIP above to continue.
        </p>
      )}
    </div>
  );
}
