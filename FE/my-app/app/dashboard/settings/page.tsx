"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FormField, Input, Textarea, SubmitButton } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { userApi } from "@/lib/api";
import { clearAuth } from "@/lib/auth";

type SettingsTab = "profile" | "security" | "notifications" | "team";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited";
}

const DEFAULT_TEAM: TeamMember[] = [
  { id: "tm-1", name: "Sarah Nadira", email: "sarah.nadira@louder.com", role: "Koordinator Tiket & Finansial", status: "active" },
  { id: "tm-2", name: "Rizky Pratama", email: "rizky.pratama@louder.com", role: "Petugas Gate Scanner & Verifikasi", status: "active" },
  { id: "tm-3", name: "Dimas Anggara", email: "dimas.stage@louder.com", role: "Manajer Line-up & Roster Artis", status: "active" },
];

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile Form States
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "LOUDER Concerts Entertainment",
    location: "Jakarta, Indonesia",
    bio: "Penyelenggara festival musik dan konser panggung live berskala nasional.",
    avatar_url: "",
  });

  const [password, setPassword] = useState({ currentPass: "", newPass: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");

  // Security Toggles
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTerminated, setSessionTerminated] = useState(false);

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    orderAlert: true,
    capacityAlert: true,
    dailyDigest: true,
    paymentProof: true,
    artistRegistered: false,
  });
  const [notifMsg, setNotifMsg] = useState("");

  // Team Management
  const [team, setTeam] = useState<TeamMember[]>(DEFAULT_TEAM);
  const [teamModal, setTeamModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "Koordinator Tiket & Finansial" });

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setProfile((prev) => ({
          ...prev,
          name: u.name || "Admin LOUDER",
          email: u.email || "promotor@louder.com",
          phone: u.phone || "+62 812-3456-7890",
          avatar_url: u.avatar_url || "",
        }));
      } catch (e) {
        console.error(e);
      }
    }

    const saved2FA = localStorage.getItem("louder_2fa_enabled");
    if (saved2FA) setTwoFactor(saved2FA === "true");

    const savedNotifs = localStorage.getItem("louder_notif_prefs");
    if (savedNotifs) {
      try {
        setNotifPrefs(JSON.parse(savedNotifs));
      } catch (e) {
        console.error(e);
      }
    }

    const savedTeam = localStorage.getItem("louder_team_members");
    if (savedTeam) {
      try {
        setTeam(JSON.parse(savedTeam));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setProfile((p) => ({ ...p, avatar_url: url }));
      const current = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...current, avatar_url: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const res = await userApi.updateProfile({ name: profile.name, phone: profile.phone });
      const current = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = {
        ...current,
        name: profile.name,
        phone: profile.phone,
        organization: profile.organization,
        location: profile.location,
        bio: profile.bio,
      };
      localStorage.setItem("user", JSON.stringify(updated));

      if (res.ok) {
        setProfileMsg("Profil promotor berhasil diperbarui.");
      } else {
        setProfileMsg("Profil berhasil disimpan di sesi lokal.");
      }
    } catch {
      setProfileMsg("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(""), 4000);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg("");
    if (!password.newPass) {
      setPassMsg("Kata sandi baru tidak boleh kosong.");
      return;
    }
    if (password.newPass.length < 6) {
      setPassMsg("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password.newPass !== password.confirm) {
      setPassMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setSavingPass(true);
    try {
      const res = await userApi.updateProfile({ name: profile.name, password: password.newPass });
      if (res.ok) {
        setPassMsg("Kata sandi berhasil diperbarui.");
        setPassword({ currentPass: "", newPass: "", confirm: "" });
      } else {
        setPassMsg(res.data?.message || "Gagal mengubah kata sandi.");
      }
    } catch {
      setPassMsg("Terjadi kesalahan saat update kata sandi.");
    } finally {
      setSavingPass(false);
      setTimeout(() => setPassMsg(""), 4000);
    }
  };

  const handleToggle2FA = () => {
    const val = !twoFactor;
    setTwoFactor(val);
    localStorage.setItem("louder_2fa_enabled", String(val));
  };

  const handleSaveNotifs = () => {
    localStorage.setItem("louder_notif_prefs", JSON.stringify(notifPrefs));
    setNotifMsg("Preferensi notifikasi berhasil disimpan.");
    setTimeout(() => setNotifMsg(""), 3500);
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;
    const added: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMember.name.trim(),
      email: newMember.email.trim(),
      role: newMember.role,
      status: "invited",
    };
    const updated = [...team, added];
    setTeam(updated);
    localStorage.setItem("louder_team_members", JSON.stringify(updated));
    setNewMember({ name: "", email: "", role: "Koordinator Tiket & Finansial" });
    setTeamModal(false);
  };

  const handleRemoveTeamMember = (id: string) => {
    const updated = team.filter((m) => m.id !== id);
    setTeam(updated);
    localStorage.setItem("louder_team_members", JSON.stringify(updated));
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-850">
        <h1 className="text-white text-xl font-bold tracking-tight">Pengaturan Akun & Konsol</h1>
        <p className="text-zinc-400 text-xs mt-1">
          Kelola profil identitas promotor, keamanan kata sandi, preferensi pemberitahuan, dan tim operasional.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2-column Settings Form Area */}
        <div className="lg:col-span-2 space-y-5">
          {/* Settings Navigation Tabs */}
          <div className="flex items-center gap-1.5 border-b border-zinc-800/80 pb-2 overflow-x-auto scrollbar-none">
            {[
              { key: "profile", label: "Profil Promotor" },
              { key: "security", label: "Keamanan Akun" },
              { key: "notifications", label: "Preferensi Notifikasi" },
              { key: "team", label: "Tim & Panitia" },
            ].map((t) => {
              const isSel = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as SettingsTab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                    isSel
                      ? "bg-zinc-800 text-white border border-zinc-700"
                      : "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
                  }`}
                >
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: PROFIL PROMOTOR */}
          {activeTab === "profile" && (
            <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-6 shadow-sm space-y-5">
              {/* Profile Card Header with Avatar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 border-b border-zinc-800/60">
                <div className="relative group shrink-0">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-red-600/60"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-red-500 text-2xl font-bold">
                      {profile.name ? profile.name.slice(0, 2).toUpperCase() : "AD"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    Ubah Foto
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-white font-semibold text-base leading-tight">
                      {profile.name || "Admin Promotor"}
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-red-600/15 text-red-400 border border-red-500/30 text-[9px] font-mono font-medium uppercase tracking-wider">
                      Promotor Utama
                    </span>
                  </div>
                  <p className="text-zinc-400 text-xs mt-0.5">{profile.organization}</p>
                  <p className="text-zinc-500 text-xs font-mono mt-0.5">{profile.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-medium transition cursor-pointer self-start sm:self-auto"
                >
                  Ganti Foto
                </button>
              </div>

              {profileMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5 text-emerald-400 text-xs">
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Nama Lengkap Promotor">
                    <Input
                      required
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Nama Lengkap"
                    />
                  </FormField>

                  <FormField label="Entitas / Nama Perusahaan Promotor">
                    <Input
                      required
                      value={profile.organization}
                      onChange={(e) => setProfile((p) => ({ ...p, organization: e.target.value }))}
                      placeholder="Contoh: Louder Entertainment"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Alamat Email Akun">
                    <Input
                      disabled
                      type="email"
                      value={profile.email}
                      className="opacity-60 cursor-not-allowed bg-zinc-900 font-mono"
                      placeholder="email@louder.com"
                    />
                  </FormField>

                  <FormField label="Nomor WhatsApp / Kontak">
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+62 8..."
                    />
                  </FormField>
                </div>

                <FormField label="Domisili & Wilayah Operasional">
                  <Input
                    value={profile.location}
                    onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Contoh: Jakarta Pusat, DKI Jakarta"
                  />
                </FormField>

                <FormField label="Profil Singkat Promotor">
                  <Textarea
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Deskripsi peran dan fokus konser musik yang Anda kelola..."
                  />
                </FormField>

                <div className="flex justify-end pt-3 border-t border-zinc-800/60">
                  <div className="w-auto">
                    <SubmitButton loading={savingProfile}>
                      Simpan Perubahan Profil
                    </SubmitButton>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: KEAMANAN AKUN */}
          {activeTab === "security" && (
            <div className="space-y-5">
              {/* Password Change Form */}
              <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-white font-semibold text-sm">Ganti Kata Sandi</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Gunakan minimal 6 karakter kombinasi huruf dan angka untuk keamanan konsol promotor Anda.
                  </p>
                </div>

                {passMsg && (
                  <div
                    className={`rounded-lg px-4 py-2 text-xs border ${
                      passMsg.includes("berhasil")
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}
                  >
                    {passMsg}
                  </div>
                )}

                <form onSubmit={handlePassword} className="space-y-4">
                  <FormField label="Kata Sandi Saat Ini">
                    <Input
                      type="password"
                      value={password.currentPass}
                      onChange={(e) => setPassword((p) => ({ ...p, currentPass: e.target.value }))}
                      placeholder="Masukkan kata sandi lama"
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Kata Sandi Baru">
                      <Input
                        type="password"
                        value={password.newPass}
                        onChange={(e) => setPassword((p) => ({ ...p, newPass: e.target.value }))}
                        placeholder="Minimal 6 karakter"
                      />
                    </FormField>
                    <FormField label="Ulangi Kata Sandi Baru">
                      <Input
                        type="password"
                        value={password.confirm}
                        onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                        placeholder="Konfirmasi kata sandi"
                      />
                    </FormField>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-zinc-800/60">
                    <div className="w-auto">
                      <SubmitButton loading={savingPass}>
                        Perbarui Kata Sandi
                      </SubmitButton>
                    </div>
                  </div>
                </form>
              </div>

              {/* Two-Factor Authentication Box */}
              <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-6 shadow-sm flex items-center justify-between">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm">Verifikasi Dua Langkah (2FA)</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-medium uppercase tracking-wider border ${
                        twoFactor
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {twoFactor ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs mt-1">
                    Memerlukan kode konfirmasi tambahan saat masuk ke konsol promotor untuk perlindungan tiket dan transaksi.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={handleToggle2FA}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Active Sessions List */}
              <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-sm">Riwayat Perangkat Masuk</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">Daftar sesi peramban yang sedang aktif.</p>
                  </div>
                  {!sessionTerminated && (
                    <button
                      type="button"
                      onClick={() => setSessionTerminated(true)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium transition cursor-pointer"
                    >
                      Keluar dari Sesi Lain
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.5" />
                          <path d="M8 21h8M12 17v4" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white text-xs font-semibold">Chrome pada Windows 11</p>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-emerald-400 text-[10px] font-mono">Sesi Ini (Aktif)</span>
                        </div>
                        <p className="text-zinc-500 text-[11px] mt-0.5">Jakarta, Indonesia • IP 180.252.xxx.xxx</p>
                      </div>
                    </div>
                  </div>

                  {!sessionTerminated ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="1.5" />
                            <path d="M12 18h.01" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-zinc-300 text-xs font-semibold">Safari pada iPhone 15 Pro</p>
                          <p className="text-zinc-500 text-[11px] mt-0.5">Aktif 3 jam lalu • Jakarta, Indonesia</p>
                        </div>
                      </div>
                      <span className="text-zinc-500 text-xs font-mono">Aktif</span>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-zinc-500 text-xs bg-zinc-950/40 rounded-lg border border-zinc-850">
                      Seluruh sesi peramban di perangkat lain telah diakhiri.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENSI NOTIFIKASI */}
          {activeTab === "notifications" && (
            <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-white font-semibold text-sm">Preferensi Pemberitahuan Promotor</h2>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Tentukan pembaruan dan peringatan tiket yang ingin Anda terima secara langsung.
                </p>
              </div>

              {notifMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2.5 text-emerald-400 text-xs">
                  {notifMsg}
                </div>
              )}

              <div className="space-y-3.5 divide-y divide-zinc-850">
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-semibold">Pemberitahuan Pesanan Tiket Masuk</p>
                    <p className="text-zinc-500 text-[11px] mt-0.5">
                      Dapatkan notifikasi langsung setiap ada customer melakukan pemesanan tiket.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.orderAlert}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, orderAlert: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="pt-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-semibold">Peringatan Kuota Tiket Menipis</p>
                    <p className="text-zinc-500 text-[11px] mt-0.5">
                      Kirim sinyal tanda bahaya saat sisa kuota tiket konser kurang dari 20%.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.capacityAlert}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, capacityAlert: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="pt-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-semibold">Verifikasi Pembayaran Pelanggan</p>
                    <p className="text-zinc-500 text-[11px] mt-0.5">
                      Alert saat customer mengunggah bukti bayar yang memerlukan konfirmasi admin.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.paymentProof}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, paymentProof: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="pt-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-white text-xs font-semibold">Laporan Ringkasan Penjualan Harian</p>
                    <p className="text-zinc-500 text-[11px] mt-0.5">
                      Kompilasi omset harian dan rekap tiket konser setiap pukul 23:59 WIB.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.dailyDigest}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, dailyDigest: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={handleSaveNotifs}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Simpan Pengaturan Notifikasi
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: TIM & PANITIA */}
          {activeTab === "team" && (
            <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-white font-semibold text-sm">Tim Promotor & Panitia Acara</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    Kelola kru yang memiliki wewenang mengelola penjualan tiket dan scan gate konser.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTeamModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer self-start sm:self-auto"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  <span>Undang Anggota Panitia</span>
                </button>
              </div>

              {/* Team list */}
              <div className="space-y-2.5">
                {/* Admin owner */}
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                      {profile.name ? profile.name.slice(0, 1).toUpperCase() : "A"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white text-xs font-semibold">{profile.name || "Admin LOUDER"}</p>
                        <span className="bg-red-600/15 border border-red-500/30 text-red-400 text-[9px] font-mono font-medium px-1.5 py-0.2 rounded">
                          Pemilik Konsol
                        </span>
                      </div>
                      <p className="text-zinc-500 text-[11px] font-mono mt-0.5">{profile.email}</p>
                    </div>
                  </div>
                  <span className="text-zinc-400 text-xs font-medium">Akses Penuh</span>
                </div>

                {team.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold">
                        {member.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white text-xs font-semibold">{member.name}</p>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                              member.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {member.status === "active" ? "Aktif" : "Menunggu Konfirmasi"}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-[11px] font-mono mt-0.5">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 text-xs hidden sm:block">{member.role}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(member.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded transition cursor-pointer"
                        title="Hapus Akses Panitia"
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                          <polyline points="3 6 5 6 21 6" strokeLinecap="round" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sesi Akun / Logout Box */}
          <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-semibold">Keluar dari Akun Promotor</p>
              <p className="text-zinc-500 text-[11px] mt-0.5">Akhiri sesi aktif konsol pada peramban ini.</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/30 border border-zinc-800 hover:border-red-800/40 text-zinc-300 hover:text-red-400 text-xs font-medium transition cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Sidebar Info & Status Cards */}
        <div className="space-y-4">
          {/* Executive Identification Card */}
          <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-red-500 text-lg font-bold shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  profile.name ? profile.name.slice(0, 2).toUpperCase() : "AD"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate leading-tight">{profile.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 text-[10px] font-mono">Promotor Resmi</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-850 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Organisasi:</span>
                <span className="text-zinc-200 font-medium truncate max-w-[150px]">{profile.organization}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Tingkat Hak Akses:</span>
                <span className="text-white font-mono font-medium">Administrator</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Musim Konser:</span>
                <span className="text-zinc-300 font-mono">2026</span>
              </div>
            </div>
          </div>

          {/* Account Health & Security Checklist */}
          <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-xs font-semibold uppercase tracking-wider font-mono">
                Kesehatan Akun
              </h3>
              <span className="text-emerald-400 text-xs font-mono font-bold">
                {twoFactor ? "100%" : "85%"}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-zinc-850 overflow-hidden">
              <div
                className="h-full bg-red-600 rounded-full transition-all duration-300"
                style={{ width: twoFactor ? "100%" : "85%" }}
              />
            </div>

            <ul className="text-xs text-zinc-400 space-y-2.5 pt-1">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Alamat email terverifikasi</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Kata sandi memenuhi standar</span>
              </li>
              <li className="flex items-center gap-2">
                {twoFactor ? (
                  <>
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>2FA aktif & terlindungi</span>
                  </>
                ) : (
                  <>
                    <span className="text-amber-400 font-bold">!</span>
                    <span className="text-zinc-400">2FA belum diaktifkan</span>
                  </>
                )}
              </li>
            </ul>
          </div>

          {/* Guidelines Box */}
          <div className="bg-[#0b0c0f] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-2.5">
            <h3 className="text-white text-xs font-semibold uppercase tracking-wider font-mono">
              Prosedur Panitia
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Seluruh perubahan kuota tiket konser dan penerbitan e-ticket tercatat di audit log. Pastikan pembagian hak akses kru sesuai bidang tanggung jawab panggung.
            </p>
          </div>
        </div>
      </div>

      {/* Invite Team Member Modal */}
      <Modal open={teamModal} onClose={() => setTeamModal(false)} title="Undang Anggota Panitia Konser">
        <form onSubmit={handleAddTeamMember} className="space-y-4">
          <FormField label="Nama Lengkap Panitia">
            <Input
              required
              value={newMember.name}
              onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))}
              placeholder="Contoh: Budi Santoso"
            />
          </FormField>

          <FormField label="Alamat Email">
            <Input
              required
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember((m) => ({ ...m, email: e.target.value }))}
              placeholder="budi@louder.com"
            />
          </FormField>

          <FormField label="Posisi / Peran Tugas">
            <select
              value={newMember.role}
              onChange={(e) => setNewMember((m) => ({ ...m, role: e.target.value }))}
              className="bg-zinc-950 border border-zinc-800 text-white text-xs px-3 py-2 rounded-md outline-none focus:border-red-600 transition cursor-pointer w-full"
            >
              <option value="Koordinator Tiket & Finansial">Koordinator Tiket & Finansial</option>
              <option value="Petugas Gate Scanner & Verifikasi">Petugas Gate Scanner & Verifikasi</option>
              <option value="Manajer Line-up & Roster Artis">Manajer Line-up & Roster Artis</option>
              <option value="Staf Produksi Panggung">Staf Produksi Panggung</option>
            </select>
          </FormField>

          <div className="flex gap-2.5 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setTeamModal(false)}
              className="flex-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-medium py-2 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-2 rounded-lg transition cursor-pointer"
            >
              Kirim Undangan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
