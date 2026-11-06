"use client";

import { useEffect, useState, useRef } from "react";
import { promoApi, eventApi, getImageUrl } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { FormField, Input, Textarea, SubmitButton, StatusBadge } from "@/components/ui/input";

interface Promo {
  id: number;
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  quota?: number;
  used_count?: number;
  event_id?: number;
  event_name?: string;
  event_poster_url?: string;
  banner_url?: string;
  is_active?: number;
  start_date?: string;
  end_date?: string;
}

interface Event { id: number; name: string }

const EMPTY_PROMO: Omit<Promo, "id"> = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  min_purchase: 0,
  max_discount: 0,
  quota: 100,
  is_active: 1,
};

function PromoBannerUpload({
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
          Banner Iklan / Gambar Pamflet (Tampil di Beranda Atas User)
        </label>
        <span className="text-[10px] text-zinc-500">Opsional — Rasio 16:9</span>
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
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
          dragging
            ? "border-red-500 bg-red-900/10"
            : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/50"
        }`}
        style={{ minHeight: 120 }}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="banner" className="w-full h-36 object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 transition-colors"
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent py-1.5 px-3">
              <p className="text-white text-[10px]">Klik untuk ganti banner pamflet iklan</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="text-zinc-400">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-zinc-300 text-xs font-medium">Klik atau geser foto pamflet promo konser</p>
              <p className="text-zinc-500 text-[10px] mt-0.5">PNG, JPG, WEBP hingga 5MB</p>
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

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Promo | null>(null);
  const [form, setForm] = useState(EMPTY_PROMO);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const load = async () => {
    setLoading(true);
    const [pRes, eRes] = await Promise.all([promoApi.getAll(), eventApi.getAll()]);
    if (pRes.ok) setPromos(Array.isArray(pRes.data) ? pRes.data : pRes.data?.data ?? []);
    if (eRes.ok) setEvents(Array.isArray(eRes.data) ? eRes.data : eRes.data?.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm(EMPTY_PROMO);
    setBannerFile(null);
    setBannerPreview("");
  };

  const openCreate = () => {
    resetForm();
    setModal("create");
  };

  const openEdit = (p: Promo) => {
    setSelected(p);
    setForm({
      code: p.code,
      description: p.description || "",
      discount_type: p.discount_type,
      discount_value: Number(p.discount_value),
      min_purchase: Number(p.min_purchase || 0),
      max_discount: Number(p.max_discount || 0),
      quota: Number(p.quota || 100),
      event_id: p.event_id,
      is_active: p.is_active ?? 1,
    });
    setBannerFile(null);
    setBannerPreview(p.banner_url ? getImageUrl(p.banner_url) : "");
    setModal("edit");
  };

  const openDelete = (p: Promo) => {
    setSelected(p);
    setModal("delete");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append("code", form.code.toUpperCase().trim());
    fd.append("description", form.description ?? "");
    fd.append("discount_type", form.discount_type);
    fd.append("discount_value", String(form.discount_value));
    fd.append("min_purchase", String(form.min_purchase || 0));
    fd.append("max_discount", form.max_discount ? String(form.max_discount) : "");
    fd.append("quota", String(form.quota || 100));
    fd.append("is_active", String(form.is_active ?? 1));
    fd.append("event_id", form.event_id ? String(form.event_id) : "");

    if (bannerFile) {
      fd.append("banner", bannerFile);
    } else if (bannerPreview) {
      fd.append("banner_url", selected?.banner_url || "");
    } else {
      fd.append("banner_url", "");
    }

    if (modal === "create") await promoApi.create(fd);
    else if (modal === "edit" && selected) await promoApi.update(selected.id, fd);

    setSaving(false);
    setModal(null);
    resetForm();
    load();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    await promoApi.remove(selected.id);
    setSaving(false);
    setModal(null);
    load();
  };

  // Instant prefix search from first letter
  const filtered = promos.filter((p) => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      p.code.toLowerCase().includes(s) ||
      (p.description || "").toLowerCase().includes(s) ||
      (p.event_name || "").toLowerCase().includes(s);

    const matchType =
      filterType === "ALL" ||
      (filterType === "ACTIVE" && p.is_active === 1) ||
      (filterType === "INACTIVE" && p.is_active === 0) ||
      (filterType === "PERCENTAGE" && p.discount_type === "percentage") ||
      (filterType === "FIXED" && p.discount_type === "fixed");

    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-850">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Voucher & Kode Diskon</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Kelola kode voucher dan promosi potongan harga untuk penjualan tiket.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition active:scale-[0.99] self-start sm:self-auto cursor-pointer"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          Buat Promo Baru
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Total Promo</p>
          <p className="text-white text-2xl font-bold mt-2 font-mono tracking-tight">{loading ? "..." : promos.length}</p>
          <p className="text-zinc-500 text-xs mt-1">{promos.filter(p => p.is_active === 1).length} aktif di aplikasi</p>
        </div>
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Total Penggunaan</p>
          <p className="text-white text-2xl font-bold mt-2 font-mono tracking-tight">
            {loading ? "..." : promos.reduce((s, p) => s + (p.used_count || 0), 0)}
          </p>
          <p className="text-zinc-500 text-xs mt-1">Klaim voucher berhasil</p>
        </div>
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-medium">Sisa Kuota Diskon</p>
          <p className="text-white text-2xl font-bold mt-2 font-mono tracking-tight">
            {loading ? "..." : promos.reduce((s, p) => s + Math.max(0, (p.quota || 0) - (p.used_count || 0)), 0)}
          </p>
          <p className="text-zinc-500 text-xs mt-1">Alokasi tiket tersisa</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-[#0b0c0f] border border-zinc-800/80 rounded-lg px-3 py-2 w-full sm:w-80">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.75" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ketik kode promo (misal: LOUDER)..."
            className="bg-transparent text-white text-xs outline-none placeholder:text-zinc-600 w-full"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-[#0b0c0f] border border-zinc-800/80 text-zinc-300 text-xs px-3 py-2 rounded-lg outline-none"
        >
          <option value="ALL" className="bg-zinc-900 text-white">Semua Status</option>
          <option value="ACTIVE" className="bg-zinc-900 text-white">Aktif Saja</option>
          <option value="INACTIVE" className="bg-zinc-900 text-white">Nonaktif</option>
          <option value="PERCENTAGE" className="bg-zinc-900 text-white">Diskon Persentase (%)</option>
          <option value="FIXED" className="bg-zinc-900 text-white">Diskon Nominal (Rp)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/40">
          <span className="col-span-2 font-medium">Kode Promo</span>
          <span className="col-span-3 font-medium">Banner & Konser</span>
          <span className="col-span-2 text-right font-medium">Potongan Diskon</span>
          <span className="col-span-2 text-right font-medium">Min. Beli & Max. Diskon</span>
          <span className="col-span-1 text-center font-medium">Kuota Terpakai</span>
          <span className="col-span-1 text-center font-medium">Status</span>
          <span className="col-span-1 text-right font-medium">Aksi</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-zinc-400 text-sm font-medium">Tidak ada voucher yang cocok</p>
            <p className="text-zinc-600 text-xs">Coba sesuaikan kata kunci pencarian atau tambah voucher baru.</p>
          </div>
        ) : (
          filtered.map((p, i) => {
            const quota = p.quota || 0;
            const used = p.used_count || 0;
            const remaining = Math.max(0, quota - used);

            return (
              <div
                key={p.id}
                className={`grid grid-cols-12 items-center px-5 py-3.5 hover:bg-zinc-900/40 transition-colors group ${
                  i < filtered.length - 1 ? "border-b border-zinc-800/50" : ""
                }`}
              >
                {/* Kode */}
                <div className="col-span-2">
                  <span className="bg-red-500/10 border border-red-500/20 text-red-400 font-mono font-medium text-xs px-2.5 py-1 rounded-md tracking-wider">
                    {p.code}
                  </span>
                </div>

                {/* Banner & Event */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-12 h-8 rounded-md bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.banner_url ? (
                      <img src={getImageUrl(p.banner_url)} alt={p.code} className="w-full h-full object-cover" />
                    ) : (
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-zinc-600">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{p.description || "Diskon Tiket"}</p>
                    <p className="text-zinc-500 text-[10px] truncate mt-0.5">
                      {p.event_name ? `Konser: ${p.event_name}` : "Semua Konser"}
                    </p>
                  </div>
                </div>

                {/* Potongan */}
                <div className="col-span-2 text-right">
                  <p className="text-white text-xs font-semibold font-mono">
                    {p.discount_type === "percentage" ? `${Number(p.discount_value)}%` : `Rp ${Number(p.discount_value).toLocaleString("id-ID")}`}
                  </p>
                  <span className="text-zinc-500 text-[10px] uppercase font-mono">{p.discount_type}</span>
                </div>

                {/* Syarat */}
                <div className="col-span-2 text-right text-xs">
                  <p className="text-zinc-300 font-mono text-[11px]">Min: Rp {Number(p.min_purchase || 0).toLocaleString("id-ID")}</p>
                  {p.max_discount ? (
                    <p className="text-zinc-500 font-mono text-[10px]">Maks: Rp {Number(p.max_discount).toLocaleString("id-ID")}</p>
                  ) : (
                    <p className="text-zinc-600 text-[10px]">Tanpa batas</p>
                  )}
                </div>

                {/* Kuota */}
                <div className="col-span-1 text-center font-mono">
                  <span className="text-white text-xs font-medium">{used}</span>
                  <span className="text-zinc-500 text-[10px]"> / {quota}</span>
                  {remaining === 0 && <p className="text-red-400 text-[9px] font-bold mt-0.5">Habis</p>}
                </div>

                {/* Status */}
                <div className="col-span-1 flex justify-center">
                  <StatusBadge status={p.is_active === 1 ? "ACTIVE" : "INACTIVE"} />
                </div>

                {/* Aksi */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-zinc-400 hover:text-white p-1.5 rounded-md hover:bg-zinc-800 transition cursor-pointer"
                    title="Edit Promo"
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openDelete(p)}
                    className="text-zinc-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-950/20 transition cursor-pointer"
                    title="Hapus Promo"
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
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
      <Modal open={modal === "create" || modal === "edit"} onClose={() => { setModal(null); resetForm(); }} title={modal === "create" ? "Buat Kode Promo Baru" : "Edit Kode Promo"}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Banner Upload */}
          <PromoBannerUpload
            preview={bannerPreview}
            onFileChange={(file, prev) => {
              setBannerFile(file);
              setBannerPreview(prev);
            }}
            onClear={() => {
              setBannerFile(null);
              setBannerPreview("");
            }}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Kode Promo (Voucher)">
              <Input
                required
                disabled={modal === "edit"}
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="CONTOH: KONSER50K"
                className="font-mono uppercase"
              />
            </FormField>

            <FormField label="Tipe Diskon">
              <select
                value={form.discount_type}
                onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as any }))}
                className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60"
              >
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label={form.discount_type === "percentage" ? "Nilai Diskon (%)" : "Nilai Diskon (Rp)"}>
              <Input
                type="number"
                required
                step="any"
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))}
                placeholder={form.discount_type === "percentage" ? "15" : "50000"}
              />
            </FormField>

            <FormField label="Maksimal Diskon (Rp) — Opsional">
              <Input
                type="number"
                value={form.max_discount || ""}
                onChange={(e) => setForm((f) => ({ ...f, max_discount: Number(e.target.value) }))}
                placeholder="Kosongkan jika tanpa batas"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Minimal Belanja (Rp)">
              <Input
                type="number"
                value={form.min_purchase}
                onChange={(e) => setForm((f) => ({ ...f, min_purchase: Number(e.target.value) }))}
                placeholder="0"
              />
            </FormField>

            <FormField label="Total Kuota Penggunaan">
              <Input
                type="number"
                required
                value={form.quota}
                onChange={(e) => setForm((f) => ({ ...f, quota: Number(e.target.value) }))}
                placeholder="100"
              />
            </FormField>
          </div>

          <FormField label="Berlaku Untuk Event (Opsional)">
            <select
              value={form.event_id || ""}
              onChange={(e) => setForm((f) => ({ ...f, event_id: e.target.value ? Number(e.target.value) : undefined }))}
              className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60"
            >
              <option value="">Semua Event Konser (Diskon Global)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Keterangan / Judul Promo">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Contoh: Diskon Grand Opening Pembelian Tiket Konser"
            />
          </FormField>

          <FormField label="Status Promo">
            <select
              value={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: Number(e.target.value) }))}
              className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60"
            >
              <option value={1}>Aktif (Bisa Diklaim)</option>
              <option value={0}>Nonaktif (Terkunci)</option>
            </select>
          </FormField>

          <SubmitButton loading={saving}>{modal === "create" ? "Terbitkan Promo" : "Simpan Perubahan"}</SubmitButton>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="Hapus Promo">
        <div className="flex flex-col gap-4">
          <p className="text-zinc-400 text-sm">
            Apakah Anda yakin ingin menghapus kode promo <span className="text-white font-bold">{selected?.code}</span>?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setModal(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold py-2.5 rounded-lg transition-all">
              Batal
            </button>
            <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition-all">
              {saving ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
