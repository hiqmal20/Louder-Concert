"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { eventApi, orderApi, artistApi, userApi, getImageUrl } from "@/lib/api";
import { StatusBadge } from "@/components/ui/input";

interface Order {
  id: number;
  order_code?: string;
  status?: string;
  total_amount?: number;
  totalPrice?: number;
  ordered_at?: string;
  created_at?: string;
  user_id?: number;
  customer_name?: string;
  event_name?: string;
}

interface Event {
  id: number;
  name: string;
  status?: string;
  venue?: string;
  event_date?: string;
  poster_url?: string;
  tickets_sold?: number;
  ticketsSold?: number;
  total_quota?: number;
}

interface Artist {
  id: number;
  name: string;
  genre?: string;
}

interface User {
  id: number;
  name: string;
}

function MetricCard({
  title,
  value,
  sublabel,
  trend,
  trendPositive = true,
  icon,
}: {
  title: string;
  value: string;
  sublabel?: string;
  trend?: string;
  trendPositive?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-700/80 transition group shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
          {title}
        </span>
        <span className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-red-500 group-hover:border-red-900/40 transition">
          {icon}
        </span>
      </div>

      <div className="mt-4">
        <div className="text-white text-2xl lg:text-3xl font-bold font-mono tracking-tight">
          {value}
        </div>

        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-850">
          {sublabel && (
            <p className="text-zinc-500 text-xs truncate">
              {sublabel}
            </p>
          )}
          {trend && (
            <span
              className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded shrink-0 ${
                trendPositive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number | string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0c0d10] border border-zinc-800 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-zinc-400 text-[10px] font-mono uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-white text-xs font-semibold font-mono">
          Rp {Number(payload[0].value).toLocaleString("id-ID")}
        </p>
      </div>
    );
  }
  return null;
}

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number | string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0c0d10] border border-zinc-800 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-zinc-400 text-[10px] font-mono uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-white text-xs font-semibold font-mono">
          {payload[0].value} Pesanan
        </p>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderApi.getAll(),
      eventApi.getAll(),
      artistApi.getAll(),
      userApi.getAll(),
    ]).then(([oRes, eRes, aRes, uRes]) => {
      if (oRes.ok) setOrders(Array.isArray(oRes.data) ? oRes.data : oRes.data?.data ?? []);
      if (eRes.ok) setEvents(Array.isArray(eRes.data) ? eRes.data : eRes.data?.data ?? []);
      if (aRes.ok) setArtists(Array.isArray(aRes.data) ? aRes.data : aRes.data?.data ?? []);
      if (uRes.ok) setUsers(Array.isArray(uRes.data) ? uRes.data : uRes.data?.data ?? []);
      setLoading(false);
    });
  }, []);

  const totalRevenue = orders
    .filter((o) => (o.status ?? "").toLowerCase() === "verified" || (o.status ?? "").toLowerCase() === "completed")
    .reduce((s, o) => s + Number(o.total_amount ?? o.totalPrice ?? 0), 0);

  const paidOrdersCount = orders.filter(
    (o) => (o.status ?? "").toLowerCase() === "verified" || (o.status ?? "").toLowerCase() === "completed"
  ).length;

  const pendingOrdersCount = orders.filter(
    (o) => (o.status ?? "").toLowerCase() === "pending" || (o.status ?? "").toLowerCase() === "awaiting_verification"
  ).length;

  const isEventActive = (s?: string) => {
    const st = (s ?? "").toLowerCase();
    return st === "published" || st === "active";
  };

  const activeEvents = events.filter((e) => isEventActive(e.status));

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.ordered_at ?? b.created_at ?? 0).getTime() - new Date(a.ordered_at ?? a.created_at ?? 0).getTime())
    .slice(0, 6);

  const chartData = useMemo(() => {
    const revenueByDay: Record<string, number> = {};
    const now = Date.now();
    orders.forEach((o) => {
      const isPaid = (o.status ?? "").toLowerCase() === "verified" || (o.status ?? "").toLowerCase() === "completed";
      if (!isPaid) return;
      const dt = o.ordered_at ?? o.created_at;
      if (!dt) return;
      const d = new Date(dt);
      const diffDays = Math.floor((now - d.getTime()) / 86400000);
      if (diffDays <= 30) {
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        revenueByDay[label] = (revenueByDay[label] ?? 0) + Number(o.total_amount ?? o.totalPrice ?? 0);
      }
    });

    return Object.entries(revenueByDay)
      .sort((a, b) => {
        const [ad, am] = a[0].split("/").map(Number);
        const [bd, bm] = b[0].split("/").map(Number);
        return am !== bm ? am - bm : ad - bd;
      })
      .map(([day, revenue]) => ({ day, revenue }));
  }, [orders]);

  const ticketData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const ticketByMonth: Record<string, number> = {};
    orders.forEach((o) => {
      const dt = o.ordered_at ?? o.created_at;
      if (!dt) return;
      const m = monthNames[new Date(dt).getMonth()];
      ticketByMonth[m] = (ticketByMonth[m] ?? 0) + 1;
    });

    return monthNames
      .filter((m) => ticketByMonth[m])
      .map((month) => ({ month, sold: ticketByMonth[month] }));
  }, [orders]);

  // Overall ticket quota and sold calculation
  const totalCapacityQuota = events.reduce((s, e) => s + (e.total_quota ?? 0), 0);
  const totalTicketsSold = events.reduce((s, e) => s + (e.tickets_sold ?? e.ticketsSold ?? 0), 0);
  const occupancyRate = totalCapacityQuota > 0 ? Math.round((totalTicketsSold / totalCapacityQuota) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Executive Promoter Hero Bar ── */}
      <div className="relative bg-[#0b0c0f] border border-zinc-800/80 rounded-2xl p-6 lg:p-7 overflow-hidden shadow-sm">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Pusat Kendali Promotor
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500 text-xs">Musim Konser 2026</span>
            </div>
            <h1 className="text-white text-2xl lg:text-3xl font-bold tracking-tight">
              Ringkasan Kinerja Tiket & Panggung
            </h1>
            <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
              Pantau arus penjualan tiket konser musik secara langsung, koordinasi ketersediaan kuota panggung artis, dan pantau verifikasi pembayaran pelanggan.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                <span className="text-zinc-500">Event Aktif:</span>
                <span className="text-white font-mono font-bold">{activeEvents.length} Tayang</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                <span className="text-zinc-500">Tiket Terdistribusi:</span>
                <span className="text-white font-mono font-bold">{totalTicketsSold.toLocaleString("id-ID")} Tiket</span>
              </div>
              {occupancyRate > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                  <span className="text-zinc-500">Okupansi Kuota:</span>
                  <span className="text-emerald-400 font-mono font-bold">{occupancyRate}% Terisi</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <Link
              href="/dashboard/orders"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition cursor-pointer"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" strokeLinecap="round" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
              <span>Verifikasi Order</span>
              {pendingOrdersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold">
                  {pendingOrdersCount}
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/events/create"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition active:scale-[0.99] shadow-sm cursor-pointer"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              <span>Buat Event Baru</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4 KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Omset Terverifikasi"
          value={loading ? "..." : `Rp ${totalRevenue.toLocaleString("id-ID")}`}
          sublabel={`${paidOrdersCount} tiket terkonfirmasi lunas`}
          trend={`${paidOrdersCount} Transaksi`}
          trendPositive={true}
          icon={
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
            </svg>
          }
        />
        <MetricCard
          title="Konser Aktif Tayang"
          value={loading ? "..." : String(activeEvents.length)}
          sublabel={`${events.length} jadwal konser terdaftar`}
          trend="Live Roster"
          trendPositive={true}
          icon={
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" />
            </svg>
          }
        />
        <MetricCard
          title="Line-up Artis Resmi"
          value={loading ? "..." : String(artists.length)}
          sublabel="Musisi terhubung ke panggung"
          trend="Roster Aktif"
          trendPositive={true}
          icon={
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <circle cx="9" cy="7" r="4" />
              <path d="M2 21v-1a7 7 0 0 1 7-7" strokeLinecap="round" />
              <path d="M16 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <MetricCard
          title="Total Pengguna Mobile"
          value={loading ? "..." : String(users.length)}
          sublabel="Customer penikmat konser"
          trend="Customer"
          trendPositive={true}
          icon={
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <circle cx="9" cy="7" r="4" />
              <path d="M2 21v-1a7 7 0 0 1 7-7" strokeLinecap="round" />
              <circle cx="17" cy="11" r="3" />
              <path d="M13 21v-1a5 5 0 0 1 5-5" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {/* ── Quick Promoter Shortcuts Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/dashboard/events/create"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0b0c0f] border border-zinc-800/80 hover:border-red-900/40 hover:bg-zinc-900/60 transition group shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 group-hover:scale-105 transition">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">Buat Konser Baru</p>
            <p className="text-zinc-500 text-[10px] truncate">Jadwal & venue</p>
          </div>
        </Link>

        <Link
          href="/dashboard/posters"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0b0c0f] border border-zinc-800/80 hover:border-red-900/40 hover:bg-zinc-900/60 transition group shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 group-hover:scale-105 transition">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M8 7h8M8 11h8M8 15h5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">Upload Pamflet</p>
            <p className="text-zinc-500 text-[10px] truncate">Poster line-up 3:4</p>
          </div>
        </Link>

        <Link
          href="/dashboard/ticket-categories"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0b0c0f] border border-zinc-800/80 hover:border-red-900/40 hover:bg-zinc-900/60 transition group shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 group-hover:scale-105 transition">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1.5a1.5 1.5 0 0 0 0 3V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1.5a1.5 1.5 0 0 0 0-3V9z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">Kelola Kategori</p>
            <p className="text-zinc-500 text-[10px] truncate">Harga & kuota kursi</p>
          </div>
        </Link>

        <Link
          href="/dashboard/promos"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0b0c0f] border border-zinc-800/80 hover:border-red-900/40 hover:bg-zinc-900/60 transition group shadow-sm"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 group-hover:scale-105 transition">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <circle cx="9" cy="9" r="2" />
              <circle cx="15" cy="15" r="2" />
              <path d="M16 8l-8 8" strokeLinecap="round" />
              <rect x="3" y="3" width="18" height="18" rx="3" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">Voucher Diskon</p>
            <p className="text-zinc-500 text-[10px] truncate">Promosi potongan</p>
          </div>
        </Link>
      </div>

      {/* ── Charts Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <h2 className="text-white text-xs font-semibold uppercase tracking-wider font-mono">
                  Tren Pendapatan Harian
                </h2>
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">Akumulasi transaksi tiket lunas 30 hari terakhir</p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
              30 Hari
            </span>
          </div>

          {chartData.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-56 text-zinc-600 text-xs">
              Belum ada data transaksi
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="louderRedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1f26" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#dc2626"
                    strokeWidth={2}
                    fill="url(#louderRedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Volume Order Bulanan */}
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <h2 className="text-white text-xs font-semibold uppercase tracking-wider font-mono">
                  Volume Order Bulanan
                </h2>
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">Distribusi pemesanan tiket per bulan</p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
              Musim 2026
            </span>
          </div>

          {ticketData.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-56 text-zinc-600 text-xs">
              Belum ada data bulanan
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1f26" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="sold" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Transactions Table & Live Concerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white text-sm font-semibold tracking-tight">Transaksi Pesanan Terbaru</h2>
              <p className="text-zinc-500 text-xs mt-0.5">Daftar transaksi masuk dari customer mobile</p>
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs text-zinc-400 hover:text-red-400 font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <span>Semua Pesanan</span>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-16 text-zinc-600 text-xs">Belum ada pesanan masuk</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                    <th className="pb-2.5 font-medium">Kode Order</th>
                    <th className="pb-2.5 font-medium">Customer</th>
                    <th className="pb-2.5 font-medium">Konser</th>
                    <th className="pb-2.5 font-medium text-right">Nominal</th>
                    <th className="pb-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 text-xs font-mono font-medium text-red-400">
                        {o.order_code ?? `#${o.id}`}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                            {(o.customer_name ?? "U").slice(0, 1)}
                          </div>
                          <span className="text-xs text-zinc-200 truncate max-w-[140px]">
                            {o.customer_name ?? `User #${o.user_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-xs text-zinc-400 max-w-[160px] truncate">
                        {o.event_name ?? "—"}
                      </td>
                      <td className="py-3 text-xs font-mono font-medium text-white text-right">
                        Rp {Number(o.total_amount ?? o.totalPrice ?? 0).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 text-right">
                        <StatusBadge status={o.status ?? "pending"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Active Concerts Widget with Real Progress */}
        <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white text-sm font-semibold tracking-tight">Konser Tayang</h2>
                <p className="text-zinc-500 text-xs mt-0.5">Jadwal konser aktif & kuota</p>
              </div>
              <Link
                href="/dashboard/events"
                className="text-xs text-zinc-400 hover:text-red-400 font-medium transition cursor-pointer"
              >
                Lihat Semua
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeEvents.length === 0 ? (
              <div className="text-center py-16 text-zinc-600 text-xs">Tidak ada konser aktif</div>
            ) : (
              <div className="space-y-3">
                {activeEvents.slice(0, 4).map((ev) => {
                  const poster = ev.poster_url ? getImageUrl(ev.poster_url) : null;
                  const sold = ev.tickets_sold ?? ev.ticketsSold ?? 0;
                  const quota = ev.total_quota ?? 0;
                  const pct = quota > 0 ? Math.min(100, Math.round((sold / quota) * 100)) : 0;

                  return (
                    <div
                      key={ev.id}
                      className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 transition flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-3">
                        {poster ? (
                          <img
                            src={poster}
                            alt={ev.name}
                            className="w-10 h-10 rounded-md object-cover bg-zinc-800 shrink-0 border border-zinc-700/60"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-500">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="1.5" />
                            </svg>
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-white text-xs font-semibold truncate leading-tight">{ev.name}</p>
                          <p className="text-zinc-500 text-[11px] truncate mt-0.5">{ev.venue}</p>
                        </div>

                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-medium uppercase tracking-wider shrink-0">
                          Live
                        </span>
                      </div>

                      {/* Ticket quota progress bar */}
                      {quota > 0 && (
                        <div className="space-y-1 pt-1 border-t border-zinc-850">
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                            <span>{sold.toLocaleString("id-ID")} / {quota.toLocaleString("id-ID")} tiket</span>
                            <span className="font-semibold text-white">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-850 overflow-hidden">
                            <div
                              className="h-full bg-red-600 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/dashboard/events/create"
            className="mt-4 w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium text-center block transition cursor-pointer"
          >
            + Tambah Jadwal Konser
          </Link>
        </div>
      </div>
    </div>
  );
}
