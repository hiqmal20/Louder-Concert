import db from "../database.js";

export const getByOrder = async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM payments WHERE order_id = ?", [req.params.orderId]);
    res.json(rows);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { order_id, method, amount } = req.body;
    if (!order_id || !method || !amount) {
      return res.status(400).json({ message: "order_id, method, amount wajib diisi" });
    }

    const [orders] = await db.query("SELECT * FROM orders WHERE id=?", [order_id]);
    if (!orders.length) return res.status(404).json({ message: "Order tidak ditemukan" });
    if (req.user.role !== "admin" && orders[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const proof_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO payments (order_id, method, amount, proof_url) VALUES (?,?,?,?)",
      [order_id, method, amount, proof_url]
    );
    res.status(201).json({ message: "Pembayaran berhasil dikirim", id: result.insertId });
  } catch (err) { next(err); }
};

export const verify = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { status } = req.body;
    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status harus verified atau rejected" });
    }

    const [payments] = await conn.query("SELECT * FROM payments WHERE id=?", [req.params.id]);
    if (!payments.length) return res.status(404).json({ message: "Pembayaran tidak ditemukan" });

    await conn.query(
      "UPDATE payments SET status=?, verified_by=?, verified_at=NOW() WHERE id=?",
      [status, req.user.id, req.params.id]
    );

    if (status === "verified") {
      await conn.query("UPDATE orders SET status=? WHERE id=?", ["verified", payments[0].order_id]);
    }

    await conn.commit();
    res.json({ message: `Pembayaran berhasil di-${status}` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
