import db from "../database.js";

export const getByOrder = async (req, res, next) => {
  try {
    const [order] = await db.query("SELECT * FROM orders WHERE id=?", [req.params.orderId]);
    if (!order.length) return res.status(404).json({ message: "Order tidak ditemukan" });
    if (req.user.role !== "admin" && order[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const [rows] = await db.query(
      `SELECT t.*, tc.name AS category_name, oi.quantity
       FROM tickets t
       JOIN order_items oi ON oi.id = t.order_item_id
       JOIN ticket_categories tc ON tc.id = oi.ticket_category_id
       WHERE oi.order_id = ?`, [req.params.orderId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

export const validate = async (req, res, next) => {
  try {
    const { ticket_code } = req.body;
    const [rows] = await db.query("SELECT * FROM tickets WHERE ticket_code=?", [ticket_code]);
    if (!rows.length) return res.status(404).json({ message: "Tiket tidak ditemukan" });

    const ticket = rows[0];
    if (ticket.status === "used") return res.status(400).json({ message: "Tiket sudah digunakan" });
    if (ticket.status === "void") return res.status(400).json({ message: "Tiket tidak berlaku" });

    await db.query("UPDATE tickets SET status=?, used_at=NOW() WHERE id=?", ["used", ticket.id]);
    res.json({ message: "Tiket valid dan berhasil di-scan", ticket_code });
  } catch (err) { next(err); }
};
