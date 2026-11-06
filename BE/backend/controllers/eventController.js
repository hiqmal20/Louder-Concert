import db from "../database.js";

export const getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT e.*, u.name AS created_by_name,
        GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS artists,
        GROUP_CONCAT(DISTINCT a.genre SEPARATOR ', ') AS genres,
        COALESCE(SUM(tc.quota), 0) AS total_quota,
        COALESCE(SUM(tc.sold), 0) AS tickets_sold,
        COALESCE(MIN(tc.price), 0) AS min_price
      FROM events e
      LEFT JOIN users u ON u.id = e.created_by
      LEFT JOIN event_artist ea ON ea.event_id = e.id
      LEFT JOIN artists a ON a.id = ea.artist_id
      LEFT JOIN ticket_categories tc ON tc.event_id = e.id
    `;
    const params = [];
    if (status) { sql += " WHERE e.status = ?"; params.push(status); }
    sql += " GROUP BY e.id ORDER BY e.event_date DESC";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
  try {
    const [events] = await db.query(
      `SELECT e.*, u.name AS created_by_name
       FROM events e LEFT JOIN users u ON u.id = e.created_by
       WHERE e.id = ?`, [req.params.id]
    );
    if (!events.length) return res.status(404).json({ message: "Event tidak ditemukan" });

    const [artists] = await db.query(
      `SELECT a.* FROM artists a
       JOIN event_artist ea ON ea.artist_id = a.id WHERE ea.event_id = ?`, [req.params.id]
    );
    const [categories] = await db.query(
      "SELECT * FROM ticket_categories WHERE event_id = ?", [req.params.id]
    );

    res.json({ ...events[0], artists, ticket_categories: categories });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { name, description, venue, event_date, event_time, status, artist_ids, has_seats } = req.body;
    if (!name || !venue || !event_date || !event_time) {
      return res.status(400).json({ message: "name, venue, event_date, event_time wajib diisi" });
    }

    let poster_url = null;
    let lineup_poster_url = null;

    if (req.files) {
      if (req.files.poster?.[0]) poster_url = `/uploads/${req.files.poster[0].filename}`;
      if (req.files.lineup_poster?.[0]) lineup_poster_url = `/uploads/${req.files.lineup_poster[0].filename}`;
    } else if (req.file) {
      poster_url = `/uploads/${req.file.filename}`;
    }
    if (!poster_url && req.body.poster_url) poster_url = req.body.poster_url;
    if (!lineup_poster_url && req.body.lineup_poster_url) lineup_poster_url = req.body.lineup_poster_url;

    const finalHasSeats = has_seats !== undefined ? (Number(has_seats) ? 1 : 0) : 1;

    const [result] = await db.query(
      "INSERT INTO events (name, description, venue, event_date, event_time, poster_url, lineup_poster_url, status, has_seats, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [name, description || null, venue, event_date, event_time, poster_url, lineup_poster_url, status || "draft", finalHasSeats, req.user.id]
    );
    const eventId = result.insertId;

    const ids = typeof artist_ids === "string" ? JSON.parse(artist_ids) : artist_ids;
    if (Array.isArray(ids) && ids.length) {
      const values = ids.map((aid) => [eventId, aid]);
      await db.query("INSERT IGNORE INTO event_artist (event_id, artist_id) VALUES ?", [values]);
    }

    res.status(201).json({ message: "Event berhasil dibuat", id: eventId });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const { name, description, venue, event_date, event_time, status, artist_ids, has_seats } = req.body;
    
    const [current] = await db.query("SELECT * FROM events WHERE id=?", [req.params.id]);
    if (!current.length) return res.status(404).json({ message: "Event tidak ditemukan" });

    let poster_url = current[0].poster_url;
    if (req.files?.poster?.[0]) {
      poster_url = `/uploads/${req.files.poster[0].filename}`;
    } else if (req.file) {
      poster_url = `/uploads/${req.file.filename}`;
    } else if (req.body.poster_url !== undefined) {
      poster_url = req.body.poster_url ? req.body.poster_url : null;
    }

    let lineup_poster_url = current[0].lineup_poster_url;
    if (req.files?.lineup_poster?.[0]) {
      lineup_poster_url = `/uploads/${req.files.lineup_poster[0].filename}`;
    } else if (req.body.lineup_poster_url !== undefined) {
      lineup_poster_url = req.body.lineup_poster_url ? req.body.lineup_poster_url : null;
    }

    const finalName = name !== undefined && name.trim() ? name.trim() : current[0].name;
    const finalDescription = description !== undefined ? (description.trim() || null) : current[0].description;
    const finalVenue = venue !== undefined && venue.trim() ? venue.trim() : current[0].venue;
    const finalEventDate = event_date || current[0].event_date;
    const finalEventTime = event_time || current[0].event_time;
    const finalStatus = status || current[0].status;
    const finalHasSeats = has_seats !== undefined ? (Number(has_seats) ? 1 : 0) : current[0].has_seats;

    await db.query(
      "UPDATE events SET name=?, description=?, venue=?, event_date=?, event_time=?, poster_url=?, lineup_poster_url=?, status=?, has_seats=? WHERE id=?",
      [finalName, finalDescription, finalVenue, finalEventDate, finalEventTime, poster_url, lineup_poster_url, finalStatus, finalHasSeats, req.params.id]
    );

    const ids = typeof artist_ids === "string" ? JSON.parse(artist_ids) : artist_ids;
    if (Array.isArray(ids)) {
      await db.query("DELETE FROM event_artist WHERE event_id = ?", [req.params.id]);
      if (ids.length) {
        const values = ids.map((aid) => [req.params.id, aid]);
        await db.query("INSERT IGNORE INTO event_artist (event_id, artist_id) VALUES ?", [values]);
      }
    }

    res.json({ message: "Event berhasil diupdate" });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM events WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Event tidak ditemukan" });
    res.json({ message: "Event berhasil dihapus" });
  } catch (err) { next(err); }
};

export const getSalesSummary = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM v_ticket_sales_summary WHERE event_id = ?", [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
};
