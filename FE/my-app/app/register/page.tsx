"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

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
      <p className="text-zinc-500 text-xs tracking-widest uppercase">Admin Portal Registration</p>    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Kata sandi tidak cocok.");
      return;
    }
    if (!agreed) {
      setError("Kamu harus menyetujui Syarat & Ketentuan.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({ name: form.name, email: form.email, password: form.password, role: "admin" });
      if (res.ok) {
        router.push("/login");
      } else {
        setError(res.data?.message ?? "Registrasi gagal. Coba lagi.");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (key: string) =>
    `flex items-center gap-3 bg-zinc-800/60 border rounded-lg px-3 py-2.5 transition-all duration-200 ${
      focused === key ? "border-red-500/60 shadow-sm shadow-red-900/30" : "border-zinc-700/60"
    }`;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: "radial-gradient(ellipse at top right, #3b0000 0%, #1a0000 30%, #000000 70%)",
      }}
    >
      {/* background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 top-0 right-0"
          style={{ background: "radial-gradient(circle, #7f1d1d, transparent 70%)", animation: "pulse 5s ease-in-out infinite" }} />
        <div className="absolute w-72 h-72 rounded-full blur-3xl opacity-10 bottom-0 left-0"
          style={{ background: "radial-gradient(circle, #991b1b, transparent 70%)", animation: "pulse 7s ease-in-out infinite reverse" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="relative bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/60">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent rounded-full" />

          <div className="flex flex-col gap-5">
            <LouderLogo />

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-2.5 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Nama Lengkap */}
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Nama Lengkap</label>
                <div className={inputClass("name")}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Nama Admin Lengkap Di Sini"
                    value={form.name}
                    onChange={set("name")}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                    required
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Alamat Email */}
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Alamat Email</label>
                <div className={inputClass("email")}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="email"
                    placeholder="admin@louder.com"
                    value={form.email}
                    onChange={set("email")}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    required
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Kata Sandi */}
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Kata Sandi</label>
                <div className={inputClass("password")}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    value={form.password}
                    onChange={set("password")}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    required
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                  >
                    {showPass ? (
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Kata Sandi */}
              <div>
                <label className="text-zinc-400 text-xs mb-1.5 block">Konfirmasi Kata Sandi</label>
                <div className={inputClass("confirm")}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" className="text-zinc-500 shrink-0">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="password"
                    placeholder="Ulang kata sandi"
                    value={form.confirm}
                    onChange={set("confirm")}
                    onFocus={() => setFocused("confirm")}
                    onBlur={() => setFocused(null)}
                    required
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer group mt-1">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="accent-red-600 mt-0.5 w-3.5 h-3.5 shrink-0"
                />
                <span className="text-zinc-500 text-xs leading-relaxed group-hover:text-zinc-400 transition-colors">
                  Saya menyetujui{" "}
                  <a href="#" className="text-red-400 hover:text-red-300">Syarat & Ketentuan</a>
                  {" "}dan memberikan persetujuan Proses pengambilan...
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full bg-red-700 hover:bg-red-600 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest py-3 rounded-lg transition-all duration-200 overflow-hidden group mt-1"
              >
                <span className={loading ? "opacity-0" : "opacity-100"}>Buat Akun →</span>
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

            <p className="text-center text-zinc-500 text-xs">
              Sudah memiliki akun?{" "}
              <Link href="/login" className="text-red-400 hover:text-red-300 font-medium transition-colors">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
