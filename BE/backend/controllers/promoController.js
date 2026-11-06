import db from "../database.js";

export const getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, e.name AS event_name, e.poster_url AS event_poster_url, e.venue AS event_venue, e.event_date
       FROM promos p
       LEFT JOIN events e ON e.id = p.event_id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
};

export const checkPromo = async (req, res, next) => {
  try {
    const { code, amount, event_id } = req.body;
    if (!code) return res.status(400).json({ message: "Kode promo wajib diisi" });

    const [rows] = await db.query("SELECT * FROM promos WHERE code = ? AND is_active = 1", [code.toUpperCase().trim()]);
    if (!rows.length) return res.status(404).json({ message: "Kode promo tidak valid atau tidak aktif" });

    const promo = rows[0];
    const subtotal = Number(amount || 0);

    // Validate quota
    if (promo.quota && promo.used_count >= promo.quota) {
      return res.status(400).json({ message: "Kuota promo sudah habis" });
    }

    // Validate event restriction
    if (promo.event_id && event_id && promo.event_id !== Number(event_id)) {
      return res.status(400).json({ message: "Promo ini tidak berlaku untuk event yang dipilih" });
    }

    // Validate minimum purchase
    if (promo.min_purchase && subtotal < Number(promo.min_purchase)) {
      return res.status(400).json({
        message: `Minimal transaksi untuk promo ini adalah Rp ${Number(promo.min_purchase).toLocaleString()}`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (promo.discount_type === "percentage") {
      discount = (subtotal * Number(promo.discount_value)) / 100;
      if (promo.max_discount && discount > Number(promo.max_discount)) {
        discount = Number(promo.max_discount);
      }
    } else {
      discount = Number(promo.discount_value);
    }

    if (discount > subtotal) discount = subtotal;

    res.json({
      valid: true,
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: Number(promo.discount_value),
      discount_amount: discount,
      final_amount: Math.max(0, subtotal - discount),
      description: promo.description,
    });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { code, description, discount_type, discount_value, min_purchase, max_discount, quota, event_id } = req.body;
    if (!code || !discount_value) {
      return res.status(400).json({ message: "Kode dan nilai diskon wajib diisi" });
    }

    const [existing] = await db.query("SELECT id FROM promos WHERE code = ?", [code.toUpperCase().trim()]);
    if (existing.length) return res.status(409).json({ message: "Kode promo sudah terdaftar" });

    const banner_url = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.banner_url || null;

    const [result] = await db.query(
      `INSERT INTO promos (code, description, discount_type, discount_value, min_purchase, max_discount, quota, event_id, banner_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase().trim(),
        description || null,
        discount_type || "percentage",
        discount_value,
        min_purchase || 0,
        max_discount || null,
        quota || 100,
        event_id || null,
        banner_url,
      ]
    );
    res.status(201).json({ message: "Promo berhasil dibuat", id: result.insertId });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const { code, description, discount_type, discount_value, min_purchase, max_discount, quota, is_active, event_id } = req.body;
    const [current] = await db.query("SELECT * FROM promos WHERE id=?", [req.params.id]);
    if (!current.length) return res.status(404).json({ message: "Promo tidak ditemukan" });

    const finalCode = code ? code.toUpperCase().trim() : current[0].code;
    if (code && finalCode !== current[0].code) {
      const [check] = await db.query("SELECT id FROM promos WHERE code=? AND id!=?", [finalCode, req.params.id]);
      if (check.length) return res.status(409).json({ message: "Kode promo sudah digunakan promo lain" });
    }

    let banner_url = current[0].banner_url;
    if (req.file) {
      banner_url = `/uploads/${req.file.filename}`;
    } else if (req.body.banner_url !== undefined) {
      banner_url = req.body.banner_url ? req.body.banner_url : null;
    }

    const finalDescription = description !== undefined ? (description.trim() || null) : current[0].description;
    const finalDiscountType = discount_type || current[0].discount_type;
    const finalDiscountValue = discount_value !== undefined ? Number(discount_value) : current[0].discount_value;
    const finalMinPurchase = min_purchase !== undefined ? Number(min_purchase || 0) : current[0].min_purchase;
    const finalMaxDiscount = max_discount !== undefined ? (max_discount ? Number(max_discount) : null) : current[0].max_discount;
    const finalQuota = quota !== undefined ? Number(quota) : current[0].quota;
    const finalIsActive = is_active !== undefined ? (is_active === true || is_active === 1 || is_active === "1" ? 1 : 0) : current[0].is_active;
    const finalEventId = event_id !== undefined ? (event_id ? Number(event_id) : null) : current[0].event_id;

    await db.query(
      `UPDATE promos SET code=?, description=?, discount_type=?, discount_value=?, min_purchase=?, max_discount=?, quota=?, is_active=?, event_id=?, banner_url=?
       WHERE id=?`,
      [
        finalCode,
        finalDescription,
        finalDiscountType,
        finalDiscountValue,
        finalMinPurchase,
        finalMaxDiscount,
        finalQuota,
        finalIsActive,
        finalEventId,
        banner_url,
        req.params.id
      ]
    );
    res.json({ message: "Promo berhasil diupdate" });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM promos WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Promo tidak ditemukan" });
    res.json({ message: "Promo berhasil dihapus" });
  } catch (err) { next(err); }
};
