"use client";

import { useEffect, useState } from "react";
import { orderApi, paymentApi, getImageUrl } from "@/lib/api";
import { Modal } from "@/components/ui/modal";

interface Order {
  id: number;
  order_code?: string;
  status?: string;
  total_amount?: number;
  totalPrice?: number;
  promo_code?: string;
  seat_numbers?: string;
  discount_amount?: number;
  original_amount?: number;
  ordered_at?: string;
  created_at?: string;
  createdAt?: string;
  user_id?: number;
  customer_name?: string;
  event_name?: string;
  items?: { id: number; category_name: string; quantity: number; price: number; subtotal: number }[];
  payments?: { id: number; status: string; method: string; amount: number; proof_url?: string }[];
}

type PaymentStatus = "PAID" | "AWAITING_VERIFICATION" | "FAILED" | "PENDING" | string;

const PAGE_SIZE = 10;

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const s = (status ?? "").toUpperCase().replace(/\s+/g, "_");
  if (s === "PAID" || s === "COMPLETED" || s === "VERIFIED") return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-medium px-2 py-0.5 rounded">
      <span className="w-1 h-1 rounded-full bg-emerald-400" />
      Lunas
    </span>
  );
  if (s === "AWAITING_VERIFICATION" || s === "PENDING") return (
    <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-medium px-2 py-0.5 rounded">
      <span className="w-1 h-1 rounded-full bg-amber-400" />
      Menunggu
    </span>
  );
  if (s === "FAILED" || s === "CANCELLED" || s === "REJECTED") return (
    <span className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono font-medium px-2 py-0.5 rounded">
      <span className="w-1 h-1 rounded-full bg-red-400" />
      {s === "CANCELLED" ? "Batal" : "Ditolak"}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-mono font-medium px-2 py-0.5 rounded">
      <span className="w-1 h-1 rounded-full bg-zinc-500" />
      {status ?? "Unknown"}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
      <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-mono font-medium">{label}</p>
      <p className="text-white text-2xl font-bold mt-2 font-mono tracking-tight">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1 font-sans">{sub}</p>}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<"detail" | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    const res = await orderApi.getAll();
    if (res.ok) setOrders(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openDetail = async (o: Order) => {
    setSelected(o);
    setModal("detail");
    const detailRes = await orderApi.getById(o.id);
    if (detailRes.ok) setSelectedDetail(detailRes.data);
  };

  const handleVerifyPayment = async (paymentId: number, status: "verified" | "rejected") => {
    setSaving(true);
    await paymentApi.update(paymentId, { status });
    setSaving(false);
    setModal(null);
    load();
  };

  // Filter + search
  const filtered = orders.filter((o) => {
    const s = (o.status ?? "").toLowerCase();
    const matchStatus =
      filterStatus === "ALL" ||
      (filterStatus === "PENDING" && (s === "pending" || s === "awaiting_verification")) ||
      (filterStatus === "VERIFIED" && s === "verified") ||
      (filterStatus === "COMPLETED" && s === "completed") ||
      (filterStatus === "CANCELLED" && (s === "cancelled" || s === "failed" || s === "rejected"));

    const query = search.toLowerCase();
    const matchSearch =
      (o.order_code ?? "").toLowerCase().includes(query) ||
      (o.customer_name ?? "").toLowerCase().includes(query) ||
      (o.event_name ?? "").toLowerCase().includes(query) ||
      String(o.id).includes(query);

    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const totalRevenue = orders
    .filter((o) => (o.status ?? "").toLowerCase() === "verified" || (o.status ?? "").toLowerCase() === "completed")
    .reduce((s, o) => s + Number(o.total_amount ?? o.totalPrice ?? 0), 0);
  const pendingCount = orders.filter((o) => (o.status ?? "").toLowerCase() === "pending" || (o.status ?? "").toLowerCase() === "awaiting_verification").length;
  const verifiedCount = orders.filter((o) => {
    const s = (o.status ?? "").toLowerCase();
    return s === "verified" || s === "completed";
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-850">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Pesanan Tiket & Verifikasi</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Pantau dan verifikasi pembayaran tiket konser pelanggan mobile secara real-time.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 bg-[#0b0c0f] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium px-3.5 py-2 rounded-lg transition disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className={refreshing ? "animate-spin text-red-500" : ""}>
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Transaksi" value={loading ? "..." : orders.length.toLocaleString("id-ID")} sub="Seluruh pesanan tercatat" />
        <StatCard
          label="Menunggu Bayar"
          value={loading ? "..." : String(pendingCount)}
          sub="Perlu konfirmasi / upload"
        />
        <StatCard
          label="Tiket Lunas & Aktif"
          value={loading ? "..." : String(verifiedCount)}
          sub="E-Ticket QR aktif"
        />
        <StatCard
          label="Total Omset Penjualan"
          value={loading ? "..." : `Rp ${totalRevenue.toLocaleString("id-ID")}`}
          sub="Dari transaksi terverifikasi"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: "ALL", label: "Semua" },
            { key: "PENDING", label: "Menunggu" },
            { key: "VERIFIED", label: "Terverifikasi" },
            { key: "COMPLETED", label: "Selesai" },
            { key: "CANCELLED", label: "Dibatalkan" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setFilterStatus(key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                filterStatus === key
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
              }`}
            >
              {label}
              {key === "PENDING" && pendingCount > 0 && (
                <span className="ml-1.5 bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#0b0c0f] border border-zinc-800/80 rounded-lg px-3 py-2 w-full sm:w-72">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.75" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari kode order, customer..."
            className="bg-transparent text-white text-xs outline-none placeholder:text-zinc-600 w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-12 text-[10px] font-mono text-zinc-500 uppercase tracking-wider px-5 py-3 border-b border-zinc-800/80 bg-zinc-950/40">
          <span className="col-span-2 font-medium">Kode Order</span>
          <span className="col-span-3 font-medium">Pelanggan</span>
          <span className="col-span-3 font-medium">Konser</span>
          <span className="col-span-2 text-right font-medium">Total Nominal</span>
          <span className="col-span-1 text-center font-medium">Status</span>
          <span className="col-span-1 text-right font-medium">Aksi</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-zinc-400 text-sm font-medium">Tidak ada transaksi ditemukan</p>
            <p className="text-zinc-600 text-xs">Sesuaikan filter atau pencarian Anda</p>
          </div>
        ) : (
          paginated.map((o, i) => {
            const rawAmount = Number(o.total_amount ?? o.totalPrice ?? 0);
            const dateStr = o.ordered_at ?? o.created_at ?? o.createdAt;

            return (
              <div
                key={o.id}
                className={`grid grid-cols-12 items-center px-5 py-3.5 hover:bg-zinc-900/40 transition-colors ${
                  i < paginated.length - 1 ? "border-b border-zinc-800/50" : ""
                }`}
              >
                {/* Order ID */}
                <div className="col-span-2">
                  <button
                    onClick={() => openDetail(o)}
                    className="text-red-400 hover:text-red-300 text-xs font-mono font-medium tracking-wide transition text-left cursor-pointer"
                  >
                    {o.order_code ?? `#ORD-${String(o.id).padStart(4, "0")}`}
                  </button>
                  {dateStr && (
                    <p className="text-zinc-500 text-[10px] mt-0.5">
                      {new Date(dateStr).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                {/* Customer */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                      {(o.customer_name ?? "U").slice(0, 1)}
                    </div>
                    <span className="text-white text-xs font-medium truncate">
                      {o.customer_name ?? `User #${o.user_id}`}
                    </span>
                  </div>
                </div>

                {/* Event */}
                <div className="col-span-3">
                  <p className="text-zinc-300 text-xs truncate max-w-[200px]">{o.event_name ?? "—"}</p>
                </div>

                {/* Total */}
                <div className="col-span-2 text-right">
                  <p className="text-white text-xs font-mono font-medium">
                    Rp {rawAmount.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Status */}
                <div className="col-span-1 flex justify-center">
                  <PaymentBadge status={o.status ?? "pending"} />
                </div>

                {/* Action */}
                <div className="col-span-1 flex items-center justify-end">
                  <button
                    onClick={() => openDetail(o)}
                    className="text-zinc-400 hover:text-white text-xs font-medium px-2 py-1 rounded hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Detail
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/40">
            <p className="text-zinc-500 text-xs">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} pesanan
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Sebelumnya
              </button>
              <span className="text-zinc-400 text-xs px-2 font-mono">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={modal === "detail"}
        onClose={() => { setModal(null); setSelectedDetail(null); }}
        title={`Rincian Pesanan ${selected?.order_code ?? `#ORD-${selected?.id}`}`}
      >
        {selected && (
          <div className="flex flex-col gap-4">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Pelanggan", value: selectedDetail?.customer_name ?? selected.customer_name ?? `User #${selected.user_id}` },
                { label: "Konser", value: selectedDetail?.event_name ?? selected.event_name ?? "—" },
                {
                  label: "Tanggal Order",
                  value: selected.ordered_at
                    ? new Date(selected.ordered_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—",
                },
                {
                  label: "Total Bayar",
                  value: `Rp ${Number(selected.total_amount ?? 0).toLocaleString("id-ID")}`,
                },
                {
                  label: "Nomor Kursi",
                  value: selectedDetail?.seat_numbers || selected.seat_numbers || "General / Bebas",
                },
                {
                  label: "Voucher Diskon",
                  value: selectedDetail?.promo_code || selected.promo_code
                    ? `${selectedDetail?.promo_code || selected.promo_code} (-Rp ${Number(
                        selectedDetail?.discount_amount || selected.discount_amount || 0
                      ).toLocaleString("id-ID")})`
                    : "Tanpa Promo",
                },
              ].map(({ label, value }) => (
                <div key={label} className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-2.5">
                  <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider">{label}</p>
                  <p className="text-white text-xs font-medium mt-1 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Order status bar */}
            <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 flex items-center justify-between">
              <span className="text-zinc-400 text-xs">Status Pesanan Saat Ini</span>
              <PaymentBadge status={selected.status ?? "pending"} />
            </div>

            {/* Direct Admin Order Approval Actions */}
            {selected.status === "pending" && (
              <div className="flex gap-2">
                <button
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    await orderApi.updateStatus(selected.id, "verified");
                    setSaving(false);
                    setModal(null);
                    load();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition"
                >
                  ✓ Setujui & Terbitkan E-Ticket
                </button>
                <button
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    await orderApi.updateStatus(selected.id, "cancelled");
                    setSaving(false);
                    setModal(null);
                    load();
                  }}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-50 text-zinc-300 text-xs font-medium py-2 rounded-lg transition"
                >
                  ✕ Batalkan Pesanan
                </button>
              </div>
            )}

            {/* Items */}
            {selectedDetail?.items && selectedDetail.items.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Kategori Tiket Dipesan</p>
                <div className="space-y-1">
                  {selectedDetail.items.map((it) => (
                    <div
                      key={it.id}
                      className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="text-white font-medium">{it.category_name}</span>
                        <span className="text-zinc-500 text-[11px] ml-2 font-mono">x{it.quantity}</span>
                      </div>
                      <span className="text-zinc-300 font-mono">Rp {Number(it.subtotal).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments & Verification */}
            {selectedDetail?.payments && selectedDetail.payments.length > 0 && (
              <div className="space-y-2">
                <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Verifikasi Pembayaran</p>
                <div className="space-y-2">
                  {selectedDetail.payments.map((p) => (
                    <div
                      key={p.id}
                      className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-xs font-semibold uppercase">{p.method.replace("_", " ")}</p>
                          <p className="text-zinc-400 text-xs font-mono">
                            Rp {Number(p.amount).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <PaymentBadge status={p.status} />
                      </div>

                      {p.proof_url && (
                        <div>
                          <a
                            href={getImageUrl(p.proof_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-red-400 hover:text-red-300 text-xs font-medium inline-flex items-center gap-1"
                          >
                            Lihat Bukti Bayar ↗
                          </a>
                        </div>
                      )}

                      {p.status === "pending" && (
                        <div className="flex gap-2 pt-2 border-t border-zinc-800/60">
                          <button
                            disabled={saving}
                            onClick={() => handleVerifyPayment(p.id, "verified")}
                            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold py-1.5 rounded-lg transition"
                          >
                            Setujui Pembayaran
                          </button>
                          <button
                            disabled={saving}
                            onClick={() => handleVerifyPayment(p.id, "rejected")}
                            className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-50 text-zinc-300 text-xs font-medium py-1.5 rounded-lg transition"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
