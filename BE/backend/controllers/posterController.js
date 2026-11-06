import db from "../database.js";

export const getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT fp.*, e.name AS event_name, e.venue AS event_venue_db, e.event_date AS event_date_db,
             COALESCE((SELECT MIN(tc.price) FROM ticket_categories tc WHERE tc.event_id = fp.event_id), 150000) AS min_price
      FROM festival_posters fp
      LEFT JOIN events e ON e.id = fp.event_id
    `;
    const params = [];
    if (status) {
      sql += " WHERE fp.status = ?";
      params.push(status);
    }
    sql += " ORDER BY fp.created_at DESC";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT fp.*, e.name AS event_name
       FROM festival_posters fp
       LEFT JOIN events e ON e.id = fp.event_id
       WHERE fp.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Poster tidak ditemukan" });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { event_id, title, artists_lineup, venue, event_date, status } = req.body;
    if (!title) return res.status(400).json({ message: "Judul poster wajib diisi" });

    const poster_url = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.poster_url || null;

    if (!poster_url) {
      return res.status(400).json({ message: "File poster promosi wajib diupload" });
    }

    const eventIdVal = event_id ? Number(event_id) : null;

    const [result] = await db.query(
      `INSERT INTO festival_posters (event_id, title, artists_lineup, venue, event_date, poster_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        eventIdVal,
        title.trim(),
        artists_lineup ? artists_lineup.trim() : null,
        venue ? venue.trim() : null,
        event_date || null,
        poster_url,
        status || "ACTIVE",
      ]
    );

    if (eventIdVal) {
      await db.query("UPDATE events SET lineup_poster_url = ? WHERE id = ?", [poster_url, eventIdVal]);
    }

    res.status(201).json({ message: "Poster promosi festival berhasil diterbitkan", id: result.insertId });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const { event_id, title, artists_lineup, venue, event_date, status } = req.body;
    const [current] = await db.query("SELECT * FROM festival_posters WHERE id = ?", [req.params.id]);
    if (!current.length) return res.status(404).json({ message: "Poster tidak ditemukan" });

    let poster_url = current[0].poster_url;
    if (req.file) {
      poster_url = `/uploads/${req.file.filename}`;
    } else if (req.body.poster_url !== undefined && req.body.poster_url) {
      poster_url = req.body.poster_url;
    }

    const finalTitle = title !== undefined && title.trim() ? title.trim() : current[0].title;
    const finalArtists = artists_lineup !== undefined ? (artists_lineup.trim() || null) : current[0].artists_lineup;
    const finalVenue = venue !== undefined ? (venue.trim() || null) : current[0].venue;
    const finalDate = event_date !== undefined ? (event_date || null) : current[0].event_date;
    const finalStatus = status || current[0].status;
    const finalEventId = event_id !== undefined ? (event_id ? Number(event_id) : null) : current[0].event_id;

    await db.query(
      `UPDATE festival_posters SET event_id=?, title=?, artists_lineup=?, venue=?, event_date=?, poster_url=?, status=?
       WHERE id=?`,
      [finalEventId, finalTitle, finalArtists, finalVenue, finalDate, poster_url, finalStatus, req.params.id]
    );

    if (finalEventId) {
      await db.query("UPDATE events SET lineup_poster_url = ? WHERE id = ?", [poster_url, finalEventId]);
    }

    res.json({ message: "Poster promosi festival berhasil diperbarui" });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM festival_posters WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Poster tidak ditemukan" });
    res.json({ message: "Poster berhasil dihapus" });
  } catch (err) { next(err); }
};
