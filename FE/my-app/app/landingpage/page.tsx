"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { eventApi, artistApi, orderApi, getImageUrl } from "@/lib/api";

// ── Logo ──────────────────────────────────────────────────
function LouderLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="text-red-500">
        <rect x="1" y="6" width="2" height="8" fill="currentColor" />
        <rect x="5" y="3" width="2" height="14" fill="currentColor" />
        <rect x="9" y="1" width="2" height="18" fill="currentColor" />
        <rect x="13" y="3" width="2" height="14" fill="currentColor" />
        <rect x="17" y="6" width="2" height="8" fill="currentColor" />
      </svg>
      <span className="text-white font-bold text-lg tracking-widest uppercase">Louder</span>
    </div>
  );
}

// ── Animated background blobs ─────────────────────────────
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, #7f1d1d 0%, transparent 70%)",
          top: "-150px",
          left: "-150px",
          animation: "pulse 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
        style={{
          background: "radial-gradient(circle, #1e3a8a 0%, transparent 70%)",
          top: "0px",
          right: "-100px",
          animation: "float 6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
        style={{
          background: "radial-gradient(circle, #991b1b 0%, transparent 70%)",
          bottom: "-100px",
          right: "200px",
          animation: "float 8s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300 ${
        scrolled
          ? "bg-black/90 backdrop-blur-md border-b border-zinc-800 shadow-lg shadow-black/50"
          : "bg-transparent"
      }`}
    >
      <LouderLogo />

      <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
        <a
          href="#capabilities"
          onClick={(e) => scrollToSection(e, "capabilities")}
          className="hover:text-white transition-colors relative group"
        >
          Capabilities
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-500 group-hover:w-full transition-all duration-300" />
        </a>
        <a
          href="#live-events"
          onClick={(e) => scrollToSection(e, "live-events")}
          className="hover:text-white transition-colors relative group"
        >
          Featured Events
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-500 group-hover:w-full transition-all duration-300" />
        </a>
        <a
          href="#how-it-works"
          onClick={(e) => scrollToSection(e, "how-it-works")}
          className="hover:text-white transition-colors relative group"
        >
          How It Works
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-500 group-hover:w-full transition-all duration-300" />
        </a>
        <a
          href="#faq"
          onClick={(e) => scrollToSection(e, "faq")}
          className="hover:text-white transition-colors relative group"
        >
          FAQ
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-500 group-hover:w-full transition-all duration-300" />
        </a>
      </div>

      {/* Login button — clean pill style */}
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 hover:bg-red-700 text-zinc-300 hover:text-white text-sm font-medium transition-all duration-200 border border-zinc-700 hover:border-red-600"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="shrink-0">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Login
      </Link>
    </nav>
  );
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({
  label,
  value,
  labelColor = "text-zinc-500",
  glowColor = "rgba(255,255,255,0.06)",
  borderHover = "hover:border-zinc-500",
  floatDelay = "0s",
}: {
  label: string;
  value: string;
  labelColor?: string;
  glowColor?: string;
  borderHover?: string;
  floatDelay?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`backdrop-blur-sm border border-zinc-700/80 px-5 py-3.5 rounded-xl shadow-xl cursor-default select-none
        transition-all duration-300 ease-out ${borderHover}
        ${hovered ? "scale-115 z-20" : "scale-100 z-10"}`}
      style={{
        animation: `floatCard 3s ease-in-out infinite`,
        animationDelay: floatDelay,
        background: hovered
          ? `radial-gradient(circle at 50% 50%, ${glowColor}, #18181b 70%)`
          : "#18181b",
        boxShadow: hovered
          ? `0 0 28px 4px ${glowColor}, 0 8px 32px rgba(0,0,0,0.6)`
          : "0 4px 20px rgba(0,0,0,0.5)",
        transform: hovered ? "scale(1.12)" : undefined,
      }}
    >
      <p className={`text-[10px] uppercase tracking-widest font-semibold ${labelColor}`}>{label}</p>
      <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
    </div>
  );
}

// ── Hero Visual (right side) ──────────────────────────────
function HeroVisual() {
  const [stats, setStats] = useState({ events: "60+", orders: "100.000+", artists: "100+" });

  return (
    <div className="relative flex items-center justify-center w-full h-72">
      {/* rings */}
      <div className="absolute w-64 h-64 rounded-full border border-red-900/25 animate-spin" style={{ animationDuration: "20s" }} />
      <div className="absolute w-48 h-48 rounded-full border border-zinc-700/30 animate-spin" style={{ animationDuration: "14s", animationDirection: "reverse" }} />
      <div className="absolute w-32 h-32 rounded-full border border-red-900/20 animate-spin" style={{ animationDuration: "8s" }} />

      {/* center logo */}
      <div className="absolute z-10 w-20 h-20 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-2xl shadow-red-900/30">
        <svg width="36" height="36" viewBox="0 0 20 20" fill="none" className="text-red-500">
          <rect x="1" y="6" width="2" height="8" fill="currentColor" />
          <rect x="5" y="3" width="2" height="14" fill="currentColor" />
          <rect x="9" y="1" width="2" height="18" fill="currentColor" />
          <rect x="13" y="3" width="2" height="14" fill="currentColor" />
          <rect x="17" y="6" width="2" height="8" fill="currentColor" />
        </svg>
      </div>

      {/* Cards — orbit close around center */}
      {/* Events Live — top-left */}
      <div className="absolute" style={{ top: "20px", left: "40px" }}>
        <StatCard
          label="Konser Tersedia"
          value={stats.events}
          labelColor="text-blue-400"
          glowColor="rgba(59,130,246,0.25)"
          borderHover="hover:border-blue-500/60"
          floatDelay="0s"
        />
      </div>

      {/* Orders — right */}
      <div className="absolute" style={{ top: "60px", right: "30px" }}>
        <StatCard
          label="Tiket Terjual"
          value={stats.orders}
          labelColor="text-red-400"
          glowColor="rgba(185,28,28,0.4)"
          borderHover="hover:border-red-600/70"
          floatDelay="1s"
        />
      </div>

      {/* Artists — bottom */}
      <div className="absolute" style={{ bottom: "16px", left: "80px" }}>
        <StatCard
          label="Artist"
          value={stats.artists}
          labelColor="text-blue-400"
          glowColor="rgba(59,130,246,0.2)"
          borderHover="hover:border-blue-500/60"
          floatDelay="2s"
        />
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────
function HeroSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0a0000 0%, #0d0000 30%, #050010 70%, #000000 100%)",
      }}
    >
      <AnimatedBackground />

      {/* NO dashed blue border */}

      <div
        className={`relative z-10 w-full max-w-6xl mx-auto px-8 py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Left */}
        <div className="flex flex-col gap-7">
          <LouderLogo />

          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Rasakan Energi Panggung.
            </h1>
            <h1
              className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight"
              style={{
                background: "linear-gradient(90deg, #ef4444, #b91c1c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Amankan Tiket Konsermu.
            </h1>
          </div>

          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
            Platform resmi pemesanan tiket konser musik terpercaya. Dapatkan akses presale,
            pilih kategori terbaik, dan saksikan konser spektakuler musisi impianmu.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest transition-all duration-200 relative overflow-hidden"
            >
              <span className="relative z-10">Daftar Sekarang →</span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </Link>
            <a
              href="#live-events"
              className="text-zinc-500 text-xs uppercase tracking-widest hover:text-white transition-colors"
            >
              Jadwal Konser ↓
            </a>
          </div>
        </div>

        {/* Right — Visual */}
        <div
          className={`transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

// ── Official Partner & Streaming Ecosystem ──
const OFFICIAL_SPONSORS = [
  { name: "BCA", file: "/sponsors/bca.svg", heightClass: "h-10 sm:h-12 md:h-14" },
  { name: "Bank Mandiri", file: "/sponsors/mandiri.svg", heightClass: "h-9 sm:h-11 md:h-13" },
  { name: "Spotify", file: "/sponsors/spotify.svg", heightClass: "h-10 sm:h-12 md:h-14" },
  { name: "SoundCloud", file: "/sponsors/soundcloud.svg", heightClass: "h-10 sm:h-12 md:h-14" },
  { name: "Sony Music", file: "/sponsors/sonymusic.svg", heightClass: "h-9 sm:h-11 md:h-13" },
  { name: "Ticketmaster", file: "/sponsors/ticketmaster.svg", heightClass: "h-9 sm:h-11 md:h-13" },
  { name: "Stripe", file: "/sponsors/stripe.svg", heightClass: "h-9 sm:h-11 md:h-13" },
  { name: "Fender", file: "/sponsors/fender.svg", heightClass: "h-10 sm:h-12 md:h-14" },
];

function SponsorsMarqueeSection() {
  const marqueeItems = [...OFFICIAL_SPONSORS, ...OFFICIAL_SPONSORS];

  return (
    <section className="relative py-16 sm:py-20 bg-black border-y border-white/[0.08] overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 mb-10 text-center">
        <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.28em] text-zinc-500 font-bold">
          EKOSISTEM PEMBAYARAN DIGITAL & PARTNER TIKET RESMI
        </p>
      </div>

      {/* Marquee Track with Edge Fade Masks */}
      <div className="relative w-full overflow-hidden">
        {/* Left Fade Mask */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-28 sm:w-56 bg-gradient-to-r from-black via-black/90 to-transparent z-10" />
        {/* Right Fade Mask */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-28 sm:w-56 bg-gradient-to-l from-black via-black/90 to-transparent z-10" />

        {/* Pure Official Brand Logos Infinite Row */}
        <div className="animate-marquee flex items-center gap-16 sm:gap-24 md:gap-28 py-4">
          {marqueeItems.map((sponsor, idx) => (
            <div
              key={`${sponsor.name}-${idx}`}
              className="flex items-center justify-center shrink-0 opacity-75 hover:opacity-100 transition-all duration-300 transform hover:scale-108 cursor-pointer select-none"
            >
              <img
                src={sponsor.file}
                alt={sponsor.name}
                className={`${sponsor.heightClass} w-auto max-w-[240px] object-contain`}
                loading="eager"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Capability Card ───────────────────────────────────────
function CapabilityCard({
  icon,
  title,
  desc,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative bg-zinc-900 border border-zinc-800 p-6 flex flex-col gap-4 cursor-default transition-all duration-500 ${
        hovered ? "border-red-700/60 shadow-lg shadow-red-900/20 -translate-y-1" : ""
      } ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600 to-transparent transition-opacity duration-300 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className={`transition-transform duration-300 ${hovered ? "scale-110" : "scale-100"}`}>
        {icon}
      </div>
      <h3 className="text-white text-lg font-semibold">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Capabilities Section ──────────────────────────────────
const capabilities = [
  {
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" className="text-red-500">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "100% E-Ticket Resmi",
    desc: "Terhubung langsung dengan promotor resmi. E-ticket terenkripsi dengan QR code anti-pemalsuan dan anti-calo.",
  },
  {
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" className="text-red-500">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 21v-1a7 7 0 0 1 7-7h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Line-Up Artis Terlengkap",
    desc: "Temukan jadwal konser musisi favorit dari genre Rock, Pop, Electronic EDM, Indie, hingga Jazz.",
  },
  {
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" className="text-red-500">
        <path d="M3 17l4-6 4 4 4-8 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    title: "Pembayaran Cepat & Aman",
    desc: "Dukungan transaksi instan via QRIS, Virtual Account bank nasional, dan konfirmasi otomatis dalam hitungan detik.",
  },
];

function CapabilitiesSection() {
  return (
    <section
      id="capabilities"
      className="relative py-24 px-8 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #050005 0%, #0a0a0a 50%, #050005 100%)",
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #7f1d1d, transparent 70%)" }}
      />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-red-500 text-xs uppercase tracking-[0.3em] mb-3 font-semibold">Kenapa LOUDER?</p>
          <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight">Keunggulan Layanan Kami</h2>
          <p className="text-zinc-500 text-sm mt-2">Standar pengalaman ticketing konser terdepan dan bebas calo</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {capabilities.map((cap, i) => (
            <CapabilityCard key={cap.title} {...cap} delay={i * 120} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Featured Events Showcase ──────────────────────────────
function FeaturedEventsSection() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    eventApi.getAll().then((res) => {
      if (res.ok) {
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        const published = list.filter((e: any) => {
          const st = (e.status || "").toLowerCase();
          return st === "published" || st === "active";
        });
        setEvents(published.slice(0, 3));
      }
      setLoading(false);
    });
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBA";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="live-events" className="relative py-24 px-8 bg-zinc-950 border-t border-zinc-900 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-red-500 text-xs uppercase tracking-[0.3em] font-semibold mb-2">Live Experiences</p>
            <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight">Konser Terkini di Database</h2>
          </div>
          <Link
            href="/login"
            className="text-xs uppercase tracking-widest text-zinc-400 hover:text-red-400 flex items-center gap-1.5 group transition-colors"
          >
            Akses Panel Promotor <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-zinc-400 text-sm">Belum ada konser aktif yang dipublikasikan di database.</p>
            <p className="text-zinc-600 text-xs mt-1">Tambahkan konser baru melalui panel admin promotor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((ev, i) => {
              const poster = getImageUrl(ev.poster_url);
              const priceText =
                ev.min_price && Number(ev.min_price) > 0
                  ? `Rp ${Number(ev.min_price).toLocaleString("id-ID")}`
                  : "Cek Kuota";

              return (
                <div
                  key={ev.id}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                  className={`relative bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${
                    activeIdx === i
                      ? "border-red-600/70 shadow-xl shadow-red-950/40 -translate-y-1.5"
                      : "hover:border-zinc-700"
                  }`}
                >
                  {poster && (
                    <div className="w-full h-44 overflow-hidden relative bg-zinc-800">
                      <img
                        src={poster}
                        alt={ev.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-red-500/20 text-red-400 border-red-500/30">
                          {ev.tickets_sold > 0 ? "Tiket Terjual" : "Published"}
                        </span>
                        <span className="text-xs font-mono text-zinc-400">{formatDate(ev.event_date)}</span>
                      </div>
                      <h3 className="text-white text-xl font-bold mb-2 group-hover:text-red-400 transition-colors">
                        {ev.name}
                      </h3>
                      <p className="text-red-400/90 text-xs font-medium mb-3">
                        {ev.artists || "Musisi Panggung"}
                      </p>
                      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-4">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{ev.venue || "Venue Panggung"}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Mulai dari</p>
                        <p className="text-white font-mono font-bold text-base">{priceText}</p>
                      </div>
                      <Link
                        href="/login"
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-red-600 text-zinc-200 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200"
                      >
                        Detail Event
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ── How It Works (Step Flow) ──────────────────────────────
const steps = [
  {
    step: "01",
    title: "Pilih Konser & Kategori",
    desc: "Eksplor jadwal konser artis favorit, cek seat plan dan pilih kategori tiket (VIP, CAT, Festival).",
  },
  {
    step: "02",
    title: "Checkout & Bayar Mudah",
    desc: "Gunakan QRIS, Transfer Bank, atau Kartu Debit dengan sistem kuota aman terintegrasi real-time.",
  },
  {
    step: "03",
    title: "E-Ticket Instan & Scan Gate",
    desc: "QR code e-ticket resmi langsung diterbitkan di akun dan siap di-scan saat memasuki gerbang venue.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 px-8 bg-black border-t border-zinc-900 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="text-red-500 text-xs uppercase tracking-[0.3em] font-semibold mb-3">Seamless Flow</p>
          <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight">Cara Kerja Pemesanan</h2>
          <p className="text-zinc-500 text-sm mt-2">Tiga langkah ringkas mengamankan tiket konser impianmu</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((st) => (
            <div
              key={st.step}
              className="relative p-8 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-red-900/60 transition-all duration-300 group"
            >
              <span className="text-4xl font-extrabold text-zinc-700/60 group-hover:text-red-500/80 transition-colors font-mono block mb-4">
                {st.step}
              </span>
              <h3 className="text-white text-xl font-bold mb-3">{st.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ Accordion ─────────────────────────────────────────
const faqs = [
  {
    q: "Bagaimana cara menerima tiket setelah transaksi selesai?",
    a: "E-ticket dengan QR Code unik langsung tersedia di riwayat pemesanan akun kamu sesaat setelah pembayaran terverifikasi otomatis atau oleh admin.",
  },
  {
    q: "Apakah tiket bisa dipindahtangankan?",
    a: "QR code tiket bersifat unik dan hanya berlaku untuk satu kali scan di gerbang masuk gate validator.",
  },
  {
    q: "Metode pembayaran apa saja yang didukung?",
    a: "LOUDER mendukung pembayaran instan via QRIS semua e-wallet, Virtual Account / Transfer Bank, dan Kartu Debit/Kredit.",
  },
  {
    q: "Bagaimana jika kuota tiket habis?",
    a: "Sistem LOUDER menggunakan transaksi lock real-time, jika kuota habis maka kategori tiket akan otomatis terkunci status 'Sold Out'.",
  },
];

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 px-8 bg-zinc-950 border-t border-zinc-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-red-500 text-xs uppercase tracking-[0.3em] font-semibold mb-3">Support & Help</p>
          <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="text-zinc-500 text-sm mt-2">Pertanyaan umum seputar layanan tiket LOUDER</p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={faq.q}
                className="border border-zinc-800 bg-zinc-900/60 rounded-xl overflow-hidden transition-colors hover:border-zinc-700"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 text-white font-medium text-base focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <span className={`text-red-500 text-xl font-bold transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="relative py-20 px-8 bg-black border-t border-zinc-900 overflow-hidden">
      <div className="max-w-5xl mx-auto relative rounded-3xl p-10 md:p-14 bg-gradient-to-r from-red-950/60 via-zinc-900 to-black border border-red-800/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
            Siap Rasakan Gemuruh Panggung?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Daftar sekarang untuk mendapatkan akses lebih awal (early bird) dan notifikasi tiket konser terpanas di kotamu.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Link
            href="/register"
            className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-lg shadow-red-700/30"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-widest transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      id="footer"
      className="border-t border-zinc-800/60"
      style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #000000 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="flex flex-col gap-4">
          <LouderLogo />
          <p className="text-zinc-500 text-xs leading-relaxed">
            Platform resmi pemesanan tiket festival & konser musik spektakuler di Indonesia.
          </p>
          <div className="flex items-center gap-3 text-zinc-500">
            {[
              <svg key="globe" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5" />
              </svg>,
              <svg key="share" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.5" />
              </svg>,
              <svg key="settings" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.5" />
              </svg>,
            ].map((icon, i) => (
              <a key={i} href="#" className="hover:text-white transition-colors hover:scale-110 inline-block">{icon}</a>
            ))}
          </div>
        </div>

        {[
          { title: "Genre Konser", links: ["Konser Rock", "Festival Electronic EDM", "Indie Pop & Folk", "Jadwal Tur 2026"] },
          { title: "Bantuan & Layanan", links: ["Cara Beli Tiket", "Ketentuan Wristband", "Kebijakan Privasi", "Hubungi Kami"] },
          { title: "Legal", links: ["Syarat & Ketentuan", "Kebijakan Privasi", "Keamanan Transaksi"] },
        ].map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest">{col.title}</h4>
            {col.links.map((item) => (
              <a key={item} href="#" className="text-zinc-500 text-xs hover:text-red-400 transition-colors">{item}</a>
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-800/40 px-8 py-4 max-w-6xl mx-auto flex items-center justify-between">
        <p className="text-zinc-600 text-xs">© 2026 LOUDER Management. All rights reserved.</p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-zinc-500 text-xs hover:text-red-400 transition-colors uppercase tracking-widest"
        >
          Back to Top ↑
        </button>
      </div>
    </footer>
  );
}

// ── Global styles ─────────────────────────────────────────
const globalStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.35; }
  }
  @keyframes floatCard {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes marquee {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }
  .animate-marquee {
    display: flex;
    width: max-content;
    animation: marquee 32s linear infinite;
  }
  .animate-marquee:hover {
    animation-play-state: paused;
  }
`;

// ── Page ──────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <style>{globalStyles}</style>
      <div className="min-h-screen bg-black">
        <Navbar />
        <HeroSection />
        <SponsorsMarqueeSection />
        <CapabilitiesSection />
        <FeaturedEventsSection />
        <HowItWorksSection />
        <FAQSection />
        <CTABanner />
        <Footer />
      </div>
    </>
  );
}
