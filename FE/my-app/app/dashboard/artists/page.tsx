"use client";

import { useEffect, useState, useRef } from "react";
import { artistApi, getImageUrl } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { FormField, Input, Textarea, SubmitButton } from "@/components/ui/input";

interface Artist {
  id: number;
  name: string;
  genre?: string;
  bio?: string;
  email?: string;
  phone?: string;
  status?: string;
  photo_url?: string;
}

// Predefined genres — admin can also type custom
const PRESET_GENRES = [
  "Electronic", "EDM", "Techno", "House", "Trance",
  "Rock", "Alternative Rock", "Metal", "Punk",
  "Pop", "K-Pop", "Indie Pop",
  "Hip-Hop", "Rap", "R&B",
  "Jazz", "Blues", "Soul",
  "Classical", "Acoustic", "Folk",
  "Reggae", "Latin", "World",
];

const PAGE_SIZE = 8;

const genreColor = (genre?: string) => {
  return "bg-zinc-800 border border-zinc-700/60 text-zinc-300";
};

// ── Image Upload with file ref ────────────────────────────
function ArtistImageUpload({
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
      <label className="text-zinc-400 text-xs font-medium">Artist Photo</label>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden ${dragging ? "border-red-500 bg-red-900/10" : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/50"}`}
        style={{ minHeight: 120 }}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="preview" className="w-full h-40 object-cover" />
            <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors">
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-2 px-3">
              <p className="text-white text-[10px]">Click to change photo</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-zinc-400">
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 21v-1a7 7 0 0 1 7-7h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 11l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-zinc-300 text-xs font-medium">Click or drag to upload photo</p>
              <p className="text-zinc-600 text-[10px] mt-0.5">PNG, JPG, WEBP up to 5MB</p>
            </div>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

// ── Genre Combobox ────────────────────────────────────────
function GenreCombobox({
  value,
  onChange,
  existingGenres,
}: {
  value: string;
  onChange: (v: string) => void;
  existingGenres: string[];
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Merge preset + genres from existing artists, deduplicated
  const allGenres = Array.from(new Set([...PRESET_GENRES, ...existingGenres])).sort();
  const filtered = allGenres.filter(g => g.toLowerCase().includes(input.toLowerCase()));

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        value={input}
        onChange={e => { setInput(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Electronic, Rock..."
        className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60 transition-colors placeholder:text-zinc-600"
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto">
          {filtered.map(g => (
            <button key={g} type="button"
              onMouseDown={() => { onChange(g); setInput(g); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 transition-colors ${value === g ? "text-red-400" : "text-zinc-300"}`}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${genreColor(g)}`} />
              {g}
            </button>
          ))}
          {input && !allGenres.includes(input) && (
            <button type="button"
              onMouseDown={() => { onChange(input); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-800 border-t border-zinc-800 transition-colors"
            >
              + Add &ldquo;{input}&rdquo; as custom genre
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Artist | null>(null);
  const [form, setForm] = useState({ name: "", genre: "", bio: "", email: "", phone: "", status: "ACTIVE" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState("All Genres");
  const [sortBy, setSortBy] = useState("Name (A-Z)");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const load = async () => {
    setLoading(true);
    const res = await artistApi.getAll();
    if (res.ok) setArtists(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getImg = (a: Artist) => getImageUrl(a.photo_url);

  const resetForm = () => {
    setForm({ name: "", genre: "", bio: "", email: "", phone: "", status: "ACTIVE" });
    setPhotoFile(null);
    setPhotoPreview("");
  };

  const openCreate = () => { resetForm(); setModal("create"); };
  const openEdit = (a: Artist) => {
    setSelected(a);
    setForm({
      name: a.name,
      genre: a.genre ?? "",
      bio: a.bio ?? "",
      email: a.email ?? "",
      phone: a.phone ?? "",
      status: a.status ?? "ACTIVE",
    });
    setPhotoFile(null);
    setPhotoPreview(getImg(a));
    setModal("edit");
  };
  const openDelete = (a: Artist) => { setSelected(a); setModal("delete"); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("genre", form.genre ?? "");
    fd.append("bio", form.bio ?? "");
    fd.append("email", form.email ?? "");
    fd.append("phone", form.phone ?? "");
    fd.append("status", form.status);

    if (photoFile) {
      fd.append("photo", photoFile);
    } else if (photoPreview) {
      fd.append("photo_url", selected?.photo_url || "");
    } else {
      fd.append("photo_url", "");
    }

    if (modal === "create") await artistApi.create(fd);
    else if (modal === "edit" && selected) await artistApi.update(selected.id, fd);

    setSaving(false);
    setModal(null);
    resetForm();
    load();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    await artistApi.remove(selected.id);
    setSaving(false);
    setModal(null);
    load();
  };

  // All unique genres merged with presets
  const existingGenres = Array.from(new Set(artists.map(a => a.genre).filter(Boolean))) as string[];
  const allAvailableGenres = Array.from(new Set([...PRESET_GENRES, ...existingGenres])).sort();
  const genres = ["All Genres", ...allAvailableGenres];

  let filtered = artists.filter(a => {
    const matchSearch = a.name?.toLowerCase().includes(search.toLowerCase()) || (a.bio ?? "").toLowerCase().includes(search.toLowerCase()) || (a.genre ?? "").toLowerCase().includes(search.toLowerCase());
    const matchGenre = filterGenre === "All Genres" || a.genre?.toLowerCase() === filterGenre.toLowerCase();
    return matchSearch && matchGenre;
  });
  if (sortBy === "Name (A-Z)") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "Name (Z-A)") filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-850">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Manajemen Artis & Musisi</h1>
          <p className="text-zinc-400 text-xs mt-1">Kelola profil musisi panggung, genre musik, dan informasi kontak resmi.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition active:scale-[0.99] self-start sm:self-auto cursor-pointer"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          <span>Tambah Artis Baru</span>
        </button>
      </div>

      {/* Summary Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-4 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Total Musisi</p>
          <p className="text-white text-2xl font-bold mt-1 font-mono">{loading ? "..." : artists.length}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Musisi terdaftar dalam roster</p>
        </div>
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-4 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Musisi Aktif</p>
          <p className="text-emerald-400 text-2xl font-bold mt-1 font-mono">
            {loading ? "..." : artists.filter(a => (a.status ?? "ACTIVE").toUpperCase() === "ACTIVE").length}
          </p>
          <p className="text-zinc-500 text-xs mt-0.5">Siap masuk line-up panggung</p>
        </div>
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-4 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Ragam Genre</p>
          <p className="text-white text-2xl font-bold mt-1 font-mono">{loading ? "..." : existingGenres.length || 8}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Kategori genre musik aktif</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-[#0b0c0f] border border-zinc-800/80 rounded-lg px-3 py-2 flex-1 min-w-48 max-w-72">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.75" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari artis, genre, bio..."
            className="bg-transparent text-white text-xs outline-none placeholder:text-zinc-600 w-full"
          />
        </div>
        <select
          value={filterGenre}
          onChange={(e) => { setFilterGenre(e.target.value); setPage(1); }}
          className="bg-[#0b0c0f] border border-zinc-800/80 text-zinc-300 text-xs px-3 py-2 rounded-lg outline-none"
        >
          {genres.map((g) => <option key={g} className="bg-zinc-900 text-white">{g}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#0b0c0f] border border-zinc-800/80 text-zinc-300 text-xs px-3 py-2 rounded-lg outline-none"
        >
          {["Name (A-Z)", "Name (Z-A)"].map((s) => <option key={s} className="bg-zinc-900 text-white">{s}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-1 bg-[#0b0c0f] border border-zinc-800/80 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded transition ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}
            title="Grid View"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded transition ${viewMode === "list" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}
            title="List View"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <svg className="animate-spin h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginated.map(artist => (
            <ArtistCard key={artist.id} artist={artist} getImg={getImg} genreColor={genreColor} onEdit={() => openEdit(artist)} onDelete={() => openDelete(artist)} />
          ))}
          <button onClick={openCreate} className="bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-red-600 rounded-xl flex flex-col items-center justify-center gap-3 p-6 transition-all group min-h-[280px]">
            <div className="w-14 h-14 rounded-xl bg-zinc-800 group-hover:bg-red-900/30 border border-zinc-700 group-hover:border-red-700 flex items-center justify-center transition-all">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-zinc-500 group-hover:text-red-400 transition-colors"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
            <div className="text-center">
              <p className="text-white text-sm font-semibold">Add Artist</p>
              <p className="text-zinc-500 text-[10px] mt-0.5">Create a new artist profile.</p>
            </div>
          </button>
        </div>
      ) : (
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/40">
            <span className="col-span-4 font-medium">Musisi</span>
            <span className="col-span-2 font-medium">Genre Musik</span>
            <span className="col-span-3 font-medium">Kontak Email</span>
            <span className="col-span-1 font-medium">Status</span>
            <span className="col-span-2 text-right font-medium">Aksi</span>
          </div>
          {paginated.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">Tidak ada artis ditemukan</div>
          ) : paginated.map(a => (
            <div key={a.id} className="grid grid-cols-12 items-center px-5 py-3 border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors last:border-0 group">
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700">
                  {getImg(a) ? <img src={getImg(a)} alt={a.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-red-500 text-xs font-bold">{a.name[0]}</div>}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold leading-tight">{a.name}</p>
                  <p className="text-zinc-500 text-[10px] line-clamp-1">{a.bio || "Musisi konser"}</p>
                </div>
              </div>
              <span className="col-span-2 text-zinc-400 text-xs">{a.genre ?? "—"}</span>
              <span className="col-span-3 text-zinc-400 text-xs font-mono truncate">{a.email ?? "—"}</span>
              <span className="col-span-1">
                <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-medium px-2 py-0.5 rounded border ${(a.status ?? "ACTIVE").toUpperCase() === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                  <span className={`w-1 h-1 rounded-full ${(a.status ?? "ACTIVE").toUpperCase() === "ACTIVE" ? "bg-emerald-400" : "bg-zinc-500"}`} />
                  {(a.status ?? "ACTIVE").toUpperCase() === "ACTIVE" ? "Aktif" : "Nonaktif"}
                </span>
              </span>
              <div className="col-span-2 flex justify-end gap-1">
                <button onClick={() => openEdit(a)} className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition cursor-pointer" title="Edit">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" /></svg>
                </button>
                <button onClick={() => openDelete(a)} className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-red-950/20 transition cursor-pointer" title="Hapus">
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><polyline points="3 6 5 6 21 6" strokeLinecap="round" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-zinc-500 text-xs">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} Artists</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-3 py-1 text-xs rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Prev</button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).reduce<(number|"...")[]>((acc,p,i,arr)=>{if(i>0&&p-(arr[i-1] as number)>1)acc.push("...");acc.push(p);return acc;},[]).map((p,i)=>p==="..."?<span key={`e${i}`} className="px-2 text-zinc-600 text-xs">…</span>:<button key={p} onClick={()=>setPage(p as number)} className={`w-7 h-7 text-xs rounded-lg transition-all ${page===p?"bg-red-700 text-white font-semibold":"bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700"}`}>{p}</button>)}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="px-3 py-1 text-xs rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next</button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modal === "create" || modal === "edit"} onClose={() => { setModal(null); resetForm(); }} title={modal === "create" ? "Add New Artist" : "Edit Artist"}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <ArtistImageUpload
            preview={photoPreview}
            onFileChange={(file, preview) => { setPhotoFile(file); setPhotoPreview(preview); }}
            onClear={() => { setPhotoFile(null); setPhotoPreview(""); }}
          />
          <FormField label="Artist Name">
            <Input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Artist / Band name" />
          </FormField>
          <FormField label="Genre">
            <GenreCombobox value={form.genre} onChange={v => setForm(f => ({...f, genre: v}))} existingGenres={existingGenres} />
          </FormField>
          <FormField label="Bio">
            <Textarea rows={3} value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} placeholder="Short artist bio" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email"><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="artist@email.com" /></FormField>
            <FormField label="Phone"><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+62..." /></FormField>
          </div>
          <FormField label="Status">
            <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60 transition-colors">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </FormField>
          <SubmitButton loading={saving}>{modal === "create" ? "Add Artist" : "Save Changes"}</SubmitButton>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="Delete Artist">
        <div className="flex flex-col gap-4">
          {selected && getImg(selected) && <img src={getImg(selected)} alt={selected.name} className="w-full h-32 object-cover rounded-lg" />}
          <p className="text-zinc-400 text-sm">Delete <span className="text-white font-semibold">{selected?.name}</span>? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-2.5 rounded-lg transition-all">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition-all">{saving ? "Deleting..." : "Delete"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ArtistCard({ artist, getImg, genreColor, onEdit, onDelete }: {
  artist: Artist; getImg: (a: Artist) => string;
  genreColor: (g?: string) => string;
  onEdit: () => void; onDelete: () => void;
}) {
  const img = getImg(artist);
  return (
    <div className="relative bg-[#0b0c0f] rounded-xl overflow-hidden border border-zinc-800/80 hover:border-zinc-700/80 transition group cursor-default flex flex-col shadow-sm" style={{minHeight:260}}>
      <div className="relative flex-1" style={{minHeight:170}}>
        {img ? <img src={img} alt={artist.name} className="w-full h-full object-cover group-hover:scale-102 transition duration-300" style={{minHeight:170}} /> : (
          <div className="w-full flex items-center justify-center bg-zinc-950" style={{minHeight:170}}>
            <div className="flex flex-col items-center gap-1.5 text-zinc-600">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M2 21v-1a7 7 0 0 1 7-7h0a7 7 0 0 1 7 7v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <span className="text-[11px]">Tanpa Foto</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
          <button onClick={onEdit} className="bg-black/70 hover:bg-zinc-800 text-white p-1.5 rounded-md transition cursor-pointer">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
          <button onClick={onDelete} className="bg-black/70 hover:bg-red-900/60 text-white hover:text-red-400 p-1.5 rounded-md transition cursor-pointer">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-3">
          <p className="text-white font-bold text-sm leading-tight truncate">{artist.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {artist.genre && <span className={`text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded ${genreColor(artist.genre)} text-white`}>{artist.genre}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/80 bg-[#0b0c0f]">
        <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-medium px-2 py-0.5 rounded border ${(artist.status ?? "ACTIVE").toUpperCase() === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
          <span className={`w-1 h-1 rounded-full ${(artist.status ?? "ACTIVE").toUpperCase() === "ACTIVE" ? "bg-emerald-400" : "bg-zinc-500"}`} />
          {(artist.status ?? "ACTIVE").toUpperCase() === "ACTIVE" ? "Aktif" : "Nonaktif"}
        </span>
        <button onClick={onEdit} className="text-zinc-400 hover:text-white text-xs font-medium transition cursor-pointer">Edit</button>
      </div>
    </div>
  );
}
