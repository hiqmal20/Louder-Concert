import db from "../database.js";

const generateOrderCode = () => `TKR-${Math.floor(10000 + Math.random() * 90000)}`;

export const getAll = async (req, res, next) => {
  try {
    let sql = `
      SELECT o.*, u.name AS customer_name, e.name AS event_name
      FROM orders o
      JOIN users u ON u.id = o.user_id
      JOIN events e ON e.id = o.event_id
    `;
    const params = [];
    if (req.user.role !== "admin") {
      sql += " WHERE o.user_id = ?";
      params.push(req.user.id);
    }
    sql += " ORDER BY o.ordered_at DESC";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.name AS customer_name, e.name AS event_name
       FROM orders o JOIN users u ON u.id=o.user_id JOIN events e ON e.id=o.event_id
       WHERE o.id=?`, [req.params.id]
    );
    if (!orders.length) return res.status(404).json({ message: "Order tidak ditemukan" });

    const order = orders[0];
    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const [items] = await db.query(
      `SELECT oi.*, tc.name AS category_name
       FROM order_items oi JOIN ticket_categories tc ON tc.id=oi.ticket_category_id
       WHERE oi.order_id=?`, [req.params.id]
    );
    const [payments] = await db.query("SELECT * FROM payments WHERE order_id=?", [req.params.id]);

    res.json({ ...order, items, payments });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { event_id, items } = req.body;
    if (!event_id || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "event_id dan items wajib diisi" });
    }

    let totalAmount = 0;
    const itemsData = [];

    for (const item of items) {
      const [cats] = await conn.query(
        "SELECT * FROM ticket_categories WHERE id=? AND event_id=? FOR UPDATE",
        [item.ticket_category_id, event_id]
      );
      if (!cats.length) throw { status: 404, message: "Kategori tiket tidak ditemukan" };

      const cat = cats[0];
      const remaining = cat.quota - cat.sold;
      if (item.quantity > remaining) {
        throw { status: 400, message: `Kuota ${cat.name} tidak mencukupi (sisa: ${remaining})` };
      }

      const subtotal = cat.price * item.quantity;
      totalAmount += subtotal;
      itemsData.push({ cat, quantity: item.quantity, subtotal });
    }

    let orderCode, unique = false;
    while (!unique) {
      orderCode = generateOrderCode();
      const [check] = await conn.query("SELECT id FROM orders WHERE order_code=?", [orderCode]);
      if (!check.length) unique = true;
    }

    const [orderResult] = await conn.query(
      "INSERT INTO orders (order_code, user_id, event_id, total_amount) VALUES (?,?,?,?)",
      [orderCode, req.user.id, event_id, totalAmount]
    );
    const orderId = orderResult.insertId;

    for (const { cat, quantity, subtotal } of itemsData) {
      await conn.query(
        "INSERT INTO order_items (order_id, ticket_category_id, quantity, price, subtotal) VALUES (?,?,?,?,?)",
        [orderId, cat.id, quantity, cat.price, subtotal]
      );
      await conn.query(
        "UPDATE ticket_categories SET sold = sold + ? WHERE id = ?",
        [quantity, cat.id]
      );
    }

    await conn.commit();
    res.status(201).json({ message: "Order berhasil dibuat", order_code: orderCode, id: orderId, total_amount: totalAmount });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "verified", "completed", "cancelled", "expired"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }
    const [result] = await db.query("UPDATE orders SET status=? WHERE id=?", [status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Order tidak ditemukan" });
    res.json({ message: "Status order diupdate" });
  } catch (err) { next(err); }
};
