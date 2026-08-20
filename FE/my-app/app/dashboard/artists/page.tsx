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
  image?: string;
  photo?: string;
  eventCount?: number;
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
  const g = (genre ?? "").toLowerCase();
  if (g.includes("electronic") || g.includes("edm") || g.includes("techno") || g.includes("house") || g.includes("trance")) return "bg-blue-600";
  if (g.includes("rock") || g.includes("metal") || g.includes("punk") || g.includes("alternative")) return "bg-red-700";
  if (g.includes("hip") || g.includes("rap") || g.includes("r&b")) return "bg-amber-600";
  if (g.includes("jazz") || g.includes("blues") || g.includes("soul")) return "bg-indigo-600";
  if (g.includes("pop") || g.includes("k-pop") || g.includes("indie")) return "bg-pink-600";
  if (g.includes("classical") || g.includes("acoustic") || g.includes("folk")) return "bg-teal-600";
  return "bg-zinc-600";
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

  const getImg = (a: Artist) => getImageUrl(a.photo_url || a.image || a.photo);

  const resetForm = () => {
    setForm({ name: "", genre: "", bio: "", email: "", phone: "", status: "ACTIVE" });
    setPhotoFile(null);
    setPhotoPreview("");
  };

  const openCreate = () => { resetForm(); setModal("create"); };
  const openEdit = (a: Artist) => {
    setSelected(a);
    setForm({ name: a.name, genre: a.genre ?? "", bio: a.bio ?? "", email: a.email ?? "", phone: a.phone ?? "", status: a.status ?? "ACTIVE" });
    setPhotoFile(null);
    setPhotoPreview(getImg(a));
    setModal("edit");
  };
  const openDelete = (a: Artist) => { setSelected(a); setModal("delete"); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append("name", form.name);
    if (form.genre) fd.append("genre", form.genre);
    if (form.bio) fd.append("bio", form.bio);
    if (form.email) fd.append("email", form.email);
    if (form.phone) fd.append("phone", form.phone);
    fd.append("status", form.status);
    if (photoFile) {
      fd.append("photo", photoFile);
    } else if (modal === "edit" && selected) {
      // preserve existing photo
      const existingPath = selected.photo_url || selected.image || selected.photo || "";
      if (existingPath) fd.append("photo_url", existingPath);
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

  // All unique genres from existing artists
  const existingGenres = Array.from(new Set(artists.map(a => a.genre).filter(Boolean))) as string[];
  const genres = ["All Genres", ...existingGenres];

  let filtered = artists.filter(a => {
    const matchSearch = a.name?.toLowerCase().includes(search.toLowerCase()) || (a.genre ?? "").toLowerCase().includes(search.toLowerCase());
    const matchGenre = filterGenre === "All Genres" || a.genre === filterGenre;
    return matchSearch && matchGenre;
  });
  if (sortBy === "Name (A-Z)") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "Name (Z-A)") filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">Artist Management</h1>
          <p className="text-zinc-500 text-xs mt-1">Manage your roster, view analytics, and update profiles.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          Add New Artist
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 flex-1 min-w-48 max-w-64">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search artists..." className="bg-transparent text-white text-xs outline-none placeholder:text-zinc-600 w-full" />
        </div>
        <select value={filterGenre} onChange={e => { setFilterGenre(e.target.value); setPage(1); }} className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded-lg outline-none">
          {genres.map(g => <option key={g}>{g}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded-lg outline-none">
          {["Name (A-Z)", "Name (Z-A)"].map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg p-1">
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-zinc-600 text-white" : "text-zinc-500 hover:text-white"}`}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" /><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded transition-all ${viewMode === "list" ? "bg-zinc-600 text-white" : "text-zinc-500 hover:text-white"}`}>
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 text-[10px] text-zinc-500 uppercase tracking-wider px-5 py-3 border-b border-zinc-800">
            <span className="col-span-4">Artist</span><span className="col-span-2">Genre</span>
            <span className="col-span-3">Email</span><span className="col-span-1">Status</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>
          {paginated.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">No artists found</div>
          ) : paginated.map(a => (
            <div key={a.id} className="grid grid-cols-12 items-center px-5 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors last:border-0 group">
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700">
                  {getImg(a) ? <img src={getImg(a)} alt={a.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-bold">{a.name[0]}</div>}
                </div>
                <div><p className="text-white text-xs font-semibold">{a.name}</p><p className="text-zinc-600 text-[10px] line-clamp-1">{a.bio}</p></div>
              </div>
              <span className="col-span-2 text-zinc-400 text-xs">{a.genre ?? "—"}</span>
              <span className="col-span-3 text-zinc-400 text-xs truncate">{a.email ?? "—"}</span>
              <span className="col-span-1">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${(a.status ?? "ACTIVE").toUpperCase() === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"}`}>{a.status ?? "ACTIVE"}</span>
              </span>
              <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(a)} className="text-zinc-500 hover:text-white p-1.5 rounded hover:bg-zinc-700 transition-colors"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
                <button onClick={() => openDelete(a)} className="text-zinc-500 hover:text-red-400 p-1.5 rounded hover:bg-red-900/20 transition-colors"><svg width="12" height="12" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
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
  genreColor: (g?: string) => string; onEdit: () => void; onDelete: () => void;
}) {
  const img = getImg(artist);
  return (
    <div className="relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all duration-200 group cursor-default flex flex-col" style={{minHeight:280}}>
      <div className="relative flex-1" style={{minHeight:180}}>
        {img ? <img src={img} alt={artist.name} className="w-full h-full object-cover" style={{minHeight:180}} /> : (
          <div className="w-full flex items-center justify-center bg-zinc-800" style={{minHeight:180}}>
            <div className="flex flex-col items-center gap-2 text-zinc-600">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M2 21v-1a7 7 0 0 1 7-7h0a7 7 0 0 1 7 7v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <span className="text-xs">No photo</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button onClick={onEdit} className="bg-black/60 hover:bg-zinc-800 text-white p-1.5 rounded-lg transition-colors">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
          <button onClick={onDelete} className="bg-black/60 hover:bg-red-900/60 text-white hover:text-red-400 p-1.5 rounded-lg transition-colors">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-bold text-base leading-tight">{artist.name}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {artist.genre && <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${genreColor(artist.genre)} text-white`}>{artist.genre}</span>}
            <span className="text-zinc-400 text-[10px]">ID: ART-{String(artist.id).padStart(3,"0")}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-zinc-800 bg-zinc-900">
        <span className="text-zinc-500 text-[10px]">{artist.status ?? "ACTIVE"}</span>
        <button onClick={onEdit} className="text-red-400 hover:text-red-300 text-[10px] font-semibold uppercase tracking-wider transition-colors">Manage</button>
      </div>
    </div>
  );
}
