"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { eventApi, getImageUrl, authApi } from "@/lib/api";
import { getStoredUser, clearAuth } from "@/lib/auth";

interface Event {
  id: number;
  name: string;
  description?: string;
  event_date?: string;
  event_time?: string;
  venue?: string;
  status?: string;
  poster_url?: string;
  artists?: string;
  tickets_sold?: number;
  total_quota?: number;
}

export default function MobileEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<{ name: string; email?: string } | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    eventApi.getAll().then((res) => {
      if (res.ok) {
        setEvents(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      }
      setLoading(false);
    });
  }, []);

  const filteredEvents = useMemo(() => {
    const s = search.toLowerCase();
    return events.filter((e) => {
      const isPublished = (e.status || "").toLowerCase() === "published" || (e.status || "").toLowerCase() === "active";
      if (!isPublished) return false;
      if (!s) return true;
      return (
        e.name.toLowerCase().includes(s) ||
        (e.venue || "").toLowerCase().includes(s) ||
        (e.artists || "").toLowerCase().includes(s)
      );
    });
  }, [events, search]);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-red-500">
            <rect x="1" y="6" width="2" height="8" fill="currentColor" />
            <rect x="5" y="3" width="2" height="14" fill="currentColor" />
            <rect x="9" y="1" width="2" height="18" fill="currentColor" />
            <rect x="13" y="3" width="2" height="14" fill="currentColor" />
            <rect x="17" y="6" width="2" height="8" fill="currentColor" />
          </svg>
          <span className="font-extrabold tracking-widest text-lg uppercase">LOUDER</span>
        </div>

        {user ? (
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-zinc-300 font-medium">{user.name}</span>
            <button
              onClick={() => {
                clearAuth();
                window.location.href = "/login";
              }}
              className="text-zinc-500 hover:text-red-400 text-xs p-1"
              title="Keluar"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider"
          >
            Masuk
          </Link>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-5 pt-6 flex flex-col gap-6">
        {/* Instant Search Bar */}
        <div className="relative">
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="1.5" />
            <path d="m21 21-4.35-4.35" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari konser favorit, venue, atau artis..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-red-500/80 transition-all shadow-inner"
          />
        </div>

        {/* Promo Voucher Banner (Loket.com style) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-zinc-900 to-zinc-900 border border-red-900/40 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="bg-red-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded">VOUCHER</span>
              <p className="text-white text-xs font-bold font-mono">LOUDERFEST</p>
            </div>
            <p className="text-zinc-400 text-[11px]">Gunakan voucher diskon 15% untuk semua tiket!</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText("LOUDERFEST")}
            className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 text-[10px] font-bold uppercase px-3 py-2 rounded-xl transition-all border border-zinc-700 shrink-0"
          >
            Salin Kode
          </button>
        </div>

        {/* Concert Feed */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-base tracking-tight">Konser Terkini</h2>
            <span className="text-zinc-500 text-xs font-mono">{filteredEvents.length} Event</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10 text-center flex flex-col items-center gap-2">
              <p className="text-zinc-400 text-sm font-medium">Konser tidak ditemukan</p>
              <p className="text-zinc-600 text-xs">Coba cari dengan nama artis atau lokasi lain.</p>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const poster = getImageUrl(ev.poster_url);
              const dateStr = ev.event_date
                ? new Date(ev.event_date).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "TBA";

              return (
                <div
                  key={ev.id}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl hover:border-zinc-700 transition-all flex flex-col group"
                >
                  {/* Poster Aspect Ratio */}
                  <div className="relative h-44 w-full bg-zinc-950 overflow-hidden">
                    {poster ? (
                      <img
                        src={poster}
                        alt={ev.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5" />
                          <path d="M8 2v4M16 2v4M3 10h18" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40" />

                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm border border-zinc-700/60 rounded-full px-2.5 py-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[10px] font-semibold text-white tracking-wider uppercase">Live</span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg leading-tight line-clamp-1">{ev.name}</h3>
                      {ev.artists && (
                        <p className="text-red-400 text-xs font-medium mt-0.5 line-clamp-1">{ev.artists}</p>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-zinc-500">
                          <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5" />
                          <path d="M8 2v4M16 2v4M3 10h18" strokeWidth="1.5" />
                        </svg>
                        <span>{dateStr}</span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-zinc-500">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{ev.venue || "Venue Belum Ditentukan"}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Mulai Pesan</p>
                        <p className="text-white font-mono font-bold text-sm">Tiket Tersedia</p>
                      </div>

                      <Link
                        href={`/events/${ev.id}`}
                        className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-red-950/50"
                      >
                        Beli Tiket
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/80 px-6 py-3 flex items-center justify-around max-w-md mx-auto">
        <Link href="/events" className="flex flex-col items-center gap-1 text-red-500">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5" />
            <path d="M8 2v4M16 2v4M3 10h18" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] font-semibold">Konser</span>
        </Link>

        <Link href="/landingpage" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            <path d="M2 12h20" strokeWidth="1.5" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>
      </nav>
    </div>
  );
}
