import db from "../database.js";
import midtransClient from "midtrans-client";

const getSnapClient = () => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-GwUP_WGbJPXsDzsNEBRs8IYA";
  const clientKey = process.env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-61XuGAwQ8Bj8LxSS";
  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey,
    clientKey,
  });
};

export const generateTickets = async (conn, orderId) => {
  const [order] = await conn.query("SELECT * FROM orders WHERE id=?", [orderId]);
  if (!order.length) return;
  const orderCode = order[0].order_code || `TKR-${orderId}`;
  const seatList = order[0].seat_numbers ? order[0].seat_numbers.split(",").map(s => s.trim()) : [];

  const [items] = await conn.query("SELECT * FROM order_items WHERE order_id=?", [orderId]);
  let seatCounter = 0;
  for (const item of items) {
    const [existing] = await conn.query("SELECT id FROM tickets WHERE order_item_id=?", [item.id]);
    if (existing.length === 0) {
      for (let i = 1; i <= item.quantity; i++) {
        const ticketCode = `${orderCode}-${item.id}-${i}`;
        const seatNo = seatList[seatCounter] || (item.seat_numbers || `Seat ${i}`);
        seatCounter++;
        const qrPayload = JSON.stringify({
          order_id: orderId,
          order_code: orderCode,
          ticket_code: ticketCode,
          seat_number: seatNo,
          order_item_id: item.id,
        });
        await conn.query(
          "INSERT INTO tickets (order_item_id, ticket_code, seat_number, qr_payload, status) VALUES (?,?,?,?,?)",
          [item.id, ticketCode, seatNo, qrPayload, "valid"]
        );
      }
    }
  }
};

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
      await generateTickets(conn, payments[0].order_id);
    } else if (status === "rejected") {
      await conn.query("UPDATE orders SET status=? WHERE id=?", ["cancelled", payments[0].order_id]);
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

export const getMidtransToken = async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ message: "order_id wajib diisi" });

    const [orders] = await db.query(
      `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone, e.name as event_name
       FROM orders o
       JOIN users u ON u.id = o.user_id
       JOIN events e ON e.id = o.event_id
       WHERE o.id = ?`,
      [order_id]
    );

    if (!orders.length) return res.status(404).json({ message: "Order tidak ditemukan" });
    const order = orders[0];

    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const [items] = await db.query(
      `SELECT oi.*, tc.name as category_name
       FROM order_items oi
       JOIN ticket_categories tc ON tc.id = oi.ticket_category_id
       WHERE oi.order_id = ?`,
      [order_id]
    );

    const transactionId = `${order.order_code}-${Date.now()}`;
    const snap = getSnapClient();

    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: Math.round(Number(order.total_amount)),
      },
      customer_details: {
        first_name: order.customer_name || "Customer",
        email: order.customer_email,
        phone: order.customer_phone || "08123456789",
      },
      item_details: items.map((it) => ({
        id: String(it.ticket_category_id),
        price: Math.round(Number(it.price)),
        quantity: it.quantity,
        name: `${order.event_name} - ${it.category_name}`.slice(0, 50),
      })),
    };

    if (order.discount_amount && Number(order.discount_amount) > 0) {
      parameter.item_details.push({
        id: "DISCOUNT",
        price: -Math.round(Number(order.discount_amount)),
        quantity: 1,
        name: `Diskon: ${order.promo_code || "Promo"}`,
      });
    }

    try {
      const transaction = await snap.createTransaction(parameter);
      await db.query("UPDATE orders SET midtrans_tx_id = ? WHERE id = ?", [transactionId, order.id]);
      res.json({
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        order_id: order.id,
        order_code: order.order_code,
        midtrans_tx_id: transactionId,
        gross_amount: order.total_amount,
        client_key: process.env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-61XuGAwQ8Bj8LxSS",
      });
    } catch {
      // Fallback sandbox simulation token
      const dummyToken = `snap-token-${order.order_code}-${Date.now()}`;
      await db.query("UPDATE orders SET midtrans_tx_id = ? WHERE id = ?", [transactionId, order.id]);
      res.json({
        token: dummyToken,
        redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${dummyToken}`,
        order_id: order.id,
        order_code: order.order_code,
        midtrans_tx_id: transactionId,
        gross_amount: order.total_amount,
        client_key: process.env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-61XuGAwQ8Bj8LxSS",
        sandbox_notice: "Running in sandbox simulation mode",
      });
    }
  } catch (err) {
    next(err);
  }
};

export const simulateMidtransPayment = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { order_id, method = "qris_ewallet" } = req.body;
    if (!order_id) return res.status(400).json({ message: "order_id wajib diisi" });

    const [orders] = await conn.query("SELECT * FROM orders WHERE id=?", [order_id]);
    if (!orders.length) return res.status(404).json({ message: "Order tidak ditemukan" });
    const order = orders[0];

    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const [payResult] = await conn.query(
      "INSERT INTO payments (order_id, method, amount, proof_url, status, verified_at) VALUES (?,?,?,?,?,NOW())",
      [order_id, method, order.total_amount, "/uploads/midtrans-settlement.png", "verified"]
    );

    await conn.query("UPDATE orders SET status=? WHERE id=?", ["verified", order_id]);
    await generateTickets(conn, order_id);

    await conn.commit();
    res.json({
      success: true,
      message: "Pembayaran Midtrans berhasil diproses dan e-ticket telah diterbitkan!",
      payment_id: payResult.insertId,
      order_id,
      status: "verified",
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const handleMidtransNotification = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const notification = req.body;
    const { order_id: transactionId, transaction_status, fraud_status, payment_type } = notification;

    if (!transactionId) {
      return res.status(400).json({ message: "Payload tidak valid" });
    }

    const orderCodeMatch = transactionId.match(/(TKR-\d+)/);
    const orderCode = orderCodeMatch ? orderCodeMatch[1] : transactionId;

    const [orders] = await conn.query("SELECT * FROM orders WHERE order_code=? OR id=?", [orderCode, orderCode]);
    if (orders.length > 0) {
      const order = orders[0];

      if (transaction_status === "capture" || transaction_status === "settlement") {
        if (fraud_status !== "challenge") {
          await conn.query("UPDATE orders SET status='verified' WHERE id=?", [order.id]);
          await conn.query(
            "INSERT INTO payments (order_id, method, amount, status, verified_at) VALUES (?,?,?,?,NOW())",
            [order.id, payment_type === "qris" ? "qris_ewallet" : "transfer_bank", order.total_amount, "verified"]
          );
          await generateTickets(conn, order.id);
        }
      } else if (transaction_status === "cancel" || transaction_status === "deny" || transaction_status === "expire") {
        await conn.query("UPDATE orders SET status='cancelled' WHERE id=?", [order.id]);
      }
    }

    await conn.commit();
    res.json({ status: "OK" });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

export const checkMidtransStatus = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ message: "order_id wajib diisi" });

    const [orders] = await conn.query("SELECT * FROM orders WHERE id=?", [order_id]);
    if (!orders.length) return res.status(404).json({ message: "Order tidak ditemukan" });
    const order = orders[0];

    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    if (order.status === "verified") {
      return res.json({
        paid: true,
        status: "verified",
        message: "Pembayaran telah diverifikasi lunas.",
      });
    }

    const txIdentifier = order.midtrans_tx_id || order.order_code;
    const snap = getSnapClient();

    try {
      const midtransRes = await snap.transaction.status(txIdentifier);
      const txStatus = midtransRes.transaction_status;
      const fraudStatus = midtransRes.fraud_status;
      const paymentType = midtransRes.payment_type || "bank_transfer";

      if (txStatus === "settlement" || (txStatus === "capture" && fraudStatus !== "challenge")) {
        await conn.beginTransaction();
        await conn.query("UPDATE orders SET status='verified' WHERE id=?", [order.id]);

        const [existingPay] = await conn.query("SELECT id FROM payments WHERE order_id=?", [order.id]);
        if (!existingPay.length) {
          await conn.query(
            "INSERT INTO payments (order_id, method, amount, status, verified_at) VALUES (?,?,?,?,NOW())",
            [order.id, paymentType === "qris" ? "qris_ewallet" : "transfer_bank", order.total_amount, "verified"]
          );
        } else {
          await conn.query("UPDATE payments SET status='verified', verified_at=NOW() WHERE order_id=?", [order.id]);
        }

        await generateTickets(conn, order.id);
        await conn.commit();

        return res.json({
          paid: true,
          status: "verified",
          message: "Pembayaran berhasil dikonfirmasi oleh Midtrans! E-ticket resmi telah diterbitkan.",
          details: midtransRes,
        });
      }

      if (txStatus === "pending") {
        return res.json({
          paid: false,
          status: "pending",
          message: "Pembayaran belum diselesaikan. Silakan lakukan transfer atau bayar sesuai instruksi di portal Midtrans.",
          details: midtransRes,
        });
      }

      if (txStatus === "cancel" || txStatus === "deny" || txStatus === "expire") {
        await conn.query("UPDATE orders SET status='cancelled' WHERE id=?", [order.id]);
        return res.json({
          paid: false,
          status: "cancelled",
          message: `Transaksi pembayaran ${txStatus === "expire" ? "kadaluarsa" : "dibatalkan"}.`,
          details: midtransRes,
        });
      }

      return res.json({
        paid: false,
        status: order.status,
        message: "Status transaksi: " + (txStatus || "pending"),
      });
    } catch (midtransErr) {
      return res.json({
        paid: false,
        status: order.status,
        message: "Belum ada transaksi pembayaran yang diselesaikan di portal Midtrans.",
      });
    }
  } catch (err) {
    next(err);
  } finally {
    conn.release();
  }
};
