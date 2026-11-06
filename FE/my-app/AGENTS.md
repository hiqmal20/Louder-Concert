# FE AGENT RULES & CONVENTIONS — LOUDER FRONTEND

Pedoman AI/Agent saat mengembangkan fitur pada Frontend Next.js LOUDER:

## 1. Stack & Runtime Rules
- Framework: Next.js 16 (App Router) + React 19 + TypeScript.
- Perhatikan breaking changes di Next.js App Router; jangan gunakan pola legacy Pages Router (`getServerSideProps`, `router.push` dari `next/router`). Gunakan `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`).
- Tambahkan direktif `"use client";` di baris paling atas untuk komponen yang menggunakan React hooks (`useState`, `useEffect`), browser API (`localStorage`, `window`), atau event handlers.

## 2. API Communication Rules
- Selalu gunakan wrapper yang sudah disediakan di `@/lib/api`:
  - `apiFetch("/endpoint", { method: "POST", body: JSON.stringify(payload) })` untuk data JSON.
  - `apiUpload("/endpoint", formData, "POST")` untuk file upload.
  - `getImageUrl(relativePath)` untuk merender gambar dari backend.
- Jangan hardcode IP/port sembarangan di komponen UI; gunakan path relatif `/endpoint` melalui helper `lib/api.tsx`.

## 3. Component Architecture & UI Conventions
- Utamakan konsistensi UI menggunakan Tailwind CSS v4.
- Hindari menambahkan library UI raksasa tanpa instruksi; maksimalkan yang sudah ada (`lucide-react`, `recharts`, Tailwind).
- Komponen input/modal dibuat reusable di dalam folder `components/ui/`.
- Halaman dashboard admin harus selalu dibungkus atau diproteksi dengan `<AuthGuard allowedRoles={["admin"]}>` atau pengecekan auth yang sesuai.

## 4. Skills Reference & Tooling
Project ini telah terintegrasi dengan skill standar agent:
- `frontend-design`: Digunakan untuk mereferensikan standar desain UI modern, responsif, dan bebas dari AI slop.
- `agent-browser`: Pengujian dan visualisasi alur browser jika diperlukan.
- `caveman`: Komunikasi ringkas dan fokus langsung pada esensi teknis.
- `mattpocock/skills`: Kumpulan skill arsitektur kode, diagnostik bug, spec-to-tickets, dan standard TypeScript modular.

## 5. Verification Commands
- Jalankan pemeriksaan lint & type sebelum selesai:
  - `npm run lint` (ESLint)
  - `npx tsc --noEmit` (TypeScript Typecheck)
