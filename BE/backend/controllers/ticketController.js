import db from "../database.js";
import { generateTickets } from "./paymentController.js";

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
       WHERE oi.order_id = ?`,
      [req.params.orderId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const queryTicketDetails = async (condition, params) => {
  const sql = `
    SELECT 
      t.id AS ticket_id,
      t.ticket_code,
      t.seat_number,
      t.qr_payload,
      t.status AS ticket_status,
      t.used_at,
      t.created_at AS ticket_created_at,
      o.id AS order_id,
      o.order_code,
      o.status AS order_status,
      o.total_amount,
      u.id AS user_id,
      u.name AS customer_name,
      u.email AS customer_email,
      u.phone AS customer_phone,
      e.id AS event_id,
      e.name AS event_name,
      e.venue AS event_venue,
      e.event_date,
      e.event_time,
      e.poster_url AS event_poster_url,
      tc.id AS category_id,
      tc.name AS category_name,
      tc.price AS category_price
    FROM tickets t
    JOIN order_items oi ON oi.id = t.order_item_id
    JOIN orders o ON o.id = oi.order_id
    JOIN users u ON u.id = o.user_id
    JOIN events e ON e.id = o.event_id
    JOIN ticket_categories tc ON tc.id = oi.ticket_category_id
    WHERE ${condition}
    ORDER BY t.id ASC
  `;
  const [rows] = await db.query(sql, params);
  return rows;
};

export const validate = async (req, res, next) => {
  try {
    const rawInput = (
      req.body.ticket_code ||
      req.body.code ||
      req.body.qr_payload ||
      req.body.qr_data ||
      ""
    ).toString().trim();

    if (!rawInput) {
      return res.status(400).json({
        success: false,
        message: "Kode tiket atau QR gate pass tidak boleh kosong.",
      });
    }

    let searchTicketCode = rawInput;
    let searchOrderCode = null;
    let searchOrderId = null;

    // Check if input is JSON (like the qr_payload rendered in mobile app)
    if (rawInput.startsWith("{") && rawInput.endsWith("}")) {
      try {
        const parsed = JSON.parse(rawInput);
        if (parsed.ticket_code) searchTicketCode = parsed.ticket_code;
        if (parsed.order_code) searchOrderCode = parsed.order_code;
        if (parsed.code) searchOrderCode = parsed.code;
        if (parsed.order_id) searchOrderId = parsed.order_id;
      } catch (_) {}
    }

    // Check if input is "LOUDER-GATE-{id}"
    if (rawInput.startsWith("LOUDER-GATE-")) {
      searchOrderId = parseInt(rawInput.replace("LOUDER-GATE-", ""), 10);
    }

    // Step 1: Search in tickets table directly by ticket_code or qr_payload
    let rows = await queryTicketDetails(
      "t.ticket_code = ? OR t.qr_payload = ? OR t.ticket_code LIKE ?",
      [searchTicketCode, rawInput, `%${searchTicketCode}%`]
    );

    // Step 2: If not found, try searching by order_code or order_id
    if (!rows.length && (searchOrderCode || searchOrderId || rawInput)) {
      const targetOrderCode = searchOrderCode || rawInput;
      const targetOrderId = searchOrderId || (isNaN(Number(rawInput)) ? null : Number(rawInput));

      const [orders] = await db.query(
        "SELECT * FROM orders WHERE order_code = ? OR id = ?",
        [targetOrderCode, targetOrderId]
      );

      if (orders.length > 0) {
        const ord = orders[0];

        // Check if order is verified/completed
        if (ord.status !== "verified" && ord.status !== "completed") {
          return res.status(400).json({
            success: false,
            status: ord.status,
            message: `Tiket tidak dapat digunakan. Status pemesanan masih "${ord.status.toUpperCase()}". Pastikan pembayaran telah selesai atau diverifikasi admin.`,
            order: {
              order_id: ord.id,
              order_code: ord.order_code,
              status: ord.status,
            },
          });
        }

        // Generate tickets if not yet generated
        await generateTickets(db, ord.id);

        // Re-query tickets for this order
        rows = await queryTicketDetails("o.id = ?", [ord.id]);
      }
    }

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Tiket tidak ditemukan dalam sistem database. Pastikan QR code valid dan resmi dari aplikasi LOUDER.",
      });
    }

    // Find the first valid ticket, or the first ticket if all are used
    let ticket = rows.find((t) => t.ticket_status === "valid") || rows[0];

    // Check ticket status
    if (ticket.ticket_status === "used") {
      return res.status(400).json({
        success: false,
        status: "already_used",
        message: "TIKET SUDAH DIGUNAKAN! E-ticket ini telah di-scan sebelumnya pada gerbang gate.",
        ticket,
        used_at: ticket.used_at,
      });
    }

    if (ticket.ticket_status === "void") {
      return res.status(400).json({
        success: false,
        status: "void",
        message: "TIKET VOID / DIBATALKAN. Tiket ini tidak sah untuk memasuki arena konser.",
        ticket,
      });
    }

    // Mark as used
    await db.query("UPDATE tickets SET status = 'used', used_at = NOW() WHERE id = ?", [ticket.ticket_id]);

    const updatedRows = await queryTicketDetails("t.id = ?", [ticket.ticket_id]);
    const finalTicket = updatedRows[0] || ticket;

    return res.json({
      success: true,
      status: "success",
      message: "CHECK-IN BERHASIL! Tiket resmi terverifikasi dan gate pass aktif.",
      ticket: finalTicket,
      check_in_time: new Date(),
    });
  } catch (err) {
    next(err);
  }
};

export const getRecentScans = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const rows = await queryTicketDetails("t.status = 'used'", []);
    const sorted = rows.sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime());
    res.json(sorted.slice(0, limit));
  } catch (err) {
    next(err);
  }
};

export const getTicketStats = async (req, res, next) => {
  try {
    const [totalRows] = await db.query("SELECT COUNT(*) AS total FROM tickets");
    const [usedRows] = await db.query("SELECT COUNT(*) AS used FROM tickets WHERE status = 'used'");
    const [validRows] = await db.query("SELECT COUNT(*) AS valid FROM tickets WHERE status = 'valid'");

    res.json({
      total: totalRows[0]?.total || 0,
      used: usedRows[0]?.used || 0,
      valid: validRows[0]?.valid || 0,
    });
  } catch (err) {
    next(err);
  }
};
