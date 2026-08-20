"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

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
        <a href="#capabilities" className="hover:text-white transition-colors relative group">
          Capabilities
          <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-500 group-hover:w-full transition-all duration-300" />
        </a>
        <a href="#footer" className="hover:text-white transition-colors relative group">
          Resources
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
          label="Events Live"
          value="248"
          labelColor="text-blue-400"
          glowColor="rgba(59,130,246,0.25)"
          borderHover="hover:border-blue-500/60"
          floatDelay="0s"
        />
      </div>

      {/* Revenue — right */}
      <div className="absolute" style={{ top: "60px", right: "30px" }}>
        <StatCard
          label="Revenue"
          value="$4.2M"
          labelColor="text-red-400"
          glowColor="rgba(185,28,28,0.4)"
          borderHover="hover:border-red-600/70"
          floatDelay="1s"
        />
      </div>

      {/* Artists — bottom */}
      <div className="absolute" style={{ bottom: "16px", left: "80px" }}>
        <StatCard
          label="Artists"
          value="1,024"
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
              Command the Stage.
            </h1>
            <h1
              className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight"
              style={{
                background: "linear-gradient(90deg, #ef4444, #b91c1c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Control the Core.
            </h1>
          </div>

          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
            The centralized administrative framework for high-performance event
            operations, artist management, and ticket orchestration. Precision
            engineered for scale.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest transition-all duration-200 relative overflow-hidden"
            >
              <span className="relative z-10">Authenticate Access →</span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </Link>
            <a
              href="#capabilities"
              className="text-zinc-500 text-xs uppercase tracking-widest hover:text-white transition-colors"
            >
              Learn more ↓
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
    title: "Event Operations",
    desc: "Comprehensive CRUD controls for global event scheduling, venue logistics, and timeline management.",
  },
  {
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" className="text-red-500">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 21v-1a7 7 0 0 1 7-7h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Artist Rosters",
    desc: "Centralized directory for talent profiles, contract status, rider requirements, and financial disbursements.",
  },
  {
    icon: (
      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" className="text-red-500">
        <path d="M3 17l4-6 4 4 4-8 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    title: "Live Analytics",
    desc: "Real-time telemetry on ticket sales velocity, revenue clustering, and audience demographic shifts.",
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
          <p className="text-red-500 text-xs uppercase tracking-[0.3em] mb-3">Platform</p>
          <h2 className="text-white text-3xl font-semibold">System Capabilities</h2>
          <p className="text-zinc-500 text-sm mt-2">Core operational modules overview</p>
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
            The definitive administrative framework for high-performance event operations and artist management.
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
          { title: "Resources", links: ["Documentation", "API Reference", "System Status", "Security"] },
          { title: "Support", links: ["Help Center", "Contact Us", "Developer Portal"] },
          { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
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
        <p className="text-zinc-600 text-xs">© 2024 LOUDER Management. All rights reserved.</p>
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
`;

// ── Page ──────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <style>{globalStyles}</style>
      <div className="min-h-screen bg-black">
        <Navbar />
        <HeroSection />
        <CapabilitiesSection />
        <Footer />
      </div>
    </>
  );
}
