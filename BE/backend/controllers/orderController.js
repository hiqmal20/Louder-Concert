import db from "../database.js";
import { generateTickets } from "./paymentController.js";

const generateOrderCode = () => `TKR-${Math.floor(10000 + Math.random() * 90000)}`;

export const getAll = async (req, res, next) => {
  try {
    let sql = `
      SELECT o.*, u.name AS customer_name,
             e.name AS event_name, e.venue AS event_venue,
             e.event_date, e.event_time, e.poster_url,
             (SELECT GROUP_CONCAT(DISTINCT a.genre SEPARATOR ', ') FROM event_artist ea JOIN artists a ON a.id = ea.artist_id WHERE ea.event_id = e.id) AS genres,
             (SELECT tc.name FROM order_items oi JOIN ticket_categories tc ON tc.id = oi.ticket_category_id WHERE oi.order_id = o.id LIMIT 1) AS category_name,
             (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) AS total_tickets,
             (SELECT p.status FROM payments p WHERE p.order_id = o.id ORDER BY p.id DESC LIMIT 1) AS payment_status,
             (SELECT p.proof_url FROM payments p WHERE p.order_id = o.id ORDER BY p.id DESC LIMIT 1) AS payment_proof_url,
             (SELECT p.method FROM payments p WHERE p.order_id = o.id ORDER BY p.id DESC LIMIT 1) AS payment_method
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

    const { event_id, items, promo_code, seat_numbers } = req.body;
    if (!event_id || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "event_id dan items wajib diisi" });
    }

    let subtotalAmount = 0;
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
      subtotalAmount += subtotal;
      itemsData.push({ cat, quantity: item.quantity, subtotal });
    }

    // Apply promo discount if promo_code is provided
    let discountAmount = 0;
    let validPromoCode = null;

    if (promo_code) {
      const [promos] = await conn.query(
        "SELECT * FROM promos WHERE code = ? AND is_active = 1 FOR UPDATE",
        [promo_code.toUpperCase().trim()]
      );
      if (promos.length > 0) {
        const promo = promos[0];
        const isQuotaOk = !promo.quota || promo.used_count < promo.quota;
        const isEventOk = !promo.event_id || promo.event_id === Number(event_id);
        const isMinOk = !promo.min_purchase || subtotalAmount >= Number(promo.min_purchase);

        if (isQuotaOk && isEventOk && isMinOk) {
          if (promo.discount_type === "percentage") {
            discountAmount = (subtotalAmount * Number(promo.discount_value)) / 100;
            if (promo.max_discount && discountAmount > Number(promo.max_discount)) {
              discountAmount = Number(promo.max_discount);
            }
          } else {
            discountAmount = Number(promo.discount_value);
          }
          if (discountAmount > subtotalAmount) discountAmount = subtotalAmount;
          validPromoCode = promo.code;

          // Increment promo used count
          await conn.query("UPDATE promos SET used_count = used_count + 1 WHERE id = ?", [promo.id]);
        }
      }
    }

    const finalTotalAmount = Math.max(0, subtotalAmount - discountAmount);

    let orderCode, unique = false;
    while (!unique) {
      orderCode = generateOrderCode();
      const [check] = await conn.query("SELECT id FROM orders WHERE order_code=?", [orderCode]);
      if (!check.length) unique = true;
    }

    const [orderResult] = await conn.query(
      "INSERT INTO orders (order_code, user_id, event_id, total_amount, promo_code, seat_numbers, discount_amount, original_amount) VALUES (?,?,?,?,?,?,?,?)",
      [orderCode, req.user.id, event_id, finalTotalAmount, validPromoCode, seat_numbers || null, discountAmount, subtotalAmount]
    );
    const orderId = orderResult.insertId;

    for (const { cat, quantity, subtotal } of itemsData) {
      await conn.query(
        "INSERT INTO order_items (order_id, ticket_category_id, quantity, price, subtotal, seat_numbers) VALUES (?,?,?,?,?,?)",
        [orderId, cat.id, quantity, cat.price, subtotal, seat_numbers || null]
      );
      await conn.query(
        "UPDATE ticket_categories SET sold = sold + ? WHERE id = ?",
        [quantity, cat.id]
      );
    }

    await conn.commit();
    res.status(201).json({
      message: "Order berhasil dibuat",
      order_code: orderCode,
      id: orderId,
      original_amount: subtotalAmount,
      discount_amount: discountAmount,
      total_amount: finalTotalAmount,
      promo_code: validPromoCode,
      seat_numbers: seat_numbers || null,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const updateStatus = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { status } = req.body;
    const allowed = ["pending", "verified", "completed", "cancelled", "expired"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }
    await conn.beginTransaction();
    const [result] = await conn.query("UPDATE orders SET status=? WHERE id=?", [status, req.params.id]);
    if (!result.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ message: "Order tidak ditemukan" });
    }
    if (status === "verified" || status === "completed") {
      await conn.query("UPDATE payments SET status='verified', verified_by=?, verified_at=NOW() WHERE order_id=?", [req.user.id, req.params.id]);
      await generateTickets(conn, req.params.id);
    } else if (status === "cancelled") {
      await conn.query("UPDATE payments SET status='rejected', verified_by=?, verified_at=NOW() WHERE order_id=?", [req.user.id, req.params.id]);
    }
    await conn.commit();
    res.json({ message: `Status order berhasil diubah menjadi ${status}` });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
