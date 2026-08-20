"use client";

import { useEffect, useState } from "react";
import { orderApi, paymentApi } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { FormField, SubmitButton } from "@/components/ui/input";

interface Order {
  id: number;
  status?: string;
  totalPrice?: number;
  createdAt?: string;
  userId?: number;
  eventId?: number;
  user?: { id: number; name: string; email: string };
  event?: { id: number; name: string };
  payment?: { id: number; status: string; method?: string; paidAt?: string };
  tickets?: { id: number; category?: { name: string } }[];
}

type PaymentStatus = "PAID" | "AWAITING_VERIFICATION" | "FAILED" | "PENDING" | string;

const PAGE_SIZE = 10;

// ── Payment Status Badge ──────────────────────────────────
function PaymentBadge({ status }: { status: PaymentStatus }) {
  const s = (status ?? "").toUpperCase().replace(/\s+/g, "_");
  if (s === "PAID") return (
    <span className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-medium px-2.5 py-1 rounded-full">
      <svg width="10" height="10" fill="none" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Paid
    </span>
  );
  if (s === "AWAITING_VERIFICATION" || s === "PENDING") return (
    <span className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-medium px-2.5 py-1 rounded-full">
      <svg width="10" height="10" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      Awaiting Verification
    </span>
  );
  if (s === "FAILED" || s === "CANCELLED") return (
    <span className="inline-flex items-center gap-1.5 bg-red-900/20 border border-red-700/40 text-red-400 text-[10px] font-medium px-2.5 py-1 rounded-full">
      <svg width="10" height="10" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      {s === "CANCELLED" ? "Cancelled" : "Failed"}
    </span>
  );
  if (s === "COMPLETED") return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-900/20 border border-emerald-700/40 text-emerald-400 text-[10px] font-medium px-2.5 py-1 rounded-full">
      <svg width="10" height="10" fill="none" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Completed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-medium px-2.5 py-1 rounded-full">
      {status ?? "Unknown"}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, sub, color = "text-white" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
      <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-semibold">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-zinc-500 text-[10px] mt-1">{sub}</p>}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<"detail" | "verify" | "delete" | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("COMPLETED");
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

  useEffect(() => { load(); }, []);

  const getPaymentStatus = (o: Order | null): PaymentStatus => {
    if (!o) return "PENDING";
    if (o.payment?.status) return o.payment.status;
    if (o.status) return o.status;
    return "PENDING";
  };

  const needsVerification = (o: Order | null) => {
    if (!o) return false;
    const s = getPaymentStatus(o).toUpperCase().replace(/\s+/g, "_");
    return s === "AWAITING_VERIFICATION" || s === "PENDING";
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    await orderApi.update(selected.id, { status: newStatus });
    if (selected.payment?.id) {
      await paymentApi.update(selected.payment.id, { status: newStatus });
    }
    setSaving(false);
    setModal(null);
    load();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    await orderApi.remove(selected.id);
    setSaving(false);
    setModal(null);
    load();
  };

  // Filter + search
  const filtered = orders.filter(o => {
    const ps = getPaymentStatus(o).toUpperCase().replace(/\s+/g, "_");
    const matchStatus =
      filterStatus === "ALL" ||
      (filterStatus === "AWAITING" && (ps === "AWAITING_VERIFICATION" || ps === "PENDING")) ||
      (filterStatus === "PAID" && ps === "PAID") ||
      (filterStatus === "COMPLETED" && ps === "COMPLETED") ||
      (filterStatus === "FAILED" && (ps === "FAILED" || ps === "CANCELLED"));
    const matchSearch =
      String(o.id).includes(search) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.event?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice ?? 0), 0);
  const pendingCount = orders.filter(o => needsVerification(o)).length;
  const paidCount = orders.filter(o => {
    const s = getPaymentStatus(o).toUpperCase();
    return s === "PAID" || s === "COMPLETED";
  }).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">Order Management</h1>
          <p className="text-zinc-500 text-xs mt-1">Review recent transactions and verify pending payments.</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50"
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" className={refreshing ? "animate-spin" : ""}>
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={loading ? "..." : orders.length.toLocaleString()} sub="all time" />
        <StatCard
          label="Awaiting Verification"
          value={loading ? "..." : String(pendingCount)}
          sub="needs action"
          color={pendingCount > 0 ? "text-amber-400" : "text-white"}
        />
        <StatCard
          label="Paid / Completed"
          value={loading ? "..." : String(paidCount)}
          sub="confirmed"
          color="text-emerald-400"
        />
        <StatCard
          label="Total Revenue"
          value={loading ? "..." : `$${totalRevenue.toLocaleString("en", { minimumFractionDigits: 2 })}`}
          sub="from all orders"
          color="text-red-400"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 flex-1 min-w-48 max-w-72">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search orders..."
            className="bg-transparent text-white text-xs outline-none placeholder:text-zinc-600 w-full"
          />
        </div>

        {/* Status filter */}
        {[
          { key: "ALL", label: "All" },
          { key: "AWAITING", label: "Awaiting" },
          { key: "PAID", label: "Paid" },
          { key: "COMPLETED", label: "Completed" },
          { key: "FAILED", label: "Failed" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setFilterStatus(key); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === key ? "bg-red-700 text-white" : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white"}`}
          >
            {label}
            {key === "AWAITING" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 text-[10px] text-zinc-500 uppercase tracking-wider px-5 py-3 border-b border-zinc-800">
          <span className="col-span-2">Order ID</span>
          <span className="col-span-2">Customer Name</span>
          <span className="col-span-3">Event</span>
          <span className="col-span-1 text-right">Total Paid</span>
          <span className="col-span-2 text-center">Payment Status</span>
          <span className="col-span-2 text-right">Action</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-zinc-500 text-xs">Loading orders...</span>
            </div>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-zinc-700">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <p className="text-zinc-500 text-sm">No orders found</p>
            <p className="text-zinc-600 text-xs">Try adjusting your search or filter</p>
          </div>
        ) : (
          paginated.map((o, i) => {
            const ps = getPaymentStatus(o);
            const verify = needsVerification(o);

            return (
              <div
                key={o.id}
                className={`grid grid-cols-12 items-center px-5 py-4 hover:bg-zinc-800/30 transition-colors ${i < paginated.length - 1 ? "border-b border-zinc-800/50" : ""}`}
              >
                {/* Order ID */}
                <div className="col-span-2">
                  <button
                    onClick={() => { setSelected(o); setModal("detail"); }}
                    className="text-red-400 hover:text-red-300 text-xs font-bold tracking-wide transition-colors"
                  >
                    #ORD-{String(o.id).padStart(4, "0")}
                  </button>
                  {o.createdAt && (
                    <p className="text-zinc-600 text-[10px] mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>

                {/* Customer */}
                <div className="col-span-2">
                  <p className="text-white text-xs font-medium">{o.user?.name ?? `User #${o.userId}`}</p>
                  <p className="text-zinc-500 text-[10px] mt-0.5 truncate">{o.user?.email}</p>
                </div>

                {/* Event */}
                <div className="col-span-3">
                  <p className="text-zinc-300 text-xs">{o.event?.name ?? `Event #${o.eventId}`}</p>
                </div>

                {/* Total */}
                <div className="col-span-1 text-right">
                  <p className="text-white text-xs font-semibold">
                    ${(o.totalPrice ?? 0).toLocaleString("en", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Status */}
                <div className="col-span-2 flex justify-center">
                  <PaymentBadge status={ps} />
                </div>

                {/* Action */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {verify ? (
                    <button
                      onClick={() => { setSelected(o); setNewStatus("COMPLETED"); setModal("verify"); }}
                      className="bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                    >
                      Verify Payment
                    </button>
                  ) : (
                    <button
                      onClick={() => { setSelected(o); setModal("detail"); }}
                      className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                    >
                      View Details
                    </button>
                  )}
                  <button
                    onClick={() => { setSelected(o); setModal("delete"); }}
                    className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-900/20"
                    title="Delete"
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/50">
            <p className="text-zinc-500 text-xs">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} orders
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p); return acc;
                }, [])
                .map((p, i) => p === "..." ? (
                  <span key={`e${i}`} className="px-2 text-zinc-600 text-xs">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)}
                    className={`w-7 h-7 text-xs rounded-lg transition-all ${page === p ? "bg-red-700 text-white font-semibold" : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700"}`}>
                    {p}
                  </button>
                ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ───────────────────────────── */}
      <Modal open={modal === "detail"} onClose={() => setModal(null)} title={`Order #ORD-${String(selected?.id ?? "").padStart(4, "0")}`}>
        {selected && (
          <div className="flex flex-col gap-4">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Customer", value: selected.user?.name ?? `User #${selected.userId}` },
                { label: "Email", value: selected.user?.email ?? "—" },
                { label: "Event", value: selected.event?.name ?? `Event #${selected.eventId}` },
                { label: "Date", value: selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
                { label: "Total Paid", value: `$${(selected.totalPrice ?? 0).toLocaleString("en", { minimumFractionDigits: 2 })}` },
                { label: "Payment Method", value: selected.payment?.method ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-zinc-800 rounded-lg px-3 py-2.5">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider">{label}</p>
                  <p className="text-white text-xs font-medium mt-0.5 break-all">{value}</p>
                </div>
              ))}
            </div>

            {/* Payment status */}
            <div className="bg-zinc-800 rounded-lg px-4 py-3 flex items-center justify-between">
              <p className="text-zinc-400 text-xs">Payment Status</p>
              <PaymentBadge status={getPaymentStatus(selected)} />
            </div>

            {/* Tickets */}
            {selected.tickets && selected.tickets.length > 0 && (
              <div>
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Tickets</p>
                <div className="flex flex-col gap-1.5">
                  {selected.tickets.map(t => (
                    <div key={t.id} className="bg-zinc-800 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="text-zinc-300 text-xs">Ticket #{t.id}</span>
                      <span className="text-zinc-500 text-[10px]">{t.category?.name ?? "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {needsVerification(selected) && (
              <button
                onClick={() => { setNewStatus("COMPLETED"); setModal("verify"); }}
                className="w-full bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg transition-all"
              >
                Verify Payment
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* ── Verify Modal ───────────────────────────── */}
      <Modal open={modal === "verify"} onClose={() => setModal(null)} title={`Verify Order #ORD-${String(selected?.id ?? "").padStart(4, "0")}`}>
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div className="bg-zinc-800 rounded-lg p-4 flex flex-col gap-2 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Customer</span>
              <span className="text-white font-medium">{selected?.user?.name ?? `User #${selected?.userId}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Event</span>
              <span className="text-white font-medium">{selected?.event?.name ?? `Event #${selected?.eventId}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount</span>
              <span className="text-white font-semibold">${(selected?.totalPrice ?? 0).toLocaleString("en", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-t border-zinc-700 pt-2 mt-1">
              <span>Current Status</span>
              <PaymentBadge status={getPaymentStatus(selected!)} />
            </div>
          </div>

          <FormField label="Update Status to">
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-red-500/60 transition-colors"
            >
              <option value="COMPLETED">Completed / Paid</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="PENDING">Pending</option>
            </select>
          </FormField>

          <SubmitButton loading={saving}>Confirm Verification</SubmitButton>
        </form>
      </Modal>

      {/* ── Delete Modal ───────────────────────────── */}
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="Delete Order">
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-800 rounded-lg p-3 flex flex-col gap-1">
            <p className="text-white text-xs font-semibold">#ORD-{String(selected?.id ?? "").padStart(4, "0")}</p>
            <p className="text-zinc-400 text-[10px]">{selected?.user?.name} · {selected?.event?.name}</p>
            <p className="text-white text-xs font-bold">${(selected?.totalPrice ?? 0).toLocaleString("en", { minimumFractionDigits: 2 })}</p>
          </div>
          <p className="text-zinc-400 text-sm">Delete this order permanently? This cannot be undone.</p>
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
