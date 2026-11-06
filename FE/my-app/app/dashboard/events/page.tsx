"use client";

import { useEffect, useState, useRef } from "react";
import { eventApi, artistApi, getImageUrl } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { FormField, Input, Textarea, SubmitButton, StatusBadge } from "@/components/ui/input";
import Link from "next/link";

interface Artist {
  id: number;
  name: string;
  genre?: string | null;
  photo_url?: string | null;
}
interface Event {
  id: number; name: string; description?: string;
  event_date?: string; date?: string;
  event_time?: string;
  location?: string; venue?: string; status?: string;
  capacity?: number; ticketsSold?: number;
  tickets_sold?: number;
  total_quota?: number;
  poster_url?: string; image?: string;
  lineup_poster_url?: string;
  has_seats?: number | boolean;
  artist_ids?: number[];
  artists?: { id: number; name: string }[] | string; // getAll = string, getOne = array
  artist?: { id: number; name: string };
}

const PAGE_SIZE = 8;

function PosterUpload({
  label = "Event Poster",
  helperText = "PNG, JPG, WEBP up to 5MB",
  preview,
  onFileChange,
  onClear,
}: {
  label?: string;
  helperText?: string;
  preview: string;
  onFileChange: (file: File, preview: string) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => onFileChange(file, e.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-zinc-300 text-xs font-semibold">{label}</label>
        <span className="text-[10px] text-zinc-500">{helperText}</span>
      </div>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden ${dragging ? "border-red-500 bg-red-900/10" : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/50"}`}
        style={{ minHeight: 110 }}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="poster" className="w-full h-36 object-cover" />
            <button type="button" onClick={e => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors">
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent py-2 px-3">
              <p className="text-white text-[10px]">Klik untuk ganti gambar</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-zinc-400"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
            <div>
              <p className="text-zinc-300 text-xs font-medium">Klik atau drag gambar</p>
              <p className="text-zinc-600 text-[10px] mt-0.5">{helperText}</p>
            </div>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Event | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", event_date: "", event_time: "",
    venue: "", status: "published", capacity: 0, has_seats: true, artistIds: [] as number[],
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [lineupFile, setLineupFile] = useState<File | null>(null);
  const [lineupPreview, setLineupPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [artistSearch, setArtistSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const load = async () => {
    setLoading(true);
    const [evRes, artRes] = await Promise.all([eventApi.getAll(), artistApi.getAll()]);
    if (evRes.ok) setEvents(Array.isArray(evRes.data) ? evRes.data : evRes.data?.data ?? []);
    if (artRes.ok) setArtists(Array.isArray(artRes.data) ? artRes.data : artRes.data?.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getPoster = (ev: Event) => getImageUrl(ev.poster_url || ev.image || "");

  const getEventDate = (ev: Event) => ev.event_date || ev.date || "";
  const getArtistName = (ev: Event) => {
    // getAll returns artists as GROUP_CONCAT string, getOne returns array
    if (typeof ev.artists === "string" && ev.artists) return ev.artists;
    if (Array.isArray(ev.artists) && ev.artists.length > 0) return ev.artists.map(a => a.name).join(", ");
    if (ev.artist?.name) return ev.artist.name;
    return "—";
  };

  const resetForm = () => {
    setForm({ name: "", description: "", event_date: "", event_time: "", venue: "", status: "published", capacity: 0, has_seats: true, artistIds: [] });
    setPosterFile(null); setPosterPreview("");
    setLineupFile(null); setLineupPreview("");
    setArtistSearch("");
  };

  const normalizeEvent = (ev: Event): Event => ({
    ...ev,
    // getAll returns artists as GROUP_CONCAT string — normalize to never be used as array
    artists: typeof ev.artists === "string" ? undefined : ev.artists,
  });

  const openCreate = () => { resetForm(); setModal("create"); };
  const openEdit = async (ev: Event) => {
    const safe = normalizeEvent(ev);
    setSelected(safe);
    // getAll returns artists as GROUP_CONCAT string, need getOne for artist array with IDs
    let artistIds: number[] = [];
    try {
      const detail = await eventApi.getById(ev.id);
      if (detail.ok && detail.data?.artists && Array.isArray(detail.data.artists)) {
        artistIds = detail.data.artists.map((a: { id: number }) => a.id);
      }
    } catch {
      // fallback: no artists selected
    }
    const rawDate = ev.event_date ?? ev.date ?? "";
    let formattedDate = "";
    try {
      if (rawDate) {
        formattedDate = new Date(rawDate).toISOString().split("T")[0];
      }
    } catch {
      formattedDate = rawDate.split("T")[0] || "";
    }
    const rawTime = ev.event_time ?? "19:00";
    const formattedTime = rawTime.length >= 5 ? rawTime.slice(0, 5) : rawTime;

    setForm({
      name: ev.name,
      description: ev.description ?? "",
      event_date: formattedDate,
      event_time: formattedTime,
      venue: ev.venue ?? ev.location ?? "",
      status: (ev.status ?? "published").toLowerCase(),
      capacity: ev.capacity ?? 0,
      has_seats: ev.has_seats !== undefined ? Boolean(Number(ev.has_seats)) : true,
      artistIds,
    });
    setPosterFile(null);
    setPosterPreview(getPoster(ev));
    setLineupFile(null);
    setLineupPreview(ev.lineup_poster_url ? getImageUrl(ev.lineup_poster_url) : "");
    setModal("edit");
  };
  const openDelete = (ev: Event) => { setSelected(normalizeEvent(ev)); setModal("delete"); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("description", form.description ?? "");
    fd.append("event_date", form.event_date);
    fd.append("event_time", form.event_time || "19:00:00");
    fd.append("venue", form.venue.trim());
    fd.append("status", form.status.toLowerCase());
    fd.append("has_seats", form.has_seats ? "1" : "0");
    fd.append("artist_ids", JSON.stringify(form.artistIds));

    if (posterFile) {
      fd.append("poster", posterFile);
    } else if (posterPreview) {
      fd.append("poster_url", selected?.poster_url || selected?.image || "");
    } else {
      fd.append("poster_url", "");
    }

    if (lineupFile) {
      fd.append("lineup_poster", lineupFile);
    } else if (lineupPreview) {
      fd.append("lineup_poster_url", selected?.lineup_poster_url || "");
    } else {
      fd.append("lineup_poster_url", "");
    }

    if (modal === "create") await eventApi.create(fd);
    else if (modal === "edit" && selected) await eventApi.update(selected.id, fd);
    setSaving(false); setModal(null); resetForm(); load();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    await eventApi.remove(selected.id);
    setSaving(false); setModal(null); load();
  };

  const toggleArtist = (id: number) => {
    setForm(f => ({
      ...f,
      artistIds: f.artistIds.includes(id) ? f.artistIds.filter(x => x !== id) : [...f.artistIds, id],
    }));
  };

  const filtered = events.filter(e => {
    const matchSearch =
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      getArtistName(e).toLowerCase().includes(search.toLowerCase()) ||
      (e.venue ?? e.location ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || (e.status ?? "").toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalEventsCount = events.length;
  const activeEventsCount = events.filter((e) => {
    const s = (e.status ?? "").toLowerCase();
    return s === "published" || s === "active";
  }).length;
  const totalTicketsDistributed = events.reduce((s, e) => s + Number(e.tickets_sold ?? e.ticketsSold ?? 0), 0);
  const totalCapacityOverall = events.reduce((s, e) => s + Number(e.total_quota ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-850">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Katalog Konser & Event</h1>
          <p className="text-zinc-400 text-xs mt-1">Kelola jadwal panggung, pamflet line-up, dan kuota tiket konser.</p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition active:scale-[0.99] self-start sm:self-auto cursor-pointer"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          <span>Buat Event Baru</span>
        </button>
      </div>

      {/* Summary Stat Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-4 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Total Konser</p>
          <p className="text-white text-2xl font-bold mt-1 font-mono">{loading ? "..." : totalEventsCount}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Jadwal konser terdata</p>
        </div>
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-4 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Konser Tayang (Live)</p>
          <p className="text-emerald-400 text-2xl font-bold mt-1 font-mono">{loading ? "..." : activeEventsCount}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Aktif di aplikasi mobile</p>
        </div>
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-4 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Tiket Terdistribusi</p>
          <p className="text-white text-2xl font-bold mt-1 font-mono">{loading ? "..." : totalTicketsDistributed.toLocaleString("id-ID")}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Akumulasi tiket terjual</p>
        </div>
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-4 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Total Kapasitas Kuota</p>
          <p className="text-white text-2xl font-bold mt-1 font-mono">{loading ? "..." : totalCapacityOverall.toLocaleString("id-ID")}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Seluruh kuota kursi panggung</p>
        </div>
      </div>

      {/* Filter Tabs, Search Bar, and View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["ALL", "published", "draft", "closed", "completed"].map((st) => {
            const isSel = filterStatus.toLowerCase() === st.toLowerCase();
            return (
              <button
                key={st}
                onClick={() => {
                  setFilterStatus(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition shrink-0 cursor-pointer ${
                  isSel
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
                }`}
              >
                {st === "ALL" ? "Semua Status" : st}
              </button>
            );
          })}
        </div>

        {/* Search & View Mode */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#0b0c0f] border border-zinc-800/80 rounded-lg px-3 py-2 w-full md:w-72">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.75" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari event, artis, venue..."
              className="bg-transparent text-white text-xs outline-none placeholder:text-zinc-600 w-full"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-zinc-500 hover:text-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[#0b0c0f] border border-zinc-800/80 rounded-lg p-1 shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition ${viewMode === "table" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}
              title="Table View"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}
              title="Grid View"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering: Grid vs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-16 text-center flex flex-col items-center justify-center gap-2">
          <p className="text-zinc-400 text-sm font-medium">Tidak ada event ditemukan</p>
          <p className="text-zinc-600 text-xs">Coba sesuaikan kata kunci pencarian atau filter status</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((ev) => {
            const poster = getPoster(ev);
            const sold = Number(ev.tickets_sold ?? ev.ticketsSold ?? 0);
            const quota = Number(ev.total_quota ?? 0);
            const pct = quota > 0 ? Math.min(100, Math.round((sold / quota) * 100)) : 0;

            return (
              <div
                key={ev.id}
                className="bg-[#0b0c0f] border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl overflow-hidden flex flex-col justify-between group transition shadow-sm"
              >
                <div>
                  <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                    {poster ? (
                      <img src={poster} alt={ev.name} className="w-full h-full object-cover group-hover:scale-102 transition duration-300" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-zinc-600">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5" />
                        </svg>
                        <span className="text-[10px]">Tanpa Cover</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <StatusBadge status={ev.status ?? "published"} />
                      {ev.has_seats !== undefined && (
                        Boolean(Number(ev.has_seats)) ? (
                          <span className="bg-black/70 border border-zinc-700/80 text-zinc-300 text-[9px] font-mono px-2 py-0.5 rounded">
                            Numbered Seat
                          </span>
                        ) : (
                          <span className="bg-black/70 border border-zinc-700/80 text-zinc-400 text-[9px] font-mono px-2 py-0.5 rounded">
                            Free Standing
                          </span>
                        )
                      )}
                    </div>

                    <div className="absolute bottom-2 left-2.5 right-2.5 text-white text-[11px] font-mono truncate">
                      {ev.venue ?? ev.location ?? "Venue"}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-white font-bold text-sm leading-snug line-clamp-1">{ev.name}</h3>
                      <p className="text-red-400 text-xs font-medium truncate mt-0.5">{getArtistName(ev)}</p>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" />
                      </svg>
                      <span>
                        {getEventDate(ev)
                          ? new Date(getEventDate(ev)).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                      {ev.event_time && <span className="font-mono text-zinc-500">• {ev.event_time.substring(0, 5)} WIB</span>}
                    </div>

                    {/* Ticket Quota Bar */}
                    <div className="space-y-1 pt-2 border-t border-zinc-850">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>Tiket Terjual: {sold.toLocaleString("id-ID")} {quota > 0 && `/ ${quota.toLocaleString("id-ID")}`}</span>
                        {quota > 0 && <span className="text-white font-bold">{pct}%</span>}
                      </div>
                      {quota > 0 && (
                        <div className="w-full h-1.5 rounded-full bg-zinc-850 overflow-hidden">
                          <div className="h-full bg-red-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2.5 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between">
                  <button
                    onClick={() => openEdit(ev)}
                    className="text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer"
                  >
                    Edit Konser
                  </button>
                  <button
                    onClick={() => openDelete(ev)}
                    className="text-zinc-500 hover:text-red-400 text-xs transition cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/40">
            <span className="col-span-3 font-medium">Nama Konser</span>
            <span className="col-span-2 font-medium">Musisi Panggung</span>
            <span className="col-span-2 font-medium">Jadwal & Waktu</span>
            <span className="col-span-2 font-medium">Venue</span>
            <span className="col-span-1 text-center font-medium">Tiket Terjual</span>
            <span className="col-span-1 text-center font-medium">Status</span>
            <span className="col-span-1 text-right font-medium">Aksi</span>
          </div>

          {paginated.map((ev, i) => (
            <div
              key={ev.id}
              className={`grid grid-cols-12 items-center px-5 py-3.5 hover:bg-zinc-900/40 transition-colors group ${
                i < paginated.length - 1 ? "border-b border-zinc-800/50" : ""
              }`}
            >
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {getPoster(ev) ? (
                    <img src={getPoster(ev)} alt={ev.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-zinc-600">
                      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-white text-xs font-semibold leading-tight line-clamp-1">{ev.name}</p>
                    {ev.has_seats !== undefined && (
                      Boolean(Number(ev.has_seats)) ? (
                        <span className="bg-zinc-850 border border-zinc-700/60 text-zinc-300 text-[8px] font-mono px-1 py-0.2 rounded">
                          Numbered
                        </span>
                      ) : (
                        <span className="bg-zinc-850 border border-zinc-700/60 text-zinc-400 text-[8px] font-mono px-1 py-0.2 rounded">
                          Festival
                        </span>
                      )
                    )}
                  </div>
                  {ev.description && <p className="text-zinc-500 text-[10px] mt-0.5 line-clamp-1">{ev.description}</p>}
                </div>
              </div>
              <span className="col-span-2 text-zinc-300 text-xs font-medium truncate">{getArtistName(ev)}</span>
              <div className="col-span-2 min-w-0">
                <p className="text-zinc-300 text-xs font-medium">
                  {getEventDate(ev)
                    ? new Date(getEventDate(ev)).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
                {ev.event_time && <p className="text-zinc-500 text-[10px] font-mono">{ev.event_time.substring(0, 5)} WIB</p>}
              </div>
              <span className="col-span-2 text-zinc-400 text-xs truncate">{ev.venue ?? ev.location ?? "—"}</span>
              <div className="col-span-1 text-center font-mono">
                <span className="text-white text-xs font-medium">
                  {Number(ev.tickets_sold ?? ev.ticketsSold ?? 0).toLocaleString()}
                </span>
                {ev.total_quota != null && Number(ev.total_quota) > 0 && (
                  <p className="text-zinc-500 text-[10px]">/ {Number(ev.total_quota).toLocaleString()}</p>
                )}
              </div>
              <div className="col-span-1 flex justify-center">
                <StatusBadge status={ev.status ?? "published"} />
              </div>
              <div className="col-span-1 flex items-center justify-end gap-1">
                <button
                  onClick={() => openEdit(ev)}
                  className="text-zinc-400 hover:text-white p-1.5 rounded-md hover:bg-zinc-800 transition"
                  title="Edit Event"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                  </svg>
                </button>
                <button
                  onClick={() => openDelete(ev)}
                  className="text-zinc-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-950/20 transition"
                  title="Hapus Event"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" />
                    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/40 rounded-xl">
          <p className="text-zinc-500 text-xs">Menampilkan {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} dari {filtered.length} konser</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="px-2.5 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition">Sebelumnya</button>
            <span className="text-zinc-400 text-xs px-2 font-mono">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-2.5 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition">Berikutnya</button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modal === "create" || modal === "edit"} onClose={() => { setModal(null); resetForm(); }} title={modal === "create" ? "Create Event" : "Edit Event"}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <PosterUpload
              label="Cover / Thumbnail"
              helperText="Landscape / Card (5MB)"
              preview={posterPreview}
              onFileChange={(f, p) => { setPosterFile(f); setPosterPreview(p); }}
              onClear={() => { setPosterFile(null); setPosterPreview(""); }}
            />
            <PosterUpload
              label="Pamflet Promosi / Full Line-up"
              helperText="Format Vertikal (Festival Poster)"
              preview={lineupPreview}
              onFileChange={(f, p) => { setLineupFile(f); setLineupPreview(p); }}
              onClear={() => { setLineupFile(null); setLineupPreview(""); }}
            />
          </div>
          <FormField label="Event Name"><Input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Event name" /></FormField>

          {/* Enhanced Artist Selection with Search & Chips */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 text-xs font-semibold">Line-up Musisi / Artis</label>
              <span className="text-[11px] text-zinc-500 font-medium">
                {form.artistIds.length} artis terpilih
              </span>
            </div>

            {/* Selected Artists Badges / Chips */}
            {form.artistIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                {form.artistIds.map(id => {
                  const art = artists.find(a => a.id === id);
                  if (!art) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/70 border border-red-800/80 text-red-300 text-xs font-medium"
                    >
                      <span>{art.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleArtist(id)}
                        className="text-red-400 hover:text-white transition-colors"
                        title="Hapus"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, artistIds: [] }))}
                  className="text-[10px] text-zinc-500 hover:text-red-400 self-center ml-auto px-1 py-0.5"
                >
                  Reset Semua
                </button>
              </div>
            )}

            {/* Artist Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={artistSearch}
                onChange={e => setArtistSearch(e.target.value)}
                placeholder="Cari nama musisi atau genre..."
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-xs pl-8 pr-7 py-2 rounded-lg outline-none focus:border-red-500 transition-colors placeholder:text-zinc-500"
              />
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                className="absolute left-2.5 top-2.5 text-zinc-400"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {artistSearch && (
                <button
                  type="button"
                  onClick={() => setArtistSearch("")}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            {/* Scrollable Artist List */}
            <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-lg p-1.5 max-h-48 overflow-y-auto flex flex-col gap-1">
              {artists.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-3">
                  Belum ada data artis. <Link href="/dashboard/artists" className="text-red-400 hover:underline">Tambah artis baru</Link>
                </p>
              ) : (() => {
                const filteredList = artists.filter(a => {
                  if (!artistSearch.trim()) return true;
                  const q = artistSearch.toLowerCase();
                  return (
                    a.name.toLowerCase().includes(q) ||
                    (a.genre && a.genre.toLowerCase().includes(q))
                  );
                });

                if (filteredList.length === 0) {
                  return (
                    <div className="text-center py-3">
                      <p className="text-zinc-500 text-xs">Tidak ada artis yang cocok dengan "{artistSearch}".</p>
                      <button
                        type="button"
                        onClick={() => setArtistSearch("")}
                        className="text-[11px] text-red-400 hover:underline mt-1"
                      >
                        Tampilkan Semua Artis
                      </button>
                    </div>
                  );
                }

                return filteredList.map(a => {
                  const isChecked = form.artistIds.includes(a.id);
                  const avatarUrl = a.photo_url ? getImageUrl(a.photo_url) : null;
                  return (
                    <label
                      key={a.id}
                      className={`flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        isChecked ? "bg-red-950/30 border border-red-900/40" : "hover:bg-zinc-700/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={a.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0 bg-zinc-900 border border-zinc-700"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 border border-zinc-600">
                            <span className="text-[10px] text-red-400 font-bold uppercase">
                              {a.name.slice(0, 2)}
                            </span>
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-zinc-200 text-xs font-semibold truncate leading-tight">{a.name}</p>
                          {a.genre && (
                            <p className="text-zinc-500 text-[10px] truncate mt-0.5">{a.genre}</p>
                          )}
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleArtist(a.id)}
                        className="accent-red-600 w-4 h-4 rounded cursor-pointer shrink-0"
                      />
                    </label>
                  );
                });
              })()}
            </div>
          </div>

          <FormField label="Deskripsi Konser"><Textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Deskripsi informasi konser..." /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tanggal"><Input required type="date" value={form.event_date} onChange={e=>setForm(f=>({...f,event_date:e.target.value}))} /></FormField>
            <FormField label="Waktu (WIB)"><Input type="time" value={form.event_time} onChange={e=>setForm(f=>({...f,event_time:e.target.value}))} /></FormField>
          </div>
          <FormField label="Lokasi & Venue"><Input required value={form.venue} onChange={e=>setForm(f=>({...f,venue:e.target.value}))} placeholder="Nama Venue, Kota" /></FormField>

          {/* Seat selection requirement toggle */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-semibold">Tipe Kursi (Seated Event)</p>
              <p className="text-zinc-500 text-[11px] mt-0.5">
                {form.has_seats
                  ? "Aktif: Pelanggan memilih nomor kursi pada denah panggung."
                  : "Nonaktif: Free Standing / Festival."}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_seats}
                onChange={e => setForm(f => ({ ...f, has_seats: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          <FormField label="Status Penayangan">
            <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="bg-zinc-950 border border-zinc-800 text-white text-xs px-3 py-2 rounded-md outline-none focus:border-red-600 transition cursor-pointer">
              <option value="published">Published (Tayang)</option>
              <option value="draft">Draft (Tersimpan)</option>
              <option value="closed">Closed (Ditutup)</option>
              <option value="completed">Completed (Selesai)</option>
              <option value="cancelled">Cancelled (Dibatalkan)</option>
            </select>
          </FormField>
          <div className="pt-2">
            <SubmitButton loading={saving}>{modal === "create" ? "Publikasikan Konser" : "Simpan Perubahan"}</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="Hapus Konser">
        <div className="flex flex-col gap-4">
          {selected && getPoster(selected) && <img src={getPoster(selected)} alt={selected.name} className="w-full h-28 object-cover rounded-lg" />}
          <p className="text-zinc-400 text-xs leading-relaxed">Hapus konser <strong className="text-white">&ldquo;{selected?.name}&rdquo;</strong>? Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex gap-2.5 pt-2">
            <button onClick={() => setModal(null)} className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium py-2 rounded-lg transition">Batal</button>
            <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-medium py-2 rounded-lg transition">{saving ? "Menghapus..." : "Hapus Konser"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
