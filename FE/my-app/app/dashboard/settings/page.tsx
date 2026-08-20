"use client";

import { useState, useEffect } from "react";
import { FormField, Input, SubmitButton } from "@/components/ui/input";

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [password, setPassword] = useState({ current: "", newPass: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      setProfile({ name: parsed.name ?? "", email: parsed.email ?? "" });
    }
  }, []);

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    // Update local only for now (connect to userApi when needed)
    const user = JSON.parse(localStorage.getItem("user") ?? "{}");
    localStorage.setItem("user", JSON.stringify({ ...user, ...profile }));
    setProfileMsg("Profile updated.");
    setSavingProfile(false);
    setTimeout(() => setProfileMsg(""), 3000);
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.newPass !== password.confirm) { setPassMsg("Passwords do not match."); return; }
    setSavingPass(true);
    // Placeholder — wire to API when endpoint available
    setTimeout(() => {
      setPassMsg("Password updated successfully.");
      setSavingPass(false);
      setPassword({ current: "", newPass: "", confirm: "" });
      setTimeout(() => setPassMsg(""), 3000);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-white font-semibold text-lg">Settings</h1>
        <p className="text-zinc-500 text-xs mt-0.5">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-white font-medium text-sm mb-4">Profile Information</h2>
        {profileMsg && <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg px-4 py-2 text-emerald-400 text-xs mb-4">{profileMsg}</div>}
        <form onSubmit={handleProfile} className="flex flex-col gap-4">
          <FormField label="Display Name"><Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Your name" /></FormField>
          <FormField label="Email"><Input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} placeholder="your@email.com" /></FormField>
          <div className="flex justify-end"><div className="w-40"><SubmitButton loading={savingProfile}>Save Profile</SubmitButton></div></div>
        </form>
      </div>

      {/* Password */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-white font-medium text-sm mb-4">Change Password</h2>
        {passMsg && (
          <div className={`border rounded-lg px-4 py-2 text-xs mb-4 ${passMsg.includes("match") || passMsg.includes("not") ? "bg-red-900/30 border-red-700/50 text-red-400" : "bg-emerald-900/30 border-emerald-700/50 text-emerald-400"}`}>
            {passMsg}
          </div>
        )}
        <form onSubmit={handlePassword} className="flex flex-col gap-4">
          <FormField label="Current Password"><Input type="password" value={password.current} onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))} placeholder="••••••••" /></FormField>
          <FormField label="New Password"><Input type="password" value={password.newPass} onChange={(e) => setPassword((p) => ({ ...p, newPass: e.target.value }))} placeholder="••••••••" /></FormField>
          <FormField label="Confirm New Password"><Input type="password" value={password.confirm} onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" /></FormField>
          <div className="flex justify-end"><div className="w-48"><SubmitButton loading={savingPass}>Update Password</SubmitButton></div></div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-zinc-900 border border-red-900/30 rounded-xl p-6">
        <h2 className="text-red-400 font-medium text-sm mb-1">Danger Zone</h2>
        <p className="text-zinc-500 text-xs mb-4">These actions are irreversible. Please proceed with caution.</p>
        <button className="bg-red-900/20 hover:bg-red-900/40 border border-red-700/40 text-red-400 text-xs font-semibold px-4 py-2 rounded-lg transition-all">
          Delete Account
        </button>
      </div>
    </div>
  );
}
