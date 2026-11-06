"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { orderApi, ticketCategoryApi, artistApi } from "@/lib/api";

export interface SystemNotification {
  id: string;
  type: "order" | "artist" | "capacity";
  title: string;
  description: string;
  timeAgo: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

function formatTimeAgo(time: number) {
  const diff = Math.floor((Date.now() - time) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "unread" | "order" | "capacity" | "artist">("all");
  const [limit, setLimit] = useState(8);

  const fetchRealtimeNotifications = async () => {
    try {
      const [orderRes, catRes, artistRes] = await Promise.all([
        orderApi.getAll(),
        ticketCategoryApi.getAll(),
        artistApi.getAll(),
      ]);

      const notifs: SystemNotification[] = [];

      // 1. Order Activity from real DB
      if (orderRes.ok && Array.isArray(orderRes.data)) {
        const orders = orderRes.data;
        orders.slice(0, 15).forEach((ord: any) => {
          const rawAmount = Number(ord.total_amount || 0);
          const isPaid = ord.status === "verified" || ord.status === "completed";
          const orderDate = new Date(ord.ordered_at || ord.created_at || Date.now()).getTime();

          notifs.push({
            id: `ord-${ord.id}`,
            type: "order",
            title: isPaid ? "Pesanan Berhasil Dibayar" : "Pesanan Baru Menunggu Pembayaran",
            description: `Pesanan ${ord.order_code || "#ORD-" + ord.id} untuk event "${ord.event_name || "Konser"}" oleh ${ord.customer_name || "Customer"}. Nominal: Rp ${rawAmount.toLocaleString("id-ID")}.`,
            timeAgo: formatTimeAgo(orderDate),
            timestamp: orderDate,
            read: false,
            actionUrl: "/dashboard/orders",
            actionText: isPaid ? "Lihat E-Tiket" : "Verifikasi Pesanan",
          });
        });
      }

      // 2. Capacity warning from real ticket categories
      if (catRes.ok && Array.isArray(catRes.data)) {
        const cats = catRes.data;
        cats.forEach((cat: any) => {
          const quota = Number(cat.quota || 0);
          const sold = Number(cat.sold || 0);
          const remaining = Math.max(0, quota - sold);

          if (quota > 0 && remaining <= 25) {
            notifs.push({
              id: `cap-${cat.id}`,
              type: "capacity",
              title: "Peringatan Kuota Tiket Menipis",
              description: `Kategori tiket "${cat.name}" untuk event "${cat.event_name || "Konser"}" tersisa ${remaining} tiket dari total kuota ${quota}.`,
              timeAgo: "Live Alert",
              timestamp: Date.now() - 1800000,
              read: false,
              actionUrl: "/dashboard/ticket-categories",
              actionText: "Tambah Kuota",
            });
          }
        });
      }

      // 3. Artist Roster update from real DB
      if (artistRes.ok && Array.isArray(artistRes.data) && artistRes.data.length > 0) {
        artistRes.data.slice(0, 4).forEach((art: any) => {
          const artDate = new Date(art.created_at || Date.now()).getTime();
          notifs.push({
            id: `art-${art.id}`,
            type: "artist",
            title: `Artis "${art.name}" Terdaftar`,
            description: `Profil musisi genre ${art.genre || "Konser"} telah terhubung dalam roster promotor dan dapat dimasukkan ke line-up event.`,
            timeAgo: formatTimeAgo(artDate),
            timestamp: artDate,
            read: false,
            actionUrl: "/dashboard/artists",
            actionText: "Lihat Roster",
          });
        });
      }

      // Filter out dismissed / cleared notifications
      const clearedIds: string[] = JSON.parse(localStorage.getItem("louder_cleared_notifs") || "[]");
      const savedReadIds: string[] = JSON.parse(localStorage.getItem("louder_read_notifs") || "[]");

      const activeList = notifs
        .filter((n) => !clearedIds.includes(n.id))
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((n) => ({ ...n, read: savedReadIds.includes(n.id) || n.read }));

      setNotifications(activeList);
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeNotifications();
    const timer = setInterval(() => {
      fetchRealtimeNotifications();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const markAsRead = (id: string) => {
    const savedReadIds: string[] = JSON.parse(localStorage.getItem("louder_read_notifs") || "[]");
    if (!savedReadIds.includes(id)) {
      savedReadIds.push(id);
      localStorage.setItem("louder_read_notifs", JSON.stringify(savedReadIds));
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem("louder_read_notifs", JSON.stringify(allIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    const clearedIds: string[] = JSON.parse(localStorage.getItem("louder_cleared_notifs") || "[]");
    if (!clearedIds.includes(id)) {
      clearedIds.push(id);
      localStorage.setItem("louder_cleared_notifs", JSON.stringify(clearedIds));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map((n) => n.id);
    const clearedIds: string[] = JSON.parse(localStorage.getItem("louder_cleared_notifs") || "[]");
    const merged = Array.from(new Set([...clearedIds, ...allIds]));
    localStorage.setItem("louder_cleared_notifs", JSON.stringify(merged));
    setNotifications([]);
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const totalCount = notifications.length;

  const filteredNotifs = useMemo(() => {
    return notifications.filter((n) => {
      if (filterType === "unread") return !n.read;
      if (filterType === "order") return n.type === "order";
      if (filterType === "capacity") return n.type === "capacity";
      if (filterType === "artist") return n.type === "artist";
      return true;
    });
  }, [notifications, filterType]);

  const visibleNotifs = filteredNotifs.slice(0, limit);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-850">
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">Pemberitahuan & Aktivitas</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Riwayat pembaruan transaksi tiket, kuota panggung, dan aktivitas musisi.
          </p>
        </div>

        <button
          onClick={() => fetchRealtimeNotifications()}
          className="flex items-center gap-1.5 bg-[#0b0c0f] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium px-3.5 py-2 rounded-lg transition self-start sm:self-auto cursor-pointer"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Segarkan Data
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left list: 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Tabs Filter */}
          <div className="flex items-center gap-1.5 pb-2 overflow-x-auto scrollbar-none">
            {[
              { key: "all", label: "Semua" },
              { key: "unread", label: `Belum Diperiksa (${unreadCount})` },
              { key: "order", label: "Pesanan Masuk" },
              { key: "capacity", label: "Kapasitas Kuota" },
              { key: "artist", label: "Roster Artis" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setFilterType(t.key as any);
                  setLimit(8);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
                  filterType === t.key
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visibleNotifs.length === 0 ? (
            <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-12 text-center flex flex-col items-center gap-2 shadow-sm">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="text-zinc-600">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-zinc-400 text-sm font-medium">Tidak ada aktivitas pada kategori ini</p>
              <p className="text-zinc-600 text-xs">Semua aktivitas telah tersinkronisasi.</p>
            </div>
          ) : (
            visibleNotifs.map((n) => (
              <div
                key={n.id}
                className={`relative rounded-xl p-4 md:p-5 border transition flex items-start gap-3.5 ${
                  !n.read
                    ? "bg-[#0b0c0f] border-red-900/40"
                    : "bg-[#0b0c0f] border-zinc-800/80 hover:bg-zinc-900/30"
                }`}
              >
                {/* Icon box */}
                <div
                  className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${
                    n.type === "order"
                      ? "bg-red-950/60 border-red-800/60 text-red-400"
                      : n.type === "capacity"
                      ? "bg-amber-950/60 border-amber-800/60 text-amber-400"
                      : "bg-purple-950/60 border-purple-800/60 text-purple-400"
                  }`}
                >
                  {n.type === "order" && (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  )}
                  {n.type === "capacity" && (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {n.type === "artist" && (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle cx="9" cy="7" r="4" strokeWidth="1.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 21v-1a7 7 0 0 1 7-7" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11l2 2 4-4" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-white font-bold text-sm truncate">{n.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-zinc-500 text-[11px] font-mono">{n.timeAgo}</span>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />}
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="text-zinc-600 hover:text-zinc-300 p-0.5 rounded transition-colors"
                        title="Hapus Dari Log"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{n.description}</p>

                  <div className="flex items-center gap-3 mt-3">
                    {n.actionUrl && (
                      <Link
                        href={n.actionUrl}
                        className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        {n.actionText || "Lihat"} →
                      </Link>
                    )}
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                      >
                        Tandai Selesai Diperiksa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Load More Button */}
          {filteredNotifs.length > limit && (
            <div className="flex justify-center mt-3">
              <button
                onClick={() => setLimit((l) => l + 6)}
                className="bg-[#111318] hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                Muat Lebih Banyak
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Ringkasan Status */}
          <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
            <h2 className="text-white text-xs font-semibold uppercase tracking-wider font-mono mb-3">Ringkasan Aktivitas</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3.5">
                <p className="text-2xl font-bold text-red-500 font-mono">{unreadCount}</p>
                <p className="text-zinc-500 text-[11px] mt-1">Belum Dibaca</p>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3.5">
                <p className="text-2xl font-bold text-white font-mono">{totalCount}</p>
                <p className="text-zinc-500 text-[11px] mt-1">Total Entri</p>
              </div>
            </div>
          </div>

          {/* Tindakan Cepat */}
          <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-1.5 shadow-sm">
            <h2 className="text-white text-xs font-semibold uppercase tracking-wider font-mono mb-2">Tindakan</h2>

            <button
              onClick={markAllAsRead}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs transition group cursor-pointer"
            >
              <span>Tandai Semua Selesai</span>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-zinc-500 group-hover:text-white transition">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <Link
              href="/dashboard/settings"
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs transition group"
            >
              <span>Pengaturan Akun</span>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-zinc-500 group-hover:text-white transition">
                <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <button
              onClick={clearAllNotifications}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-red-950/20 text-zinc-400 hover:text-red-400 text-xs transition group cursor-pointer"
            >
              <span>Bersihkan Riwayat</span>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-zinc-500 group-hover:text-red-400 transition">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
