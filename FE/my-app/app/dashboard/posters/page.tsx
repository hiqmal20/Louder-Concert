"use client";

import { useEffect, useState, useRef } from "react";
import { posterApi, eventApi, getImageUrl } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { FormField, Input, Textarea, SubmitButton, StatusBadge } from "@/components/ui/input";

interface FestivalPoster {
  id: number;
  event_id?: number | null;
  event_name?: string | null;
  event_venue_db?: string | null;
  event_date_db?: string | null;
  min_price?: number | string | null;
  title: string;
  artists_lineup?: string | null;
  venue?: string | null;
  event_date?: string | null;
  poster_url: string;
  status: "ACTIVE" | "INACTIVE";
  created_at?: string;
}

interface EventItem {
  id: number;
  name: string;
  venue?: string;
  event_date?: string;
  artists?: string;
}

const EMPTY_FORM = {
  event_id: "",
  title: "",
  artists_lineup: "",
  venue: "",
  event_date: "",
  status: "ACTIVE" as "ACTIVE" | "INACTIVE",
};

function PosterUploadBox({
  preview,
  onFileChange,
  onClear,
}: {
  preview: string;
  onFileChange: (file: File, preview: string) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onFileChange(file, e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-zinc-300 text-xs font-semibold">
          File Gambar Poster Iklan (Format Vertikal / 3:4 atau 9:16)
        </label>
        <span className="text-[10px] text-zinc-500">Maks. 5MB (PNG/JPG/WEBP)</span>
      </div>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
          dragging
            ? "border-red-500 bg-red-950/20"
            : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/60"
        }`}
        style={{ minHeight: 180 }}
      >
        {preview ? (
          <div className="relative flex items-center justify-center bg-black/60 p-2">
            <img
              src={preview}
              alt="poster preview"
              className="max-h-64 object-contain rounded-xl shadow-lg"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-3 right-3 bg-black/80 hover:bg-black text-white rounded-full p-2 transition-colors shadow-md"
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm rounded-lg py-1 px-3 text-center">
              <p className="text-white text-[10px] font-medium">Klik untuk ganti gambar poster iklan</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2.5 py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-700/80 border border-zinc-600 flex items-center justify-center shadow">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" className="text-red-400">
                <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="9" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 18l5-5 3 3 5-5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Klik atau seret poster iklan festival konser</p>
              <p className="text-zinc-500 text-[10px] mt-0.5">Sesuai contoh poster line-up artis resmi</p>
            </div>
          </div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

export default function FestivalPostersPage() {
  const [posters, setPosters] = useState<FestivalPoster[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | "preview" | null>(null);
  const [selected, setSelected] = useState<FestivalPoster | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const load = async () => {
    setLoading(true);
    const [pRes, eRes] = await Promise.all([posterApi.getAll(), eventApi.getAll()]);
    if (pRes.ok) setPosters(Array.isArray(pRes.data) ? pRes.data : pRes.data?.data ?? []);
    if (eRes.ok) setEvents(Array.isArray(eRes.data) ? eRes.data : eRes.data?.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setPosterFile(null);
    setPosterPreview("");
  };

  const openCreate = () => {
    resetForm();
    setModal("create");
  };

  const openEdit = (p: FestivalPoster) => {
    setSelected(p);
    let formattedDate = "";
    if (p.event_date) {
      try {
        formattedDate = new Date(p.event_date).toISOString().split("T")[0];
      } catch {
        formattedDate = p.event_date.split("T")[0] || "";
      }
    }
    setForm({
      event_id: p.event_id ? String(p.event_id) : "",
      title: p.title,
      artists_lineup: p.artists_lineup || "",
      venue: p.venue || "",
      event_date: formattedDate,
      status: p.status,
    });
    setPosterFile(null);
    setPosterPreview(p.poster_url ? getImageUrl(p.poster_url) : "");
    setModal("edit");
  };

  const openDelete = (p: FestivalPoster) => {
    setSelected(p);
    setModal("delete");
  };

  const openPreview = (p: FestivalPoster) => {
    setSelected(p);
    setModal("preview");
  };

  const handleEventSelect = (eventIdStr: string) => {
    setForm((prev) => {
      if (!eventIdStr) {
        return { ...prev, event_id: "" };
      }
      const matched = events.find((e) => String(e.id) === eventIdStr);
      let eventDateFormatted = "";
      if (matched?.event_date) {
        try {
          eventDateFormatted = new Date(matched.event_date).toISOString().split("T")[0];
        } catch {
          eventDateFormatted = matched.event_date.split("T")[0] || "";
        }
      }
      return {
        ...prev,
        event_id: eventIdStr,
        title: prev.title || `THE FULL LINE UP - ${matched?.name || ""}`,
        venue: prev.venue || matched?.venue || "",
        event_date: prev.event_date || eventDateFormatted,
        artists_lineup: prev.artists_lineup || (typeof matched?.artists === "string" ? matched.artists : ""),
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append("title", form.title.trim());
    if (form.event_id) fd.append("event_id", form.event_id);
    if (form.artists_lineup) fd.append("artists_lineup", form.artists_lineup.trim());
    if (form.venue) fd.append("venue", form.venue.trim());
    if (form.event_date) fd.append("event_date", form.event_date);
    fd.append("status", form.status);

    if (posterFile) {
      fd.append("poster", posterFile);
    } else if (posterPreview && selected?.poster_url) {
      fd.append("poster_url", selected.poster_url);
    }

    if (modal === "create") await posterApi.create(fd);
    else if (modal === "edit" && selected) await posterApi.update(selected.id, fd);

    setSaving(false);
    setModal(null);
    resetForm();
    load();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    await posterApi.remove(selected.id);
    setSaving(false);
    setModal(null);
    load();
  };

  const filtered = posters.filter((p) => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      p.title.toLowerCase().includes(s) ||
      (p.artists_lineup || "").toLowerCase().includes(s) ||
      (p.venue || "").toLowerCase().includes(s) ||
      (p.event_name || "").toLowerCase().includes(s);

    const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-850">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Poster Iklan & Pamflet</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Upload pamflet full line-up artis festival resmi untuk tayang di banner aplikasi mobile.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition active:scale-[0.99] self-start sm:self-auto cursor-pointer"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          Upload Poster Baru
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Total Poster Iklan</p>
          <p className="text-white text-2xl font-bold mt-2 font-mono tracking-tight">{loading ? "..." : posters.length}</p>
          <p className="text-zinc-500 text-xs mt-1">{posters.filter(p => p.status === "ACTIVE").length} ditampilkan aktif</p>
        </div>
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Terhubung Ke Konser</p>
          <p className="text-white text-2xl font-bold mt-2 font-mono tracking-tight">
            {loading ? "..." : posters.filter(p => p.event_id != null).length}
          </p>
          <p className="text-zinc-500 text-xs mt-1">Tautan langsung ke pembelian tiket</p>
        </div>
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Format Display Mobile</p>
          <p className="text-white text-2xl font-bold mt-2 font-mono tracking-tight">Rasio 3:4</p>
          <p className="text-zinc-500 text-xs mt-1">Optimal untuk display smartphone</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-[#0b0c0f] border border-zinc-800/80 rounded-lg px-3 py-2 w-full sm:w-80">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.75" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul poster, musisi, venue..."
            className="bg-transparent text-white text-xs outline-none placeholder:text-zinc-600 w-full"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#0b0c0f] border border-zinc-800/80 text-zinc-300 text-xs px-3 py-2 rounded-lg outline-none"
        >
          <option value="ALL" className="bg-zinc-900 text-white">Semua Status</option>
          <option value="ACTIVE" className="bg-zinc-900 text-white">Aktif (Live di HP)</option>
          <option value="INACTIVE" className="bg-zinc-900 text-white">Nonaktif (Draft)</option>
        </select>
      </div>

      {/* Poster Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <svg className="animate-spin h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-600">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 7h8M8 12h8M8 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Belum Ada Poster Iklan Festival</p>
            <p className="text-zinc-500 text-xs mt-1">
              Mulai upload poster promosi konser musik agar pelanggan di aplikasi mobile dapat melihat line-up resmi.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="mt-2 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
          >
            + Upload Poster Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((item) => {
            const imgSrc = getImageUrl(item.poster_url);
            const dateStr = item.event_date
              ? new Date(item.event_date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : item.event_date_db
              ? new Date(item.event_date_db).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "2026";

            return (
              <div
                key={item.id}
                className="bg-[#0b0c0f] border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl overflow-hidden flex flex-col group transition shadow-sm"
              >
                {/* Poster Vertical Preview */}
                <div
                  onClick={() => openPreview(item)}
                  className="relative cursor-pointer bg-black overflow-hidden flex items-center justify-center"
                  style={{ height: 260 }}
                >
                  <img
                    src={imgSrc}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="bg-red-600 text-white text-[9px] font-mono font-medium uppercase px-2 py-0.5 rounded shadow">
                      Line-up
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-medium px-2 py-0.5 rounded border ${
                      item.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${item.status === "ACTIVE" ? "bg-emerald-400" : "bg-zinc-500"}`} />
                      {item.status === "ACTIVE" ? "Live" : "Draft"}
                    </span>
                  </div>

                  {/* Overlay button */}
                  <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/80 text-white text-[10px] font-medium px-2.5 py-1 rounded-md border border-zinc-700 flex items-center gap-1">
                      Perbesar ↗
                    </span>
                  </div>
                </div>

                {/* Content details */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="text-white font-semibold text-xs leading-snug line-clamp-2">
                      {item.title}
                    </h3>

                    {item.event_name && (
                      <p className="text-red-400 text-xs font-medium mt-1 truncate">
                        {item.event_name}
                      </p>
                    )}

                    {item.artists_lineup && (
                      <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                        <span className="text-zinc-500">Musisi: </span>
                        {item.artists_lineup}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] mt-2 truncate">
                      <span>{dateStr} • {item.venue || item.event_venue_db || "Venue Konser"}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2.5 border-t border-zinc-800/60 flex items-center justify-between">
                    <button
                      onClick={() => openPreview(item)}
                      className="text-zinc-400 hover:text-white text-xs font-medium transition cursor-pointer"
                    >
                      Rincian
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition cursor-pointer"
                        title="Edit Poster"
                      >
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDelete(item)}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded-md hover:bg-red-950/20 transition cursor-pointer"
                        title="Hapus Poster"
                      >
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                          <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" />
                          <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modal === "create" || modal === "edit"}
        onClose={() => { setModal(null); resetForm(); }}
        title={modal === "create" ? "Upload Poster Iklan Festival" : "Edit Poster Iklan Festival"}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <PosterUploadBox
            preview={posterPreview}
            onFileChange={(f, p) => {
              setPosterFile(f);
              setPosterPreview(p);
            }}
            onClear={() => {
              setPosterFile(null);
              setPosterPreview("");
            }}
          />

          <FormField label="Hubungkan ke Event Konser (Opsional)">
            <select
              value={form.event_id}
              onChange={(e) => handleEventSelect(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60 transition-colors"
            >
              <option value="">Poster Mandiri (Tanpa Link Event Langsung)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.venue || "Venue"})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Judul / Headline Poster Iklan">
            <Input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Contoh: THE FULL LINE UP - HELLO CITY FESTIVAL 2026"
            />
          </FormField>

          <FormField label="Daftar Line-up Artis (Dipisahkan Koma)">
            <Textarea
              rows={2}
              value={form.artists_lineup}
              onChange={(e) => setForm((f) => ({ ...f, artists_lineup: e.target.value }))}
              placeholder="Contoh: Kahitna, Pamungkas, Reality Club, The Lantis, rumahsakit, Diskoria"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Lokasi / Venue">
              <Input
                value={form.venue}
                onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                placeholder="Contoh: Senayan Park, Jakarta"
              />
            </FormField>

            <FormField label="Tanggal Konser">
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Status Tampilan">
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
              className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60 transition-colors"
            >
              <option value="ACTIVE">Aktif (Tampil di Beranda Mobile)</option>
              <option value="INACTIVE">Nonaktif (Sembunyikan)</option>
            </select>
          </FormField>

          <SubmitButton loading={saving}>
            {modal === "create" ? "Terbitkan Poster Iklan" : "Simpan Perubahan"}
          </SubmitButton>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="Hapus Poster Iklan">
        <div className="flex flex-col gap-4">
          {selected?.poster_url && (
            <img
              src={getImageUrl(selected.poster_url)}
              alt="preview"
              className="w-full h-36 object-cover rounded-xl"
            />
          )}
          <p className="text-zinc-400 text-sm">
            Apakah Anda yakin ingin menghapus poster iklan <span className="text-white font-bold">{selected?.title}</span>?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setModal(null)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-2.5 rounded-lg transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition-all"
            >
              {saving ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Lightbox Modal */}
      <Modal open={modal === "preview"} onClose={() => setModal(null)} title="Detail Poster Iklan">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-zinc-800">
              <img
                src={getImageUrl(selected.poster_url)}
                alt={selected.title}
                className="max-h-96 object-contain"
              />
            </div>
            <div className="bg-zinc-800/80 rounded-xl p-4 flex flex-col gap-2">
              <h4 className="text-white font-bold text-base">{selected.title}</h4>
              {selected.artists_lineup && (
                <p className="text-zinc-300 text-xs">
                  <span className="text-zinc-500 font-semibold">Line-up: </span>
                  {selected.artists_lineup}
                </p>
              )}
              <div className="flex items-center gap-3 text-zinc-400 text-xs pt-2 border-t border-zinc-700/60 mt-1">
                <span>{selected.venue || "Senayan Park"}</span>
                <span>•</span>
                <span>{selected.event_date ? new Date(selected.event_date).toLocaleDateString("id-ID") : "2026"}</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setModal(null)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
