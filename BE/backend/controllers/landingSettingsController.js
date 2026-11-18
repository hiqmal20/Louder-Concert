import db from "../database.js";

const DEFAULT_SETTINGS = {
  hero: {
    headline: "Rasakan Energi Panggung.",
    subheadline: "Amankan Tiket Konsermu.",
    description: "Platform resmi pemesanan tiket konser musik terpercaya. Dapatkan akses presale, pilih kategori terbaik, dan saksikan konser spektakuler musisi impianmu.",
    ctaText: "Daftar Sekarang →",
    ctaLink: "/register",
  },
  capabilities: [
    {
      title: "100% E-Ticket Resmi",
      desc: "Terhubung langsung dengan promotor resmi. E-ticket terenkripsi dengan QR code anti-pemalsuan dan anti-calo.",
    },
    {
      title: "Line-Up Artis Terlengkap",
      desc: "Temukan jadwal konser musisi favorit dari genre Rock, Pop, Electronic EDM, Indie, hingga Jazz.",
    },
    {
      title: "Pembayaran Cepat & Aman",
      desc: "Dukungan transaksi instan via QRIS, Virtual Account bank nasional, dan konfirmasi otomatis dalam hitungan detik.",
    },
  ],
  howItWorks: [
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
  ],
  faqs: [
    {
      q: "Bagaimana cara menerima tiket setelah transaksi selesai?",
      a: "E-ticket dengan QR Code unik langsung tersedia di riwayat pemesanan akun kamu sesaat setelah pembayaran terverifikasi otomatis atau oleh admin.",
    },
    {
      q: "Apakah tiket bisa dipindahtangankan?",
      a: "QR code tiket bersifat unik dan hanya berlaku untuk satu kali scan di gerbang masuk gate validator.",
    },
    {
      q: "Bagaimana cara menggunakan voucher promo diskon?",
      a: "Salin kode yang tersedia di bagian kupon promo, lalu masukkan kode tersebut pada kolom voucher saat melakukan checkout tiket konser.",
    },
    {
      q: "Metode pembayaran apa saja yang didukung?",
      a: "LOUDER mendukung pembayaran instan via QRIS semua e-wallet, Virtual Account / Transfer Bank, dan Kartu Debit/Kredit.",
    },
    {
      q: "Bagaimana jika kuota tiket habis?",
      a: "Sistem LOUDER menggunakan transaksi lock real-time, jika kuota habis maka kategori tiket akan otomatis terkunci status 'Sold Out'.",
    },
  ],
  cta: {
    title: "Siap Rasakan Gemuruh Panggung?",
    description: "Daftar sekarang untuk mendapatkan akses lebih awal (early bird) dan notifikasi tiket konser terpanas di kotamu.",
    btnPrimary: "Create Account",
    btnSecondary: "Sign In",
  },
};

export const getSettings = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT setting_value FROM landing_settings WHERE setting_key = 'landing_content' LIMIT 1"
    );

    if (!rows.length || !rows[0].setting_value) {
      return res.json(DEFAULT_SETTINGS);
    }

    try {
      const parsed = JSON.parse(rows[0].setting_value);
      return res.json({ ...DEFAULT_SETTINGS, ...parsed });
    } catch {
      return res.json(DEFAULT_SETTINGS);
    }
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ message: "Payload konfigurasi tidak valid" });
    }

    // Read current
    const [currentRows] = await db.query(
      "SELECT setting_value FROM landing_settings WHERE setting_key = 'landing_content' LIMIT 1"
    );

    let current = DEFAULT_SETTINGS;
    if (currentRows.length && currentRows[0].setting_value) {
      try {
        current = JSON.parse(currentRows[0].setting_value);
      } catch {}
    }

    const merged = {
      ...current,
      ...payload,
    };

    const jsonString = JSON.stringify(merged);

    if (currentRows.length) {
      await db.query(
        "UPDATE landing_settings SET setting_value = ? WHERE setting_key = 'landing_content'",
        [jsonString]
      );
    } else {
      await db.query(
        "INSERT INTO landing_settings (setting_key, setting_value) VALUES ('landing_content', ?)",
        [jsonString]
      );
    }

    res.json({
      message: "Konten dan section landing page berhasil diperbarui",
      data: merged,
    });
  } catch (err) {
    next(err);
  }
};
