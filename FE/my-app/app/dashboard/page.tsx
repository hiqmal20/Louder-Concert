"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { eventApi, orderApi, artistApi, userApi } from "@/lib/api";
import { StatusBadge } from "@/components/ui/input";

interface Order {
  id: number; status?: string; totalPrice?: number; createdAt?: string;
  user?: { name: string; email: string }; event?: { name: string };
  userId?: number; eventId?: number;
}
interface Event { id: number; name: string; status?: string }
interface Artist { id: number; name: string }
interface User { id: number; name: string }

function StatCard({ title, value, sub, icon, positive }: { title: string; value: string; sub?: string; icon: React.ReactNode; positive?: boolean }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-700 transition-all group">
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-xs font-medium">{title}</span>
        <span className="text-zinc-600 group-hover:text-red-500 transition-colors">{icon}</span>
      </div>
      <div>
        <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className={`text-xs mt-1 font-medium ${positive ? "text-emerald-400" : "text-zinc-500"}`}>{sub}</p>}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload?.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-zinc-400 text-[10px] mb-1">{label}</p>
        <p className="text-white text-sm font-semibold">Rp {payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
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

  // Compute stats
  const totalRevenue = orders.reduce((s, o) => s + (o.totalPrice ?? 0), 0);
  const activeEvents = events.filter((e) => e.status?.toUpperCase() === "ACTIVE").length;
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).slice(0, 5);

  // Build daily revenue chart from orders (last 30 days)
  const revenueByDay: Record<string, number> = {};
  const now = Date.now();
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    const diffDays = Math.floor((now - d.getTime()) / 86400000);
    if (diffDays <= 30) {
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      revenueByDay[label] = (revenueByDay[label] ?? 0) + (o.totalPrice ?? 0);
    }
  });
  const chartData = Object.entries(revenueByDay)
    .sort((a, b) => {
      const [ad, am] = a[0].split("/").map(Number);
      const [bd, bm] = b[0].split("/").map(Number);
      return am !== bm ? am - bm : ad - bd;
    })
    .map(([day, revenue]) => ({ day, revenue }));

  // Monthly ticket count
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ticketByMonth: Record<string, number> = {};
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const m = monthNames[new Date(o.createdAt).getMonth()];
    ticketByMonth[m] = (ticketByMonth[m] ?? 0) + 1;
  });
  const ticketData = monthNames
    .filter((m) => ticketByMonth[m])
    .map((month) => ({ month, sold: ticketByMonth[month] }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold text-lg">Welcome back. Here&apos;s what&apos;s happening today.</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Real-time overview of your platform</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-400 text-xs">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Last 30 Days
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={loading ? "..." : `Rp ${totalRevenue.toLocaleString()}`}
          sub={`${orders.length} orders`}
          positive
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
        />
        <StatCard
          title="Active Events"
          value={loading ? "..." : String(activeEvents)}
          sub={`${events.length} total events`}
          positive
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
        />
        <StatCard
          title="Artists"
          value={loading ? "..." : String(artists.length)}
          sub="registered"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M2 21v-1a7 7 0 0 1 7-7h0a7 7 0 0 1 7 7v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
        />
        <StatCard
          title="Total Users"
          value={loading ? "..." : String(users.length)}
          sub="accounts"
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M2 21v-1a7 7 0 0 1 7-7h0a7 7 0 0 1 7 7v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M16 3.13a4 4 0 0 1 0 7.75M22 21v-1a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-semibold text-sm">Revenue Overview</h2>
              <p className="text-zinc-500 text-xs mt-0.5">Daily revenue from orders</p>
            </div>
          </div>
          {chartData.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-48 text-zinc-600 text-xs">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#b91c1c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#52525b", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} fill="url(#redGrad)"
                  dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#ef4444", stroke: "#fff", strokeWidth: 1.5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="mb-5">
            <h2 className="text-white font-semibold text-sm">Orders per Month</h2>
            <p className="text-zinc-500 text-xs mt-0.5">Monthly breakdown</p>
          </div>
          {ticketData.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-48 text-zinc-600 text-xs">No order data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ticketData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{ background: "#27272a", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#a1a1aa" }} itemStyle={{ color: "#fff" }} />
                <Bar dataKey="sold" fill="#b91c1c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Orders + Events */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Recent Orders</h2>
            <button onClick={() => router.push("/dashboard/orders")} className="text-red-400 hover:text-red-300 text-xs transition-colors">View All</button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-xs">No orders yet</div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-12 text-[10px] text-zinc-600 uppercase tracking-wider px-2 pb-2 border-b border-zinc-800">
                <span className="col-span-2">Order</span>
                <span className="col-span-4">Customer</span>
                <span className="col-span-3">Event</span>
                <span className="col-span-2 text-right">Amount</span>
                <span className="col-span-1 text-right">Status</span>
              </div>
              {recentOrders.map((o) => (
                <div key={o.id} className="grid grid-cols-12 items-center px-2 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-default">
                  <span className="col-span-2 text-zinc-400 text-xs">#{o.id}</span>
                  <div className="col-span-4">
                    <p className="text-zinc-300 text-xs">{o.user?.name ?? `User #${o.userId}`}</p>
                    <p className="text-zinc-600 text-[10px]">{o.user?.email}</p>
                  </div>
                  <span className="col-span-3 text-zinc-400 text-xs truncate">{o.event?.name ?? `Event #${o.eventId}`}</span>
                  <span className="col-span-2 text-right text-white text-xs font-semibold">
                    {o.totalPrice != null ? `Rp ${o.totalPrice.toLocaleString()}` : "—"}
                  </span>
                  <div className="col-span-1 flex justify-end">
                    <StatusBadge status={o.status ?? "PENDING"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Events list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm">Active Events</h2>
            <button onClick={() => router.push("/dashboard/events")} className="text-red-400 hover:text-red-300 text-xs transition-colors">View All</button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : events.filter(e => e.status?.toUpperCase() === "ACTIVE").length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-xs">No active events</div>
          ) : (
            events
              .filter(e => e.status?.toUpperCase() === "ACTIVE")
              .slice(0, 6)
              .map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-zinc-500">
                      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-medium truncate">{ev.name}</p>
                  </div>
                  <StatusBadge status="ACTIVE" />
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
