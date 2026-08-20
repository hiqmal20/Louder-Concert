"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-black/80 backdrop-blur border-b border-zinc-800">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-red-500">
          <rect x="1" y="6" width="2" height="8" fill="currentColor" />
          <rect x="5" y="3" width="2" height="14" fill="currentColor" />
          <rect x="9" y="1" width="2" height="18" fill="currentColor" />
          <rect x="13" y="3" width="2" height="14" fill="currentColor" />
          <rect x="17" y="6" width="2" height="8" fill="currentColor" />
        </svg>
        <span className="text-white font-bold text-lg tracking-widest uppercase">Louder</span>
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
        <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
        <a href="#footer" className="hover:text-white transition-colors">Resources</a>
      </div>

      {/* Login button */}
      <Link
        href="/login"
        className="px-5 py-2 text-sm font-semibold uppercase tracking-wider border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all"
      >
        Admin Login
      </Link>
    </nav>
  );
}
