"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ticketApi, orderApi, getImageUrl } from "@/lib/api";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

// ── Web Audio Beep Feedback (Unlocked on user interaction) ──────────────────
let globalAudioCtx: AudioContext | null = null;

function unlockAudioContext() {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().catch(() => {});
    }
  } catch (_) {}
}

function playSound(type: "success" | "warning" | "error") {
  try {
    unlockAudioContext();
    const ctx = globalAudioCtx;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.0, now + 0.08); // A5 (Chime cerah)
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "warning") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.type = "square";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.setValueAtTime(180, now + 0.15);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (_) {
    // Audio context not allowed or unsupported
  }
}

interface ScanResult {
  success: boolean;
  status: "success" | "already_used" | "void" | "not_found" | "unpaid" | "error";
  message: string;
  ticket?: any;
  order?: any;
  timestamp?: string;
  rawCode?: string;
}

export default function GateScannerPage() {
  const [activeTab, setActiveTab] = useState<"camera" | "manual" | "file">("camera");
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, used: 0, valid: 0 });
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [recentVerifiedOrders, setRecentVerifiedOrders] = useState<any[]>([]);

  // Feedback Visual Realtime saat QR terdeteksi
  const [scanFlash, setScanFlash] = useState(false);
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);

  // Buka kunci AudioContext saat interaksi pertama halaman
  useEffect(() => {
    const handleUserInteraction = () => {
      unlockAudioContext();
    };
    window.addEventListener("click", handleUserInteraction, { once: true });
    window.addEventListener("touchstart", handleUserInteraction, { once: true });
    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  // Load stats & recent scans
  const loadStatsAndHistory = useCallback(async () => {
    try {
      const [statsRes, scansRes, ordersRes] = await Promise.allSettled([
        ticketApi.getStats(),
        ticketApi.getRecentScans(15),
        orderApi.getAll(),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (scansRes.status === "fulfilled" && Array.isArray(scansRes.value?.data)) {
        setRecentScans(scansRes.value.data);
      }
      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value?.data)) {
        const verified = ordersRes.value.data.filter(
          (o: any) => o.status === "verified" || o.status === "completed"
        );
        setRecentVerifiedOrders(verified.slice(0, 5));
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadStatsAndHistory();
  }, [loadStatsAndHistory]);

  // Enumerate cameras (tanpa menampilkan error premature saat load awal)
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        if (typeof window === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
          return;
        }
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prioritaskan kamera belakang (environment) jika di HP/ponsel
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear") ||
              d.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      } catch (err) {
        // Jangan langsung tampilkan banner error saat awal load,
        // karena izin kamera biasanya baru diminta saat tombol ditekan
        console.log("Menunggu izin kamera dari user.");
      }
    };
    fetchCameras();
  }, []);

  // Process a scanned QR code string
  const handleProcessCode = useCallback(
    async (codeString: string) => {
      if (isProcessingRef.current || !codeString) return;
      isProcessingRef.current = true;
      setLoading(true);

      // 1. Trigger Visual & Audio Feedback Seketika Kamera Mendeteksi QR
      setLastDetectedCode(codeString);
      setScanFlash(true);
      setTimeout(() => setScanFlash(false), 900);

      // Suara deteksi langsung & getaran
      playSound("success");
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try { navigator.vibrate(150); } catch (_) {}
      }

      try {
        const res = await ticketApi.validate(codeString);

        if (res.ok && res.data?.success) {
          playSound("success");
          setCurrentResult({
            success: true,
            status: "success",
            message: res.data.message || "CHECK-IN BERHASIL! Tiket resmi terverifikasi.",
            ticket: res.data.ticket,
            timestamp: new Date().toLocaleTimeString("id-ID", { hour12: false }),
            rawCode: codeString,
          });
          loadStatsAndHistory();
        } else {
          const status = res.data?.status || "error";
          if (status === "already_used") {
            playSound("warning");
            setCurrentResult({
              success: false,
              status: "already_used",
              message: res.data?.message || "TIKET SUDAH PERNAH DIGUNAKAN!",
              ticket: res.data?.ticket,
              timestamp: new Date().toLocaleTimeString("id-ID", { hour12: false }),
              rawCode: codeString,
            });
          } else {
            playSound("error");
            setCurrentResult({
              success: false,
              status: status,
              message: res.data?.message || "Tiket tidak valid atau tidak ditemukan.",
              ticket: res.data?.ticket,
              order: res.data?.order,
              timestamp: new Date().toLocaleTimeString("id-ID", { hour12: false }),
              rawCode: codeString,
            });
          }
        }
      } catch (err: any) {
        playSound("error");
        setCurrentResult({
          success: false,
          status: "error",
          message: err?.message || "Terjadi kesalahan saat validasi tiket.",
          rawCode: codeString,
        });
      } finally {
        setLoading(false);
        // Cooldown 2 seconds before next scan
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 2200);
      }
    },
    [loadStatsAndHistory]
  );

  // Start Camera with resilient fallback (supports both mobile rear camera & laptop webcam)
  const startCamera = useCallback(async () => {
    setCameraError(null);
    unlockAudioContext();

    // 1. Validasi Keamanan Protokol (HTTPS / localhost)
    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setCameraError(
        "Akses kamera diblokir browser karena halaman dibuka melalui HTTP non-aman (misal IP http://192.168.x.x di HP). Browser mewajibkan koneksi HTTPS atau http://localhost:3000 untuk mengaktifkan kamera."
      );
      return;
    }

    // 2. Validasi Dukungan MediaDevices Browser
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "Browser ini tidak mendukung atau membatasi API Kamera. Gunakan browser Google Chrome / Safari versi terbaru."
      );
      return;
    }

    // 3. Pastikan elemen DOM #reader sudah tersedia
    const readerElement = document.getElementById("reader");
    if (!readerElement) {
      setCameraError("Elemen pemindai belum selesai dimuat. Silakan coba lagi.");
      return;
    }

    // 4. Bersihkan instance scanner lama jika ada
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (_) {}
      html5QrCodeRef.current = null;
    }

    const scannerInstance = new Html5Qrcode("reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
      verbose: false,
    });
    html5QrCodeRef.current = scannerInstance;

    const qrConfig = {
      fps: 15,
      // Omit qrbox agar pemindaian dilakukan ke seluruh area kamera (Full-Frame Scan)
      // Menghilangkan batasan kotak sempit sehingga deteksi QR menjadi sangat cepat dan responsif
      videoConstraints: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
      },
    };

    // 5. Urutan Percobaan Kamera (Fallback Otomatis)
    // Upaya 1: Kamera pilihan user atau kamera belakang
    const initialTarget = selectedCameraId
      ? selectedCameraId
      : cameras.length > 0
      ? cameras[0].id
      : { facingMode: "environment" };

    try {
      await scannerInstance.start(
        initialTarget,
        qrConfig,
        (decodedText) => handleProcessCode(decodedText),
        () => {}
      );
      setIsScanning(true);
    } catch (err1: any) {
      console.warn("Upaya kamera pertama gagal, mencoba fallback ke webcam depan:", err1);

      // Upaya 2: Fallback ke kamera depan / webcam bawaan laptop (facingMode: 'user')
      try {
        await scannerInstance.start(
          { facingMode: "user" },
          qrConfig,
          (decodedText) => handleProcessCode(decodedText),
          () => {}
        );
        setIsScanning(true);
      } catch (err2: any) {
        console.warn("Upaya fallback kamera depan gagal, mencoba query perangkat langsung:", err2);

        // Upaya 3: Cari perangkat kamera apa pun yang terdeteksi
        try {
          const freshDevices = await Html5Qrcode.getCameras();
          if (freshDevices && freshDevices.length > 0) {
            setCameras(freshDevices);
            await scannerInstance.start(
              freshDevices[0].id,
              qrConfig,
              (decodedText) => handleProcessCode(decodedText),
              () => {}
            );
            setIsScanning(true);
          } else {
            throw new Error("Tidak ada perangkat webcam atau kamera yang terdeteksi.");
          }
        } catch (err3: any) {
          const finalErr = err3 || err2 || err1;
          const errName = finalErr?.name || "";
          const errMsg = finalErr?.message || "";

          if (errName === "NotAllowedError" || errMsg.includes("Permission")) {
            setCameraError(
              "Izin kamera ditolak oleh browser. Klik ikon gembok / kamera di sebelah URL browser dan pilih 'Izinkan' (Allow)."
            );
          } else if (errName === "NotReadableError" || errMsg.includes("in use")) {
            setCameraError(
              "Kamera sedang dipakai oleh aplikasi lain (seperti Zoom, Google Meet, atau Teams). Tutup aplikasi tersebut lalu coba lagi."
            );
          } else if (errName === "OverconstrainedError") {
            setCameraError(
              "Resolusi atau tipe kamera yang diminta tidak didukung oleh perangkat ini."
            );
          } else {
            setCameraError(
              errMsg || "Gagal membuka kamera. Pastikan izin kamera sudah diberikan."
            );
          }
          setIsScanning(false);
        }
      }
    }
  }, [selectedCameraId, cameras, handleProcessCode]);

  // Stop Camera
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (_) {}
    }
    setIsScanning(false);
  }, []);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (_) {}
      }
    };
  }, []);

  // Handle file scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const scanner = html5QrCodeRef.current || new Html5Qrcode("reader-file-temp");
      const decodedText = await scanner.scanFile(file, true);
      handleProcessCode(decodedText);
    } catch (err: any) {
      playSound("error");
      setCurrentResult({
        success: false,
        status: "not_found",
        message: "QR Code tidak terbaca pada gambar yang diunggah. Pastikan gambar tajam dan jelas.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header & Gate Overview ────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-500 font-bold">
              Gate Access Control • LOUDER Live
            </span>
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight mt-1">
            Gate Pass & QR Ticket Scanner
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Validasi tiket masuk konser, pembacaan QR pass real-time, dan pemeriksaan kuota gerbang.
          </p>
        </div>

        {/* Counter Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl">
            <p className="text-[10px] uppercase font-mono text-zinc-500">Total Check-In</p>
            <p className="text-emerald-400 text-xl font-mono font-bold mt-0.5">
              {stats.used}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl">
            <p className="text-[10px] uppercase font-mono text-zinc-500">Tiket Aktif</p>
            <p className="text-blue-400 text-xl font-mono font-bold mt-0.5">
              {stats.valid}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl">
            <p className="text-[10px] uppercase font-mono text-zinc-500">Total Diterbitkan</p>
            <p className="text-white text-xl font-mono font-bold mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Scanner Interface ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scanner & Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Scanner Tab Selection */}
          <div className="flex items-center gap-2 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
            <button
              onClick={() => {
                setActiveTab("camera");
                stopCamera();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === "camera"
                  ? "bg-red-600 text-white shadow-md shadow-red-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Kamera Live
            </button>
            <button
              onClick={() => {
                setActiveTab("manual");
                stopCamera();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === "manual"
                  ? "bg-red-600 text-white shadow-md shadow-red-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Input Kode / Barcode
            </button>
            <button
              onClick={() => {
                setActiveTab("file");
                stopCamera();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === "file"
                  ? "bg-red-600 text-white shadow-md shadow-red-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Gambar QR
            </button>
          </div>

          {/* Tab 1: Live Camera Scanner */}
          {activeTab === "camera" && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isScanning ? "bg-emerald-400 animate-ping" : "bg-zinc-600"}`} />
                  <span className="text-white text-sm font-bold">
                    {isScanning ? "Pemindai Aktif • Arahkan QR ke Kamera" : "Pemindai Siap"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {cameras.length > 1 && (
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      disabled={isScanning}
                      className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-lg outline-none focus:border-red-600"
                    >
                      {cameras.map((cam) => (
                        <option key={cam.id} value={cam.id}>
                          {cam.label || `Kamera ${cam.id.slice(0, 5)}`}
                        </option>
                      ))}
                    </select>
                  )}

                  {!isScanning ? (
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-950 flex items-center gap-2"
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mulai Kamera
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Hentikan Kamera
                    </button>
                  )}
                </div>
              </div>

              {cameraError && (
                <div className="mb-4 p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl text-red-400 text-xs leading-relaxed">
                  ⚠️ {cameraError}
                </div>
              )}

              {/* Viewport Frame */}
              <div
                className={`relative w-full aspect-video max-h-[380px] bg-black rounded-2xl overflow-hidden border transition-all duration-300 flex items-center justify-center ${
                  scanFlash
                    ? "border-emerald-500 ring-4 ring-emerald-500/50 shadow-2xl shadow-emerald-500/40"
                    : "border-zinc-800"
                }`}
              >
                <div id="reader" className="w-full h-full" />

                {/* Laser Line & Reticle Viewfinder saat Kamera Aktif */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20">
                    {/* Kotak Target Bidik QR */}
                    <div className="relative w-56 h-56 border border-white/20 rounded-2xl overflow-hidden shadow-inner">
                      {/* 4 Sudut Glowing Neon Red */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg" />

                      {/* Laser Bar Merah yang Bergerak Turun Naik */}
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444] animate-laser" />
                    </div>

                    {/* Status Pill di Bawah Kotak */}
                    <div className="absolute bottom-3 px-4 py-1.5 rounded-full bg-black/85 border border-zinc-700/80 backdrop-blur-md flex items-center gap-2 shadow-xl">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[11px] font-mono text-zinc-200 font-semibold tracking-wide">
                        {loading ? "Memvalidasi Tiket..." : "Arahkan QR Code ke Dalam Kotak"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notifikasi Flash Visual Seketika QR Tertangkap */}
                {scanFlash && (
                  <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center animate-pulse pointer-events-none">
                    <div className="bg-emerald-950/95 border-2 border-emerald-400 px-5 py-2.5 rounded-2xl text-emerald-300 font-mono font-bold text-xs flex items-center gap-2.5 shadow-2xl">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-black">
                        ✓
                      </span>
                      <span>QR Terdeteksi: {lastDetectedCode}</span>
                    </div>
                  </div>
                )}

                {/* Tampilan Saat Kamera Belum Nyala */}
                {!isScanning && (
                  <div className="absolute inset-0 bg-zinc-950/85 flex flex-col items-center justify-center text-center p-6 gap-3 z-10 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                    <p className="text-zinc-300 text-sm font-semibold">
                      Kamera Belum Dinyalakan
                    </p>
                    <p className="text-zinc-500 text-xs max-w-sm">
                      Klik tombol &quot;Mulai Kamera&quot; di atas untuk membuka pemindai QR code tiket secara otomatis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Manual Input / Barcode Gun */}
          {activeTab === "manual" && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white text-base font-bold mb-1">
                Validasi Manual / Barcode Scanner Gun
              </h3>
              <p className="text-zinc-400 text-xs mb-5">
                Ketikkan kode tiket resmi (e.g. TKR-12-1-1 atau kode pemesanan TKR-12) atau gunakan barcode scanner gun.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualCode.trim()) handleProcessCode(manualCode.trim());
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5 font-bold">
                    Kode Tiket / Payload QR
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Contoh: TKR-12-1-1 atau TKR-12"
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={loading || !manualCode.trim()}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-red-950 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? "Memvalidasi..." : "Verifikasi & Check-In Sekarang →"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualCode("")}
                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 3: Upload Image */}
          {activeTab === "file" && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white text-base font-bold mb-1">
                Pindai Melalui Tangkapan Layar / Foto QR
              </h3>
              <p className="text-zinc-400 text-xs mb-5">
                Unggah gambar atau screenshot QR pass yang dibawa oleh user dari galeri ponsel.
              </p>

              <div id="reader-file-temp" className="hidden" />

              <label className="border-2 border-dashed border-zinc-700 hover:border-red-600/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-zinc-950/60 transition group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-full bg-zinc-900 group-hover:bg-red-950/40 border border-zinc-800 group-hover:border-red-800 items-center justify-center flex text-zinc-400 group-hover:text-red-400 transition mb-3">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-white text-sm font-semibold mb-1">
                  Pilih Gambar QR Code Tiket
                </p>
                <p className="text-zinc-500 text-xs font-mono">
                  Mendukung format PNG, JPG, JPEG, atau WebP
                </p>
              </label>
            </div>
          )}

          {/* Demo Helper: Quick Test with Real Verified Orders */}
          {recentVerifiedOrders.length > 0 && (
            <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase text-zinc-400 font-bold">
                  🧪 Tes Cepat Kode Order Terverifikasi (Midtrans / Admin)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Klik untuk uji coba scan langsung</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentVerifiedOrders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => handleProcessCode(ord.order_code || `TKR-${ord.id}`)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{ord.order_code || `TKR-${ord.id}`}</span>
                    <span className="text-[10px] text-zinc-500">
                      (Rp {Number(ord.total_amount).toLocaleString("id-ID")})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scan Result & Live Attendance Log (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Result Card */}
          {currentResult ? (
            <div
              className={`rounded-2xl border p-6 shadow-2xl transition-all ${
                currentResult.status === "success"
                  ? "bg-emerald-950/25 border-emerald-500/70 shadow-emerald-950/40"
                  : currentResult.status === "already_used"
                  ? "bg-amber-950/25 border-amber-500/70 shadow-amber-950/40"
                  : "bg-red-950/25 border-red-500/70 shadow-red-950/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg ${
                      currentResult.status === "success"
                        ? "bg-emerald-600 text-white"
                        : currentResult.status === "already_used"
                        ? "bg-amber-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {currentResult.status === "success"
                      ? "✓"
                      : currentResult.status === "already_used"
                      ? "⏳"
                      : "✕"}
                  </div>
                  <div>
                    <h2
                      className={`text-base font-black uppercase tracking-tight ${
                        currentResult.status === "success"
                          ? "text-emerald-400"
                          : currentResult.status === "already_used"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {currentResult.status === "success"
                        ? "Valid • Check-In Berhasil"
                        : currentResult.status === "already_used"
                        ? "Tiket Sudah Pernah Digunakan"
                        : "Tiket Ditolak / Tidak Valid"}
                    </h2>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      Pukul {currentResult.timestamp || "Sekarang"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentResult(null)}
                  className="text-zinc-500 hover:text-white text-xs px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>

              <p className="text-white text-sm font-medium mb-4 leading-relaxed">
                {currentResult.message}
              </p>

              {/* Detailed Ticket Information Breakdown */}
              {currentResult.ticket && (
                <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                    <span className="text-zinc-500">Kode Tiket:</span>
                    <span className="text-white font-bold">{currentResult.ticket.ticket_code}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                    <span className="text-zinc-500">Nama Pemegang:</span>
                    <span className="text-white font-bold">
                      {currentResult.ticket.customer_name || "Pengguna LOUDER"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                    <span className="text-zinc-500">Konser / Event:</span>
                    <span className="text-red-400 font-bold truncate max-w-[180px]">
                      {currentResult.ticket.event_name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
                    <span className="text-zinc-500">Kategori & Kursi:</span>
                    <span className="text-emerald-400 font-bold">
                      {currentResult.ticket.category_name} • {currentResult.ticket.seat_number || "General"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Venue:</span>
                    <span className="text-zinc-300 truncate max-w-[180px]">
                      {currentResult.ticket.event_venue || "GBK Jakarta"}
                    </span>
                  </div>

                  {currentResult.ticket.used_at && (
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-amber-400 text-[11px]">
                      <span>Scan Sebelumnya:</span>
                      <span>
                        {new Date(currentResult.ticket.used_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-3">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white text-sm font-bold mb-1">
                Menunggu Pemindaian Tiket
              </h3>
              <p className="text-zinc-500 text-xs max-w-xs">
                Arahkan QR tiket mobile user ke kamera atau masukkan kode tiket secara manual untuk melihat status check-in.
              </p>
            </div>
          )}

          {/* Live Recent Attendance Scans */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Aktivitas Check-In Terbaru
              </h3>
              <button
                onClick={loadStatsAndHistory}
                className="text-zinc-500 hover:text-white text-[11px] font-mono"
              >
                Refresh ↺
              </button>
            </div>

            {recentScans.length === 0 ? (
              <p className="text-zinc-600 text-xs py-4 text-center">
                Belum ada tiket yang di-scan pada sesi gerbang ini.
              </p>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {recentScans.map((item, idx) => (
                  <div
                    key={item.ticket_id || idx}
                    className="p-3 bg-zinc-950/70 border border-zinc-800/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="text-white font-bold font-mono">
                        {item.customer_name || "Pengguna"}
                      </p>
                      <p className="text-zinc-500 text-[10px] font-mono mt-0.5">
                        {item.ticket_code} • {item.category_name} ({item.seat_number})
                      </p>
                    </div>

                    <div className="text-right font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                        Masuk Gate ✓
                      </span>
                      <p className="text-zinc-500 text-[10px] mt-1">
                        {item.used_at
                          ? new Date(item.used_at).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Baru saja"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global CSS for Scanner Video & Animated Laser */}
      <style jsx global>{`
        @keyframes laserSweep {
          0% {
            top: 6%;
            opacity: 0.6;
          }
          50% {
            top: 90%;
            opacity: 1;
          }
          100% {
            top: 6%;
            opacity: 0.6;
          }
        }
        .animate-laser {
          position: absolute;
          animation: laserSweep 2.2s ease-in-out infinite;
        }
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem;
        }
        #reader {
          border: none !important;
        }
        #reader__scan_region {
          display: flex;
          align-items: center;
          justify-content: center;
          border: none !important;
          background: transparent !important;
        }
        #reader__scan_region img,
        #reader__scan_region svg {
          display: none !important;
        }
        #reader__dashboard_section,
        #reader__header_message {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
