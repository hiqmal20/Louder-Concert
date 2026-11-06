"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/auth-guard";
import { getStoredUser, clearAuth } from "@/lib/auth";

function LouderLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-end gap-[3px] h-5">
        <span className="w-1 h-2.5 bg-red-600 rounded-full" />
        <span className="w-1 h-4 bg-red-600 rounded-full" />
        <span className="w-1 h-5 bg-red-600 rounded-full" />
        <span className="w-1 h-3.5 bg-red-600 rounded-full" />
        <span className="w-1 h-2 bg-red-600 rounded-full" />
      </div>
      <div className="flex flex-col">
        <span className="text-white text-sm font-black tracking-widest uppercase leading-none">
          Louder
        </span>
        <span className="text-zinc-500 text-[9px] font-mono tracking-widest uppercase mt-0.5">
          Console
        </span>
      </div>
    </div>
  );
}

const navSections = [
  {
    title: "Utama",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: (
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Produksi Konser",
    items: [
      {
        href: "/dashboard/events",
        label: "Event Management",
        icon: (
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M8 2v4M16 2v4M3 10h18" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        href: "/dashboard/artists",
        label: "Musisi & Line-up",
        icon: (
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
            <circle cx="9" cy="7" r="4" />
            <path d="M2 21v-1a7 7 0 0 1 7-7" strokeLinecap="round" />
            <path d="M16 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        href: "/dashboard/posters",
        label: "Pamflet & Iklan",
        icon: (
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 7h8M8 11h8M8 15h5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Penjualan Tiket",
    items: [
      {
        href: "/dashboard/ticket-categories",
        label: "Kategori Tiket",
        icon: (
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
            <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1.5a1.5 1.5 0 0 0 0 3V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1.5a1.5 1.5 0 0 0 0-3V9z" />
            <path d="M13 8v8" strokeDasharray="2 2" />
          </svg>
        ),
      },
      {
        href: "/dashboard/promos",
        label: "Voucher Diskon",
        icon: (
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
            <circle cx="9" cy="9" r="2" />
            <circle cx="15" cy="15" r="2" />
            <path d="M16 8l-8 8" strokeLinecap="round" />
            <rect x="3" y="3" width="18" height="18" rx="3" />
          </svg>
        ),
      },
      {
        href: "/dashboard/orders",
        label: "Pesanan & Pembayaran",
        icon: (
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" strokeLinecap="round" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Akun & Preferensi",
    items: [
      {
        href: "/dashboard/notifications",
        label: "Notifikasi",
        icon: (
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        href: "/dashboard/settings",
        label: "Pengaturan Akun",
        icon: (
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ),
      },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; email?: string } | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const currentItem = navSections
    .flatMap((s) => s.items)
    .find((it) => it.href === pathname || (it.href !== "/dashboard" && pathname.startsWith(it.href)));

  return (
    <AdminGuard>
      <div className="flex h-screen bg-[#07080a] text-zinc-100 overflow-hidden font-sans antialiased">
        {/* Sidebar */}
        <aside
          className={`flex flex-col bg-[#0b0c0f] border-r border-zinc-800/80 transition-all duration-200 shrink-0 select-none ${
            collapsed ? "w-[68px]" : "w-64"
          }`}
        >
          {/* Logo Bar */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-800/80">
            {!collapsed && <LouderLogo />}
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="text-zinc-500 hover:text-white p-1.5 rounded-md hover:bg-zinc-800/60 transition ml-auto"
              title={collapsed ? "Perluas menu" : "Ciutkan menu"}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Create Event CTA */}
          <div className="p-3 border-b border-zinc-800/60">
            <Link
              href="/dashboard/events/create"
              className={`flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg py-2.5 transition active:scale-[0.99] ${
                collapsed ? "justify-center px-0" : "px-3.5"
              }`}
              title="Buat Event Baru"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {!collapsed && <span>Buat Event Baru</span>}
            </Link>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-5">
            {navSections.map((sec) => (
              <div key={sec.title} className="space-y-0.5">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-500 mb-1.5">
                    {sec.title}
                  </p>
                )}
                {sec.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? "bg-zinc-900 text-white border-l-2 border-red-500 shadow-sm"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/60 border-l-2 border-transparent"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                      title={collapsed ? item.label : ""}
                    >
                      <span className={active ? "text-red-500" : "text-zinc-500 group-hover:text-zinc-300"}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* User Account Footer */}
          <div className="p-3 border-t border-zinc-800/80">
            {!collapsed ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-red-500 font-bold text-xs shrink-0">
                    {user?.name?.[0]?.toUpperCase() ?? "A"}
                  </div>
                  <div className="truncate">
                    <p className="text-white text-xs font-medium truncate leading-tight">
                      {user?.name ?? "AdminLouder"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-[10px] font-mono text-zinc-400">Promotor</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-zinc-500 hover:text-red-400 p-1.5 rounded-md hover:bg-zinc-800 transition"
                  title="Keluar"
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
                    <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex justify-center p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition"
                title="Keluar"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
                  <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#07080a]">
          {/* Top Bar */}
          <header className="h-16 px-6 bg-[#0b0c0f] border-b border-zinc-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-mono">LOUDER Console</span>
              <span className="text-zinc-700">/</span>
              <span className="text-white font-medium">
                {currentItem?.label ?? "Dashboard"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/notifications"
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition relative"
                title="Notifikasi"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
                </svg>
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition"
                title="Muat Ulang"
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" strokeLinecap="round" />
                </svg>
              </button>
              <div className="w-px h-4 bg-zinc-800" />
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 pl-1 group"
                title="Pengaturan Akun"
              >
                <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center transition group-hover:ring-2 group-hover:ring-red-500/50">
                  {user?.name?.[0]?.toUpperCase() ?? "A"}
                </div>
              </Link>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}