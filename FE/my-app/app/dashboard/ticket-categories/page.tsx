"use client";

import { useEffect, useState } from "react";
import { ticketCategoryApi, eventApi } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { FormField, Input, Textarea, SubmitButton } from "@/components/ui/input";

interface TicketCategory {
  id: number;
  name: string;
  description?: string;
  price?: number;
  quota?: number;
  available?: number;
  sold?: number;
  eventId?: number;
  isClosed?: boolean;
  closeSales?: boolean;
  color?: string;
  event?: { id: number; name: string };
}

interface Event { id: number; name: string }

const EMPTY: Omit<TicketCategory, "id"> = {
  name: "", description: "", price: 0, quota: 0,
  available: 0, eventId: undefined, isClosed: false, color: "#ef4444",
};

// Category color dots
const DOT_COLORS = ["#f59e0b", "#eab308", "#3b82f6", "#8b5cf6", "#ef4444", "#10b981", "#f97316"];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-red-600" : "bg-zinc-700"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-1"}`} />
      {checked && (
        <svg className="absolute right-1 w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default function TicketCategoriesPage() {
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | "ALL">("ALL");
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<TicketCategory | null>(null);
  const [form, setForm] = useState<Omit<TicketCategory, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [catRes, evRes] = await Promise.all([ticketCategoryApi.getAll(), eventApi.getAll()]);
    if (catRes.ok) setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.data ?? []);
    if (evRes.ok) {
      const evList: Event[] = Array.isArray(evRes.data) ? evRes.data : evRes.data?.data ?? [];
      setEvents(evList);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getEventName = (cat: TicketCategory) =>
    cat.event?.name ?? events.find(e => e.id === cat.eventId)?.name ?? "";

  const openCreate = () => {
    setForm({ ...EMPTY, eventId: selectedEventId !== "ALL" ? selectedEventId : undefined });
    setModal("create");
  };
  const openEdit = (c: TicketCategory) => {
    setSelected(c);
    setForm({
      name: c.name, description: c.description ?? "",
      price: c.price ?? 0, quota: c.quota ?? 0,
      available: c.available ?? 0, eventId: c.eventId,
      isClosed: c.isClosed ?? c.closeSales ?? false,
      color: c.color ?? "#ef4444",
    });
    setModal("edit");
  };
  const openDelete = (c: TicketCategory) => { setSelected(c); setModal("delete"); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, closeSales: form.isClosed };
    if (modal === "create") await ticketCategoryApi.create(payload as Record<string, unknown>);
    else if (modal === "edit" && selected) await ticketCategoryApi.update(selected.id, payload as Record<string, unknown>);
    setSaving(false);
    setModal(null);
    load();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    await ticketCategoryApi.remove(selected.id);
    setSaving(false);
    setModal(null);
    load();
  };

  const handleToggleClose = async (cat: TicketCategory) => {
    const newVal = !(cat.isClosed ?? cat.closeSales ?? false);
    await ticketCategoryApi.update(cat.id, { closeSales: newVal, isClosed: newVal });
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isClosed: newVal, closeSales: newVal } : c));
  };

  // Filter
  const filtered = categories.filter(c => {
    const matchEvent = selectedEventId === "ALL" || c.eventId === selectedEventId || c.event?.id === selectedEventId;
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase());
    return matchEvent && matchSearch;
  });

  // Stat calculations
  const statsBase = selectedEventId === "ALL" ? categories : filtered;
  const totalCapacity = statsBase.reduce((s, c) => s + (c.quota ?? 0), 0);
  const totalSold = statsBase.reduce((s, c) => s + (c.sold ?? Math.max(0, (c.quota ?? 0) - (c.available ?? c.quota ?? 0))), 0);
  const totalRevenue = statsBase.reduce((s, c) => {
    const sold = c.sold ?? Math.max(0, (c.quota ?? 0) - (c.available ?? c.quota ?? 0));
    return s + sold * (c.price ?? 0);
  }, 0);
  const allocPct = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  const selectedEventName = selectedEventId === "ALL"
    ? "All Events"
    : events.find(e => e.id === selectedEventId)?.name ?? "Unknown Event";

  const formatRevenue = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toLocaleString()}`;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">Ticket Categories</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-zinc-500 text-xs">Event:</span>
            <select
              value={selectedEventId}
              onChange={e => {
                const v = e.target.value;
                setSelectedEventId(v === "ALL" ? "ALL" : Number(v));
              }}
              className="bg-transparent text-red-400 text-xs font-medium outline-none cursor-pointer border-none"
            >
              <option value="ALL">All Events</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" className="text-red-400">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M15 3h6v6M10 14 21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all"
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          Add Category
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Capacity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start justify-between">
          <div>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-semibold">Total Capacity</p>
            <p className="text-white text-3xl font-bold mt-1">{loading ? "..." : totalCapacity.toLocaleString()}</p>
            <p className="text-emerald-400 text-xs mt-1 font-medium">{allocPct}% Allocated</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1.5a1.5 1.5 0 0 0 0 3V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1.5a1.5 1.5 0 0 0 0-3V9z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Tickets Sold */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start justify-between">
          <div>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-semibold">Tickets Sold</p>
            <p className="text-white text-3xl font-bold mt-1">{loading ? "..." : totalSold.toLocaleString()}</p>
            <p className="text-emerald-400 text-xs mt-1 font-medium">
              {totalCapacity > 0 ? `${Math.round((totalSold / totalCapacity) * 100)}% of capacity` : "No quota set"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Revenue Est */}
        <div className="relative bg-red-900 border border-red-800 rounded-xl p-5 overflow-hidden">
          {/* stripe pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "8px 8px",
            }}
          />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-red-300 text-[10px] uppercase tracking-widest font-semibold">Revenue Est.</p>
              <p className="text-white text-3xl font-bold mt-1">{loading ? "..." : formatRevenue(totalRevenue)}</p>
              <p className="text-red-300 text-xs mt-1 font-medium flex items-center gap-1">
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24"><path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Trending above target
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-800/60 flex items-center justify-center text-red-300">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 w-72">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..." className="bg-transparent text-white text-xs outline-none placeholder:text-zinc-600 w-full" />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 text-[10px] text-zinc-500 uppercase tracking-wider px-5 py-3 border-b border-zinc-800">
          <span className="col-span-3">Category Name</span>
          <span className="col-span-3">Event</span>
          <span className="col-span-1 text-right">Price</span>
          <span className="col-span-1 text-right">Total Quota</span>
          <span className="col-span-1 text-right">Available</span>
          <span className="col-span-1 text-center">Close Sales</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-zinc-700">
              <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1.5a1.5 1.5 0 0 0 0 3V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1.5a1.5 1.5 0 0 0 0-3V9z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <p className="text-zinc-500 text-sm">No categories found</p>
            <button onClick={openCreate} className="text-red-400 text-xs hover:text-red-300 transition-colors">+ Add one now</button>
          </div>
        ) : (
          filtered.map((cat, i) => {
            const isClosed = cat.isClosed ?? cat.closeSales ?? false;
            const available = cat.available ?? cat.quota ?? 0;
            const isSoldOut = available === 0;
            const colorDot = cat.color ?? DOT_COLORS[i % DOT_COLORS.length];

            return (
              <div key={cat.id} className={`grid grid-cols-12 items-center px-5 py-3.5 hover:bg-zinc-800/30 transition-colors group ${i < filtered.length - 1 ? "border-b border-zinc-800/50" : ""}`}>
                {/* Name + dot */}
                <div className="col-span-3 flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorDot }} />
                  <p className="text-white text-xs font-medium">{cat.name}</p>
                </div>

                {/* Event */}
                <div className="col-span-3">
                  <span className="text-zinc-400 text-xs">{getEventName(cat) || "—"}</span>
                </div>

                {/* Price */}
                <div className="col-span-1 text-right">
                  <span className="text-white text-xs font-semibold">
                    {cat.price != null ? `$${cat.price.toLocaleString("en", { minimumFractionDigits: 2 })}` : "—"}
                  </span>
                </div>

                {/* Quota */}
                <div className="col-span-1 text-right">
                  <span className="text-zinc-300 text-xs">{cat.quota?.toLocaleString() ?? "—"}</span>
                </div>

                {/* Available */}
                <div className="col-span-1 text-right">
                  {isSoldOut ? (
                    <span className="text-red-400 text-xs font-bold uppercase">Sold Out</span>
                  ) : (
                    <span className={`text-xs font-semibold ${available <= 20 ? "text-amber-400" : "text-zinc-300"}`}>
                      {available.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Toggle */}
                <div className="col-span-1 flex justify-center">
                  <Toggle
                    checked={isClosed}
                    onChange={() => handleToggleClose(cat)}
                  />
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)} className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-700" title="Edit">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                  <button onClick={() => openDelete(cat)} className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-900/20" title="Delete">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      {!loading && filtered.length > 0 && (
        <p className="text-zinc-600 text-xs">
          {filtered.length} categor{filtered.length === 1 ? "y" : "ies"} for <span className="text-zinc-400">{selectedEventName}</span>
        </p>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modal === "create" || modal === "edit"} onClose={() => setModal(null)} title={modal === "create" ? "Add Category" : "Edit Category"}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-medium">Category Color</label>
            <div className="flex items-center gap-2">
              {DOT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-6 h-6 rounded-full transition-all ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : "opacity-70 hover:opacity-100"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <FormField label="Category Name">
            <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. VIP, Regular, Early Bird" />
          </FormField>

          <FormField label="Event">
            <select
              value={form.eventId ?? ""}
              onChange={e => setForm(f => ({ ...f, eventId: e.target.value ? Number(e.target.value) : undefined }))}
              className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60 transition-colors"
            >
              <option value="">Select event...</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </FormField>

          <FormField label="Description">
            <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Category description" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Price ($)">
              <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="0.00" />
            </FormField>
            <FormField label="Total Quota">
              <Input type="number" value={form.quota} onChange={e => setForm(f => ({ ...f, quota: Number(e.target.value) }))} placeholder="0" />
            </FormField>
          </div>

          <FormField label="Available">
            <Input type="number" value={form.available} onChange={e => setForm(f => ({ ...f, available: Number(e.target.value) }))} placeholder="0" />
          </FormField>

          <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3">
            <div>
              <p className="text-white text-xs font-medium">Close Sales</p>
              <p className="text-zinc-500 text-[10px] mt-0.5">Prevent new ticket purchases for this category</p>
            </div>
            <Toggle checked={form.isClosed ?? false} onChange={v => setForm(f => ({ ...f, isClosed: v }))} />
          </div>

          <SubmitButton loading={saving}>{modal === "create" ? "Add Category" : "Save Changes"}</SubmitButton>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="Delete Category">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 bg-zinc-800 rounded-lg p-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selected?.color ?? "#ef4444" }} />
            <p className="text-white text-sm font-medium">{selected?.name}</p>
          </div>
          <p className="text-zinc-400 text-sm">Are you sure you want to delete this category? All associated ticket data will be affected. This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-2.5 rounded-lg transition-all">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition-all">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
