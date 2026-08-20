"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at center, #1a0000 0%, #000000 70%)" }}
    >
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none" className="text-red-500">
            <rect x="1" y="6" width="2" height="8" fill="currentColor" />
            <rect x="5" y="3" width="2" height="14" fill="currentColor" />
            <rect x="9" y="1" width="2" height="18" fill="currentColor" />
            <rect x="13" y="3" width="2" height="14" fill="currentColor" />
            <rect x="17" y="6" width="2" height="8" fill="currentColor" />
          </svg>
          <span className="text-white font-bold text-xl tracking-widest uppercase">Louder</span>
        </div>

        {/* 403 icon */}
        <div className="w-20 h-20 rounded-full bg-red-900/20 border border-red-800/40 flex items-center justify-center mx-auto mb-6">
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" className="text-red-500">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-white text-3xl font-bold mb-2">Akses Ditolak</h1>
        <p className="text-zinc-400 text-sm mb-2">
          Portal admin LOUDER hanya dapat diakses oleh admin.
        </p>
        <p className="text-zinc-500 text-xs mb-8 leading-relaxed">
          Jika kamu adalah pengguna biasa, silakan gunakan <span className="text-white font-medium">aplikasi mobile LOUDER</span> untuk membeli tiket dan mengelola pesanan kamu.
        </p>

        {/* Mobile app info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6 text-left">
          <p className="text-zinc-400 text-xs uppercase tracking-widest font-semibold mb-3">Pengguna Mobile</p>
          <div className="flex flex-col gap-3">
            {[
              { icon: "🎫", title: "Beli Tiket", desc: "Temukan dan beli tiket event favorit kamu" },
              { icon: "📋", title: "Kelola Pesanan", desc: "Lihat riwayat dan status pesanan" },
              { icon: "🎵", title: "Jelajahi Event", desc: "Temukan konser dan event musik terbaru" },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-white text-xs font-medium">{item.title}</p>
                  <p className="text-zinc-500 text-[10px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            className="w-full bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-lg transition-all text-center"
          >
            Kembali ke Login Admin
          </Link>
          <Link
            href="/landingpage"
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium py-3 rounded-lg transition-all text-center"
          >
            Ke Halaman Utama
          </Link>
        </div>

        <p className="text-zinc-700 text-[10px] mt-6">© 2024 LOUDER Management</p>
      </div>
    </div>
  );
}
