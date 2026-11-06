"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { getToken, getStoredUser } from "@/lib/auth";

function LouderLogo() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="text-red-500">
          <rect x="1" y="6" width="2" height="8" fill="currentColor" />
          <rect x="5" y="3" width="2" height="14" fill="currentColor" />
          <rect x="9" y="1" width="2" height="18" fill="currentColor" />
          <rect x="13" y="3" width="2" height="14" fill="currentColor" />
          <rect x="17" y="6" width="2" height="8" fill="currentColor" />
        </svg>
        <span className="text-white font-bold text-xl tracking-widest uppercase">Louder</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    
    if (token && user?.role === "admin") {
      router.replace("/dashboard");
    } else if (token && user?.role === "customer") {
      router.replace("/events");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.login(email, password);

      if (!res.ok) {
        setError(res.data?.message ?? "Login gagal. Periksa email dan kata sandi.");
        setLoading(false);
        return;
      }

      const { token, user } = res.data;

      // Store credentials
      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      // Role-based routing: admin ke /dashboard, user/customer ke mobile/landingpage
      if (user?.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/events");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at top left, #3b0000 0%, #1a0000 30%, #000000 70%)" }}
    >
      {/* background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 top-0 left-0"
          style={{ background: "radial-gradient(circle, #7f1d1d, transparent 70%)", animation: "pulse 5s ease-in-out infinite" }} />
        <div className="absolute w-72 h-72 rounded-full blur-3xl opacity-10 bottom-0 right-0"
          style={{ background: "radial-gradient(circle, #991b1b, transparent 70%)", animation: "pulse 7s ease-in-out infinite reverse" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="relative bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/60">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent rounded-full" />

          <div className="flex flex-col gap-6">
            <LouderLogo />

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-2.5 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div className={`flex items-center gap-3 bg-zinc-800/60 border rounded-lg px-3 py-2.5 transition-all duration-200 ${focused === "email" ? "border-red-500/60 shadow-sm shadow-red-900/30" : "border-zinc-700/60"}`}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="email"
                  placeholder="email@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  required
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                />
              </div>

              {/* Password */}
              <div className={`flex items-center gap-3 bg-zinc-800/60 border rounded-lg px-3 py-2.5 transition-all duration-200 ${focused === "password" ? "border-red-500/60 shadow-sm shadow-red-900/30" : "border-zinc-700/60"}`}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  required
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500">
                <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-300 transition-colors">
                  <input type="checkbox" className="accent-red-600 w-3.5 h-3.5" />
                  Ingat saya
                </label>
                <a href="#" className="hover:text-red-400 transition-colors">Lupa kata sandi?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full bg-red-700 hover:bg-red-600 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest py-3 rounded-lg transition-all duration-200 overflow-hidden group mt-1"
              >
                <span className={loading ? "opacity-0" : "opacity-100"}>Masuk →</span>
                {loading && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </span>
                )}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </button>
            </form>

            <p className="text-center text-zinc-600 text-xs">© 2024 LOUDER Management</p>
          </div>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-5">
          Belum punya akun?{" "}
          <Link href="/register" className="text-red-400 hover:text-red-300 font-medium transition-colors">
            Daftar di sini
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.35; } }
      `}</style>
    </div>
  );
}
