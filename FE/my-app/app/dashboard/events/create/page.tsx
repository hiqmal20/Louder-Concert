"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { eventApi, artistApi } from "@/lib/api";
import { FormField, Input, Textarea, SubmitButton } from "@/components/ui/input";
import Link from "next/link";

interface Artist { id: number; name: string }

export default function CreateEventPage() {
  const router = useRouter();
  const posterRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "", description: "", event_date: "", event_time: "",
    venue: "", capacity: "", status: "ACTIVE",
  });
  const [artistIds, setArtistIds] = useState<number[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    artistApi.getAll().then(res => {
      if (res.ok) setArtists(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    });
  }, []);

  const handlePoster = (file: File) => {
    setPosterFile(file);
    const reader = new FileReader();
    reader.onload = e => setPosterPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleArtist = (id: number) => {
    setArtistIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const fd = new FormData();
    fd.append("name", form.name);
    if (form.description) fd.append("description", form.description);
    fd.append("event_date", form.event_date);
    if (form.event_time) fd.append("event_time", form.event_time);
    fd.append("venue", form.venue);
    fd.append("status", form.status);
    if (form.capacity) fd.append("capacity", form.capacity);
    if (artistIds.length > 0) fd.append("artist_ids", JSON.stringify(artistIds));
    if (posterFile) fd.append("poster", posterFile);

    const res = await eventApi.create(fd);
    setSaving(false);
    if (res.ok) router.push("/dashboard/events");
    else setError(res.data?.message ?? "Failed to create event.");
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-white transition-colors">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div>
          <h1 className="text-white font-bold text-2xl">Create Event</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Fill in the details below</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        {error && <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-2.5 text-red-400 text-xs mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Poster upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-medium">Event Poster</label>
            <div
              onClick={() => posterRef.current?.click()}
              className="relative cursor-pointer rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-800/50 transition-all overflow-hidden"
              style={{ minHeight: 110 }}
            >
              {posterPreview ? (
                <div className="relative">
                  <img src={posterPreview} alt="poster" className="w-full h-36 object-cover" />
                  <button type="button" onClick={e => { e.stopPropagation(); setPosterFile(null); setPosterPreview(""); }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5">
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-2 px-3">
                    <p className="text-white text-[10px]">Click to change poster</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-zinc-400"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" /><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </div>
                  <p className="text-zinc-300 text-xs font-medium">Click to upload poster</p>
                  <p className="text-zinc-600 text-[10px]">PNG, JPG, WEBP up to 5MB</p>
                </div>
              )}
            </div>
            <input ref={posterRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePoster(f); }} />
          </div>

          <FormField label="Event Name"><Input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Event name" /></FormField>

          {/* Artists multi-select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-medium">Artists</label>
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 max-h-40 overflow-y-auto flex flex-col gap-0.5">
              {artists.length === 0 ? (
                <p className="text-zinc-600 text-xs text-center py-3">No artists yet. <Link href="/dashboard/artists" className="text-red-400 hover:text-red-300">Add artists first.</Link></p>
              ) : artists.map(a => (
                <label key={a.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-zinc-700 cursor-pointer transition-colors">
                  <input type="checkbox" checked={artistIds.includes(a.id)} onChange={() => toggleArtist(a.id)} className="accent-red-600 w-3.5 h-3.5" />
                  <span className="text-zinc-300 text-xs">{a.name}</span>
                </label>
              ))}
            </div>
            {artistIds.length > 0 && <p className="text-zinc-500 text-[10px]">{artistIds.length} artist{artistIds.length > 1 ? "s" : ""} selected</p>}
          </div>

          <FormField label="Description"><Textarea rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Event description" /></FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date"><Input required type="date" value={form.event_date} onChange={e => setForm(f => ({...f, event_date: e.target.value}))} /></FormField>
            <FormField label="Time"><Input type="time" value={form.event_time} onChange={e => setForm(f => ({...f, event_time: e.target.value}))} /></FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Venue / Location"><Input required value={form.venue} onChange={e => setForm(f => ({...f, venue: e.target.value}))} placeholder="Venue name, City" /></FormField>
            <FormField label="Capacity"><Input type="number" value={form.capacity} onChange={e => setForm(f => ({...f, capacity: e.target.value}))} placeholder="Max attendees" /></FormField>
          </div>

          <FormField label="Status">
            <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60 transition-colors">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="CLOSED">Closed</option>
            </select>
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-2.5 rounded-lg transition-all">Cancel</button>
            <div className="flex-1"><SubmitButton loading={saving}>Create Event</SubmitButton></div>
          </div>
        </form>
      </div>
    </div>
  );
}
