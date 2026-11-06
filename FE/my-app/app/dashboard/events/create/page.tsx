"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { eventApi, artistApi, getImageUrl } from "@/lib/api";
import { FormField, Input, Textarea, SubmitButton } from "@/components/ui/input";
import Link from "next/link";

interface Artist {
  id: number;
  name: string;
  genre?: string | null;
  photo_url?: string | null;
}

export default function CreateEventPage() {
  const router = useRouter();
  const posterRef = useRef<HTMLInputElement>(null);
  const lineupRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    event_date: "",
    event_time: "19:00",
    venue: "",
    status: "published",
    has_seats: true,
  });
  const [artistIds, setArtistIds] = useState<number[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistSearch, setArtistSearch] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [lineupFile, setLineupFile] = useState<File | null>(null);
  const [lineupPreview, setLineupPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    artistApi.getAll().then((res) => {
      if (res.ok) setArtists(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    });
  }, []);

  const handlePoster = (file: File) => {
    setPosterFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPosterPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLineup = (file: File) => {
    setLineupFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLineupPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleArtist = (id: number) => {
    setArtistIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const fd = new FormData();
    fd.append("name", form.name.trim());
    if (form.description) fd.append("description", form.description);
    fd.append("event_date", form.event_date);
    fd.append("event_time", form.event_time || "19:00:00");
    fd.append("venue", form.venue.trim());
    fd.append("status", form.status.toLowerCase());
    fd.append("has_seats", form.has_seats ? "1" : "0");
    if (artistIds.length > 0) fd.append("artist_ids", JSON.stringify(artistIds));
    if (posterFile) fd.append("poster", posterFile);
    if (lineupFile) fd.append("lineup_poster", lineupFile);

    const res = await eventApi.create(fd);
    setSaving(false);
    if (res.ok) router.push("/dashboard/events");
    else setError(res.data?.message ?? "Gagal menambahkan konser baru.");
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3 pb-2 border-b border-zinc-850">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition cursor-pointer"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h1 className="text-white font-bold text-xl tracking-tight">Buat Event Baru</h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            Lengkapi rincian konser musik, jadwal panggung, tiket, dan musisi line-up.
          </p>
        </div>
      </div>

      <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-6 shadow-sm">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Dual upload images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cover Thumbnail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-300 text-xs font-semibold">Cover Thumbnail (Landscape)</label>
              <div
                onClick={() => posterRef.current?.click()}
                className="relative cursor-pointer rounded-lg border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-950/60 transition overflow-hidden"
                style={{ minHeight: 120 }}
              >
                {posterPreview ? (
                  <div className="relative">
                    <img src={posterPreview} alt="poster" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPosterFile(null);
                        setPosterPreview("");
                      }}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1"
                    >
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 py-1 px-2 text-center">
                      <p className="text-white text-[10px]">Klik untuk ganti gambar</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-7 text-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-zinc-300 text-xs font-medium">Upload Cover Konser</p>
                    <p className="text-zinc-500 text-[10px]">Format 16:9 / Landscape (Maks 5MB)</p>
                  </div>
                )}
              </div>
              <input
                ref={posterRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePoster(f);
                }}
              />
            </div>

            {/* Full Line-up Poster */}
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-300 text-xs font-semibold">Poster Vertikal / Line-up</label>
              <div
                onClick={() => lineupRef.current?.click()}
                className="relative cursor-pointer rounded-lg border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-950/60 transition overflow-hidden"
                style={{ minHeight: 120 }}
              >
                {lineupPreview ? (
                  <div className="relative">
                    <img src={lineupPreview} alt="lineup" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLineupFile(null);
                        setLineupPreview("");
                      }}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1"
                    >
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                        <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 py-1 px-2 text-center">
                      <p className="text-white text-[10px]">Klik untuk ganti pamflet</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-7 text-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <rect x="4" y="2" width="16" height="20" rx="2" />
                        <path d="M8 7h8M8 12h8M8 17h5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-zinc-300 text-xs font-medium">Upload Pamflet Line-up</p>
                    <p className="text-zinc-500 text-[10px]">Format 3:4 / Vertikal (Maks 5MB)</p>
                  </div>
                )}
              </div>
              <input
                ref={lineupRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLineup(f);
                }}
              />
            </div>
          </div>

          <FormField label="Nama Konser">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Contoh: LOUDER FEST 2026: Sounds of Youth"
            />
          </FormField>

          {/* Line-up Musisi */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 text-xs font-semibold">Musisi / Line-up Artis</label>
              <span className="text-[11px] text-zinc-500 font-mono">
                {artistIds.length} musisi dipilih
              </span>
            </div>

            {artistIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                {artistIds.map((id) => {
                  const art = artists.find((a) => a.id === id);
                  if (!art) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs"
                    >
                      <span className="font-medium">{art.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleArtist(id)}
                        className="text-zinc-500 hover:text-red-400 transition"
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
                  onClick={() => setArtistIds([])}
                  className="text-[10px] text-zinc-500 hover:text-red-400 self-center ml-auto px-1 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value)}
                placeholder="Cari artis atau genre musik..."
                className="w-full bg-zinc-950 border border-zinc-800 text-white text-xs pl-8 pr-7 py-2 rounded-md outline-none focus:border-red-600 transition placeholder:text-zinc-600"
              />
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="absolute left-2.5 top-2.5 text-zinc-500">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {artistSearch && (
                <button
                  type="button"
                  onClick={() => setArtistSearch("")}
                  className="absolute right-2.5 top-2 text-zinc-500 hover:text-white cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-md p-1.5 max-h-40 overflow-y-auto space-y-1">
              {artists.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-3">
                  Belum ada artis terdaftar.{" "}
                  <Link href="/dashboard/artists" className="text-red-400 hover:underline">
                    Tambah artis baru
                  </Link>
                </p>
              ) : (
                artists
                  .filter((a) => {
                    if (!artistSearch.trim()) return true;
                    const q = artistSearch.toLowerCase();
                    return a.name.toLowerCase().includes(q) || (a.genre && a.genre.toLowerCase().includes(q));
                  })
                  .map((a) => {
                    const isChecked = artistIds.includes(a.id);
                    const avatarUrl = a.photo_url ? getImageUrl(a.photo_url) : null;
                    return (
                      <label
                        key={a.id}
                        className={`flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded cursor-pointer transition ${
                          isChecked ? "bg-zinc-900 border border-zinc-700" : "hover:bg-zinc-900/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={a.name}
                              className="w-6 h-6 rounded-full object-cover shrink-0 bg-zinc-900 border border-zinc-800"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-red-500 text-[10px] font-bold">
                              {a.name.slice(0, 1)}
                            </div>
                          )}
                          <div className="truncate">
                            <span className="text-zinc-200 text-xs font-medium truncate block leading-tight">
                              {a.name}
                            </span>
                            {a.genre && <span className="text-zinc-500 text-[10px] truncate">{a.genre}</span>}
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
                  })
              )}
            </div>
          </div>

          <FormField label="Deskripsi Konser">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Tuliskan info tema panggung, jadwal open gate, aturan konser..."
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Tanggal Konser">
              <Input
                required
                type="date"
                value={form.event_date}
                onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
              />
            </FormField>
            <FormField label="Waktu Mulai (WIB)">
              <Input
                type="time"
                value={form.event_time}
                onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Lokasi & Venue">
            <Input
              required
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder="Contoh: Gelora Bung Karno, Jakarta Pusat"
            />
          </FormField>

          {/* Seat selection toggle */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-semibold">Tipe Kursi (Seated / Standing)</p>
              <p className="text-zinc-500 text-[11px] mt-0.5">
                {form.has_seats
                  ? "Aktif: Pelanggan memilih nomor kursi panggung pada denah."
                  : "Nonaktif: Free Standing / Festival (Pelanggan langsung memilih kuantitas tiket)."}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_seats}
                onChange={(e) => setForm((f) => ({ ...f, has_seats: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          <FormField label="Status Penayangan">
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="bg-zinc-950 border border-zinc-800 text-white text-xs px-3 py-2 rounded-md outline-none focus:border-red-600 transition cursor-pointer"
            >
              <option value="published">Published (Tayang di Aplikasi Mobile)</option>
              <option value="draft">Draft (Tersimpan Sementara)</option>
              <option value="closed">Closed (Penjualan Ditutup)</option>
              <option value="completed">Completed (Konser Selesai)</option>
              <option value="cancelled">Cancelled (Dibatalkan)</option>
            </select>
          </FormField>

          <div className="flex gap-2.5 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium py-2 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <div className="flex-1">
              <SubmitButton loading={saving}>Publikasikan Event</SubmitButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
