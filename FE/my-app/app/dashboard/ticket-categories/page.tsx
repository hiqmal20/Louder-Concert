"use client";

import { useEffect, useState } from "react";
import { ticketCategoryApi, eventApi } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { FormField, Input, SubmitButton } from "@/components/ui/input";

interface TicketCategory {
  id: number;
  name: string;
  price?: number;
  quota?: number;
  sold?: number;
  event_id?: number;
  event_name?: string;
  color?: string;
}

interface Event {
  id: number;
  name: string;
}

const EMPTY = {
  name: "",
  price: 0,
  quota: 0,
  event_id: 0,
};

const CATEGORY_PALETTE = [
  "#f59e0b", // Amber / VIP
  "#38bdf8", // Sky Blue / CAT 1
  "#10b981", // Emerald / Festival
  "#a855f7", // Violet / Presale
  "#ef4444", // Red / General
  "#fb923c", // Orange / Tribun
  "#06b6d4", // Cyan / Early Bird
  "#ec4899", // Pink
];

function getCategoryColor(name: string, index: number, customColor?: string) {
  if (customColor) return customColor;
  const n = (name ?? "").toLowerCase();
  if (n.includes("vip") || n.includes("vvip")) return "#f59e0b";
  if (n.includes("cat 1") || n.includes("platinum")) return "#10b981";
  if (n.includes("cat 2") || n.includes("gold")) return "#38bdf8";
  if (n.includes("cat 3") || n.includes("silver")) return "#818cf8";
  if (n.includes("festival") || n.includes("standing")) return "#ef4444";
  if (n.includes("early") || n.includes("presale")) return "#a855f7";
  if (n.includes("tribun") || n.includes("regular")) return "#fb923c";
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}

export default function TicketCategoriesPage() {
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | "ALL">("ALL");
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<TicketCategory | null>(null);
  const [form, setForm] = useState(EMPTY);
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

  useEffect(() => {
    load();
  }, []);

  const getEventName = (cat: TicketCategory) =>
    cat.event_name ?? events.find((e) => e.id === cat.event_id)?.name ?? "";

  const openCreate = () => {
    setForm({ ...EMPTY, event_id: selectedEventId !== "ALL" ? selectedEventId : (events[0]?.id ?? 0) });
    setModal("create");
  };

  const openEdit = (c: TicketCategory) => {
    setSelected(c);
    setForm({
      name: c.name,
      price: c.price ?? 0,
      quota: c.quota ?? 0,
      event_id: c.event_id ?? 0,
    });
    setModal("edit");
  };

  const openDelete = (c: TicketCategory) => {
    setSelected(c);
    setModal("delete");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (modal === "create") {
      await ticketCategoryApi.create({
        event_id: form.event_id,
        name: form.name.trim(),
        price: Number(form.price),
        quota: Number(form.quota),
      });
    } else if (modal === "edit" && selected) {
      await ticketCategoryApi.update(selected.id, {
        event_id: form.event_id,
        name: form.name.trim(),
        price: Number(form.price),
        quota: Number(form.quota),
      });
    }
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

  // Filter
  const filtered = categories.filter((c) => {
    const matchEvent = selectedEventId === "ALL" || c.event_id === selectedEventId;
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase());
    return matchEvent && matchSearch;
  });

  // Stat calculations
  const statsBase = selectedEventId === "ALL" ? categories : filtered;
  const totalCapacity = statsBase.reduce((s, c) => s + (c.quota ?? 0), 0);
  const totalSold = statsBase.reduce((s, c) => s + (c.sold ?? 0), 0);
  const totalRevenue = statsBase.reduce((s, c) => s + (c.sold ?? 0) * (c.price ?? 0), 0);
  const allocPct = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-850">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Kategori & Kuota Tiket</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Atur varian tiket (VIP, Regular, Festival), alokasi kuota kursi, dan penentuan harga per kategori.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition active:scale-[0.99] self-start sm:self-auto cursor-pointer"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Capacity */}
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Total Kuota Tiket</p>
            <span className="text-zinc-500">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1.5a1.5 1.5 0 0 0 0 3V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1.5a1.5 1.5 0 0 0 0-3V9z" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-white text-2xl font-bold font-mono tracking-tight">
              {loading ? "..." : totalCapacity.toLocaleString("id-ID")}
            </p>
            <p className="text-zinc-500 text-xs mt-1">{allocPct}% dari target rilis</p>
          </div>
        </div>

        {/* Tickets Sold */}
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Tiket Terjual</p>
            <span className="text-zinc-500">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-white text-2xl font-bold font-mono tracking-tight">
              {loading ? "..." : totalSold.toLocaleString("id-ID")}
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              {totalCapacity > 0 ? `${Math.round((totalSold / totalCapacity) * 100)}% dari kapasitas` : "Belum ada kuota"}
            </p>
          </div>
        </div>

        {/* Revenue Est */}
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Estimasi Omset</p>
            <span className="text-zinc-500">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-white text-2xl font-bold font-mono tracking-tight">
              {loading ? "..." : `Rp ${totalRevenue.toLocaleString("id-ID")}`}
            </p>
            <p className="text-zinc-500 text-xs mt-1">Akumulasi tiket terjual</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-[#0b0c0f] border border-zinc-800/80 rounded-lg px-3 py-2 w-full sm:w-72">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.75" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kategori tiket..."
            className="bg-transparent text-white text-xs outline-none placeholder:text-zinc-600 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-xs">Konser:</span>
          <select
            value={selectedEventId}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedEventId(v === "ALL" ? "ALL" : Number(v));
            }}
            className="bg-[#0b0c0f] border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-2 outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-zinc-900 text-white">Semua Konser</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id} className="bg-zinc-900 text-white">
                {ev.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/40">
          <span className="col-span-3 font-medium">Nama Kategori</span>
          <span className="col-span-3 font-medium">Konser Terkait</span>
          <span className="col-span-2 text-right font-medium">Harga Tiket</span>
          <span className="col-span-1 text-right font-medium">Total Kuota</span>
          <span className="col-span-1 text-right font-medium">Terjual</span>
          <span className="col-span-1 text-right font-medium">Sisa</span>
          <span className="col-span-1 text-right font-medium">Aksi</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-zinc-400 text-sm font-medium">Tidak ada kategori ditemukan</p>
            <button onClick={openCreate} className="text-red-400 text-xs hover:text-red-300 transition">
              + Tambah kategori baru
            </button>
          </div>
        ) : (
          filtered.map((cat, i) => {
            const quota = cat.quota ?? 0;
            const sold = cat.sold ?? 0;
            const remaining = Math.max(0, quota - sold);
            const isSoldOut = remaining === 0 && quota > 0;

            return (
              <div
                key={cat.id}
                className={`grid grid-cols-12 items-center px-5 py-3.5 hover:bg-zinc-900/40 transition-colors group ${
                  i < filtered.length - 1 ? "border-b border-zinc-800/50" : ""
                }`}
              >
                {/* Name */}
                <div className="col-span-3 flex items-center gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: getCategoryColor(cat.name, i, cat.color) }}
                  />
                  <p className="text-white text-xs font-semibold">{cat.name}</p>
                </div>

                {/* Event */}
                <div className="col-span-3">
                  <span className="text-zinc-400 text-xs truncate block max-w-[200px]">
                    {getEventName(cat) || "—"}
                  </span>
                </div>

                {/* Price */}
                <div className="col-span-2 text-right">
                  <span className="text-white text-xs font-mono font-medium">
                    {cat.price != null ? `Rp ${Number(cat.price).toLocaleString("id-ID")}` : "—"}
                  </span>
                </div>

                {/* Quota */}
                <div className="col-span-1 text-right">
                  <span className="text-zinc-300 text-xs font-mono">{quota.toLocaleString("id-ID")}</span>
                </div>

                {/* Sold */}
                <div className="col-span-1 text-right">
                  <span className="text-zinc-400 text-xs font-mono">{sold.toLocaleString("id-ID")}</span>
                </div>

                {/* Remaining */}
                <div className="col-span-1 text-right">
                  {isSoldOut ? (
                    <span className="text-red-400 text-[10px] font-mono font-medium uppercase">Habis</span>
                  ) : (
                    <span
                      className={`text-xs font-mono font-medium ${
                        remaining <= 20 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {remaining.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEdit(cat)}
                    className="text-zinc-400 hover:text-white p-1.5 rounded-md hover:bg-zinc-800 transition"
                    title="Edit Kategori"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openDelete(cat)}
                    className="text-zinc-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-950/20 transition"
                    title="Hapus Kategori"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" />
                      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modal === "create" || modal === "edit"}
        onClose={() => setModal(null)}
        title={modal === "create" ? "Tambah Kategori Tiket" : "Edit Kategori Tiket"}
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <FormField label="Nama Kategori">
            <div className="relative flex items-center">
              <span
                className="absolute left-3 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-colors duration-200"
                style={{ backgroundColor: getCategoryColor(form.name, 0) }}
              />
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Contoh: VIP, CAT 1, Festival A"
                className="pl-8 w-full"
              />
            </div>
          </FormField>

          <FormField label="Pilih Konser Terkait">
            <select
              required
              value={form.event_id || ""}
              onChange={(e) => setForm((f) => ({ ...f, event_id: Number(e.target.value) }))}
              className="bg-zinc-950 border border-zinc-800 text-white text-xs px-3 py-2 rounded-md outline-none focus:border-red-600 transition"
            >
              <option value="" disabled>
                Pilih Jadwal Konser
              </option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-zinc-900 text-white">
                  {ev.name}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Harga Tiket (Rp)">
              <Input
                type="number"
                min="0"
                step="1000"
                required
                value={form.price || ""}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                placeholder="Contoh: 750000"
              />
            </FormField>

            <FormField label="Total Kuota Kursi">
              <Input
                type="number"
                min="1"
                required
                value={form.quota || ""}
                onChange={(e) => setForm((f) => ({ ...f, quota: Number(e.target.value) }))}
                placeholder="Contoh: 500"
              />
            </FormField>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium py-2 rounded-lg transition"
            >
              Batal
            </button>
            <div className="flex-1">
              <SubmitButton loading={saving}>
                {modal === "create" ? "Buat Kategori" : "Simpan Perubahan"}
              </SubmitButton>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="Hapus Kategori Tiket">
        <div className="space-y-4">
          <p className="text-zinc-400 text-xs leading-relaxed">
            Apakah Anda yakin ingin menghapus kategori tiket{" "}
            <strong className="text-white">&ldquo;{selected?.name}&rdquo;</strong>? Tindakan ini tidak dapat
            dibatalkan jika tiket belum terjual.
          </p>
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => setModal(null)}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium py-2 rounded-lg transition"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-medium py-2 rounded-lg transition"
            >
              {saving ? "Menghapus..." : "Hapus Kategori"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
