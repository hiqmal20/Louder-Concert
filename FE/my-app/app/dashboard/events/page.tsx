"use client";

import { useEffect, useState, useRef } from "react";
import { eventApi, artistApi, getImageUrl } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { FormField, Input, Textarea, SubmitButton, StatusBadge } from "@/components/ui/input";
import Link from "next/link";

interface Artist { id: number; name: string }
interface Event {
  id: number; name: string; description?: string;
  event_date?: string; date?: string;
  event_time?: string;
  location?: string; venue?: string; status?: string;
  capacity?: number; ticketsSold?: number;
  poster_url?: string; image?: string;
  artist_ids?: number[];
  artists?: { id: number; name: string }[] | string; // getAll = string, getOne = array
  artist?: { id: number; name: string };
}

const PAGE_SIZE = 8;

function PosterUpload({ preview, onFileChange, onClear }: {
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
      <label className="text-zinc-400 text-xs font-medium">Event Poster</label>
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
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-2 px-3">
              <p className="text-white text-[10px]">Click to change poster</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-zinc-400"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
            <div>
              <p className="text-zinc-300 text-xs font-medium">Click or drag poster image</p>
              <p className="text-zinc-600 text-[10px] mt-0.5">PNG, JPG, WEBP up to 5MB</p>
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
    venue: "", status: "ACTIVE", capacity: 0, artistIds: [] as number[],
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);

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
    setForm({ name: "", description: "", event_date: "", event_time: "", venue: "", status: "ACTIVE", capacity: 0, artistIds: [] });
    setPosterFile(null); setPosterPreview("");
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
    setForm({
      name: ev.name, description: ev.description ?? "",
      event_date: ev.event_date ?? ev.date ?? "",
      event_time: ev.event_time ?? "",
      venue: ev.venue ?? ev.location ?? "",
      status: ev.status ?? "ACTIVE",
      capacity: ev.capacity ?? 0,
      artistIds,
    });
    setPosterFile(null); setPosterPreview(getPoster(ev));
    setModal("edit");
  };
  const openDelete = (ev: Event) => { setSelected(normalizeEvent(ev)); setModal("delete"); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("name", form.name);
    if (form.description) fd.append("description", form.description);
    fd.append("event_date", form.event_date);
    if (form.event_time) fd.append("event_time", form.event_time);
    fd.append("venue", form.venue);
    fd.append("status", form.status);
    if (form.capacity) fd.append("capacity", String(form.capacity));
    // artist_ids as JSON array string
    if (form.artistIds.length > 0) fd.append("artist_ids", JSON.stringify(form.artistIds));
    if (posterFile) {
      fd.append("poster", posterFile);
    } else if (modal === "edit" && selected?.poster_url) {
      fd.append("poster_url", selected.poster_url);
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
    const matchStatus = filterStatus === "ALL" || e.status?.toUpperCase() === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">Event Management</h1>
          <p className="text-zinc-500 text-xs mt-1">Manage and track all upcoming and past concerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowFilter(v => !v)} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium px-3 py-2 rounded-lg transition-all">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              Filter {filterStatus !== "ALL" && <span className="text-red-400">({filterStatus})</span>}
            </button>
            {showFilter && (
              <div className="absolute right-0 top-10 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20 p-3 flex flex-col gap-1 w-36">
                {["ALL", "ACTIVE", "INACTIVE", "CLOSED"].map(s => (
                  <button key={s} onClick={() => { setFilterStatus(s); setShowFilter(false); setPage(1); }}
                    className={`text-left px-3 py-1.5 rounded-lg text-xs transition-all ${filterStatus === s ? "bg-red-700 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Create Event
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 w-80">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" /><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="bg-transparent text-white text-xs outline-none placeholder:text-zinc-600 w-full" />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 text-[10px] text-zinc-500 uppercase tracking-wider px-5 py-3 border-b border-zinc-800">
          <span className="col-span-3">Event Name</span>
          <span className="col-span-2">Artist</span>
          <span className="col-span-2">Date</span>
          <span className="col-span-2">Venue</span>
          <span className="col-span-1 text-center">Capacity</span>
          <span className="col-span-1 text-center">Status</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-zinc-500 text-sm">No events found</p>
            <p className="text-zinc-600 text-xs">Try adjusting your search or filter</p>
          </div>
        ) : paginated.map((ev, i) => (
          <div key={ev.id} className={`grid grid-cols-12 items-center px-5 py-3.5 hover:bg-zinc-800/40 transition-colors group ${i < paginated.length - 1 ? "border-b border-zinc-800/50" : ""}`}>
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                {getPoster(ev) ? <img src={getPoster(ev)} alt={ev.name} className="w-full h-full object-cover" /> : (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-zinc-600"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{ev.name}</p>
                {ev.description && <p className="text-zinc-600 text-[10px] mt-0.5 line-clamp-1">{ev.description}</p>}
              </div>
            </div>
            <span className="col-span-2 text-zinc-400 text-xs truncate">{getArtistName(ev)}</span>
            <span className="col-span-2 text-zinc-400 text-xs">{getEventDate(ev) ? new Date(getEventDate(ev)).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
            <span className="col-span-2 text-zinc-400 text-xs truncate">{ev.venue ?? ev.location ?? "—"}</span>
            <div className="col-span-1 text-center"><span className="text-zinc-300 text-xs">{ev.capacity?.toLocaleString() ?? "—"}</span></div>
            <div className="col-span-1 flex justify-center"><StatusBadge status={ev.status ?? "ACTIVE"} /></div>
            <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(ev)} className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-700 transition-colors">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
              <button onClick={() => openDelete(ev)} className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-900/20 transition-colors">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
          </div>
        ))}

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800">
            <p className="text-zinc-500 text-xs">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} entries</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="px-3 py-1 text-xs rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Previous</button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).reduce<(number|"...")[]>((acc,p,i,arr)=>{if(i>0&&p-(arr[i-1] as number)>1)acc.push("...");acc.push(p);return acc;},[]).map((p,i)=>p==="..."?<span key={`e${i}`} className="px-2 text-zinc-600 text-xs">…</span>:<button key={p} onClick={()=>setPage(p as number)} className={`w-7 h-7 text-xs rounded-lg transition-all ${page===p?"bg-red-700 text-white":"bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700"}`}>{p}</button>)}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-3 py-1 text-xs rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modal === "create" || modal === "edit"} onClose={() => { setModal(null); resetForm(); }} title={modal === "create" ? "Create Event" : "Edit Event"}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <PosterUpload preview={posterPreview} onFileChange={(f,p)=>{setPosterFile(f);setPosterPreview(p);}} onClear={()=>{setPosterFile(null);setPosterPreview("");}} />
          <FormField label="Event Name"><Input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Event name" /></FormField>

          {/* Artist multi-select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-medium">Artists</label>
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 max-h-36 overflow-y-auto flex flex-col gap-1">
              {artists.length === 0 ? (
                <p className="text-zinc-600 text-xs text-center py-2">No artists available. <Link href="/dashboard/artists" className="text-red-400">Add artists first.</Link></p>
              ) : artists.map(a => (
                <label key={a.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-zinc-700 cursor-pointer transition-colors">
                  <input type="checkbox" checked={form.artistIds.includes(a.id)} onChange={() => toggleArtist(a.id)} className="accent-red-600 w-3.5 h-3.5" />
                  <span className="text-zinc-300 text-xs">{a.name}</span>
                </label>
              ))}
            </div>
            {form.artistIds.length > 0 && <p className="text-zinc-500 text-[10px]">{form.artistIds.length} artist{form.artistIds.length>1?"s":""} selected</p>}
          </div>

          <FormField label="Description"><Textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Event description" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date"><Input required type="date" value={form.event_date} onChange={e=>setForm(f=>({...f,event_date:e.target.value}))} /></FormField>
            <FormField label="Time"><Input type="time" value={form.event_time} onChange={e=>setForm(f=>({...f,event_time:e.target.value}))} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Venue / Location"><Input required value={form.venue} onChange={e=>setForm(f=>({...f,venue:e.target.value}))} placeholder="Venue, City" /></FormField>
            <FormField label="Capacity"><Input type="number" value={form.capacity||""} onChange={e=>setForm(f=>({...f,capacity:Number(e.target.value)}))} placeholder="Max attendees" /></FormField>
          </div>
          <FormField label="Status">
            <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60 transition-colors">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="CLOSED">Closed</option>
            </select>
          </FormField>
          <SubmitButton loading={saving}>{modal === "create" ? "Create Event" : "Save Changes"}</SubmitButton>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="Delete Event">
        <div className="flex flex-col gap-4">
          {selected && getPoster(selected) && <img src={getPoster(selected)} alt={selected.name} className="w-full h-28 object-cover rounded-lg" />}
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
