"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { eventApi, promoApi, orderApi, getImageUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface TicketCategory {
  id: number;
  name: string;
  price: number;
  quota: number;
  sold: number;
}

interface EventDetail {
  id: number;
  name: string;
  description?: string;
  event_date: string;
  event_time?: string;
  venue: string;
  poster_url?: string;
  artists?: { id: number; name: string; bio?: string; photo_url?: string }[];
  ticket_categories?: TicketCategory[];
}

export default function EventCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = Number(resolvedParams.id);
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQty, setSelectedQty] = useState<Record<number, number>>({});

  // Promo states
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount_amount: number;
    description?: string;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    eventApi.getById(eventId).then((res) => {
      if (res.ok) setEvent(res.data);
      setLoading(false);
    });
  }, [eventId]);

  const updateQuantity = (catId: number, delta: number, maxAvailable: number) => {
    setSelectedQty((prev) => {
      const current = prev[catId] || 0;
      const next = Math.max(0, Math.min(maxAvailable, current + delta));
      return { ...prev, [catId]: next };
    });
    // Reset promo when qty changes to revalidate
    setAppliedPromo(null);
    setPromoError("");
  };

  // Subtotal calculation
  const subtotal = Object.entries(selectedQty).reduce((acc, [catId, qty]) => {
    const cat = event?.ticket_categories?.find((c) => c.id === Number(catId));
    return acc + (cat ? Number(cat.price) * qty : 0);
  }, 0);

  const totalTickets = Object.values(selectedQty).reduce((a, b) => a + b, 0);
  const discount = appliedPromo?.discount_amount || 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    if (subtotal <= 0) {
      setPromoError("Pilih minimal 1 tiket sebelum klaim promo.");
      return;
    }

    setCheckingPromo(true);
    setPromoError("");
    try {
      const res = await promoApi.check(promoCodeInput.trim(), subtotal, eventId);
      if (res.ok && res.data?.valid) {
        setAppliedPromo({
          code: res.data.code,
          discount_amount: res.data.discount_amount,
          description: res.data.description,
        });
      } else {
        setPromoError(res.data?.message || "Kode promo tidak valid atau syarat belum terpenuhi.");
        setAppliedPromo(null);
      }
    } catch {
      setPromoError("Gagal memeriksa kode promo.");
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleCheckout = async () => {
    const token = getToken();
    if (!token) {
      router.push(`/login?redirect=/events/${eventId}`);
      return;
    }

    const items = Object.entries(selectedQty)
      .filter(([_, qty]) => qty > 0)
      .map(([catId, qty]) => ({
        ticket_category_id: Number(catId),
        quantity: qty,
      }));

    if (items.length === 0) {
      setCheckoutError("Pilih minimal 1 tiket untuk melanjutkan.");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const payload: any = {
        event_id: eventId,
        items,
      };
      if (appliedPromo) {
        payload.promo_code = appliedPromo.code;
      }

      const res = await orderApi.create(payload);
      if (res.ok) {
        // Redirect to success or payment view
        alert(`Pemesanan Berhasil!\nKode Order: ${res.data.order_code}\nTotal: Rp ${res.data.total_amount.toLocaleString()}`);
        router.push("/events");
      } else {
        setCheckoutError(res.data?.message || "Gagal membuat pesanan.");
      }
    } catch {
      setCheckoutError("Terjadi kendala saat checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <svg className="animate-spin h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-zinc-400 text-sm">Event tidak ditemukan.</p>
        <Link href="/events" className="mt-4 text-xs font-bold text-red-500 uppercase">
          Kembali ke List Event →
        </Link>
      </div>
    );
  }

  const poster = getImageUrl(event.poster_url);

  return (
    <div className="min-h-screen bg-black text-white pb-36">
      {/* Mobile Top Nav */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3.5 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-zinc-400 hover:text-white p-1">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Pilih Tiket & Checkout</h1>
        <div className="w-6" />
      </header>

      <main className="max-w-md mx-auto px-5 pt-4 flex flex-col gap-6">
        {/* Event Banner Card */}
        <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl">
          {poster && (
            <div className="h-44 w-full relative">
              <img src={poster} alt={event.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
            </div>
          )}
          <div className="p-4 flex flex-col gap-2">
            <h2 className="text-white font-bold text-xl leading-tight">{event.name}</h2>
            <div className="flex flex-col gap-1 text-xs text-zinc-400">
              <p>📅 {new Date(event.event_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} • {event.event_time?.substring(0, 5) || "19:00"} WIB</p>
              <p>📍 {event.venue}</p>
            </div>
            {event.description && (
              <p className="text-zinc-500 text-xs mt-2 leading-relaxed border-t border-zinc-800/80 pt-2 line-clamp-3">
                {event.description}
              </p>
            )}
          </div>
        </div>

        {/* Ticket Categories List */}
        <div className="flex flex-col gap-3">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Kategori Tiket</h3>

          {(!event.ticket_categories || event.ticket_categories.length === 0) ? (
            <p className="text-zinc-500 text-xs py-4 text-center">Belum ada kategori tiket untuk konser ini.</p>
          ) : (
            event.ticket_categories.map((cat) => {
              const quota = cat.quota || 0;
              const sold = cat.sold || 0;
              const remaining = Math.max(0, quota - sold);
              const isSoldOut = remaining === 0;
              const qty = selectedQty[cat.id] || 0;

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSoldOut
                      ? "bg-zinc-900/40 border-zinc-800 opacity-60"
                      : qty > 0
                      ? "bg-zinc-900 border-red-700/80 shadow-md shadow-red-950/30"
                      : "bg-zinc-900/80 border-zinc-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-white font-bold text-base">{cat.name}</h4>
                      <p className="text-red-400 font-mono font-bold text-sm mt-0.5">
                        Rp {Number(cat.price).toLocaleString()}
                      </p>
                      <p className="text-zinc-500 text-[11px] mt-1">
                        {isSoldOut ? "Tiket Habis (Sold Out)" : `Sisa kuota: ${remaining} tiket`}
                      </p>
                    </div>

                    {!isSoldOut && (
                      <div className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-xl p-1 shrink-0">
                        <button
                          disabled={qty <= 0}
                          onClick={() => updateQuantity(cat.id, -1, remaining)}
                          className="w-8 h-8 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-all"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-mono font-bold">{qty}</span>
                        <button
                          disabled={qty >= remaining}
                          onClick={() => updateQuantity(cat.id, 1, remaining)}
                          className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-all"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Promo Voucher Section (Loket.com Style) */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Gunakan Promo / Voucher</h4>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              placeholder="Ketik kode promo (cth: LOUDERFEST)"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono placeholder:text-zinc-600 outline-none focus:border-red-500"
            />
            <button
              onClick={handleApplyPromo}
              disabled={checkingPromo || !promoCodeInput}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all uppercase shrink-0"
            >
              {checkingPromo ? "Cek..." : "Klaim"}
            </button>
          </div>

          {promoError && <p className="text-red-400 text-xs mt-0.5">{promoError}</p>}

          {appliedPromo && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-xs font-bold font-mono">✓ {appliedPromo.code} Terpasang</p>
                <p className="text-zinc-400 text-[10px]">Hemat Rp {appliedPromo.discount_amount.toLocaleString()}</p>
              </div>
              <button
                onClick={() => {
                  setAppliedPromo(null);
                  setPromoCodeInput("");
                }}
                className="text-zinc-500 hover:text-red-400 text-xs underline"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Order Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 px-6 py-4 max-w-md mx-auto flex flex-col gap-3">
        {checkoutError && <p className="text-red-400 text-xs text-center">{checkoutError}</p>}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Total Pembayaran ({totalTickets} Tiket)
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-white font-mono font-extrabold text-lg">
                Rp {finalTotal.toLocaleString()}
              </span>
              {discount > 0 && (
                <span className="text-zinc-500 line-through text-xs font-mono">
                  Rp {subtotal.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <button
            disabled={checkoutLoading || totalTickets === 0}
            onClick={handleCheckout}
            className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-950/60 flex items-center gap-2"
          >
            {checkoutLoading ? "Memproses..." : "Beli Tiket →"}
          </button>
        </div>
      </footer>
    </div>
  );
}
