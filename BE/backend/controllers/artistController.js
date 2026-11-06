import db from "../database.js";

export const getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM artists ORDER BY name");
    res.json(rows);
  } catch (err) { next(err); }
};

export const getOne = async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM artists WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Artis tidak ditemukan" });

    const [events] = await db.query(
      `SELECT e.*, COALESCE(MIN(tc.price), 0) AS min_price
       FROM events e
       JOIN event_artist ea ON ea.event_id = e.id
       LEFT JOIN ticket_categories tc ON tc.event_id = e.id
       WHERE ea.artist_id = ?
       GROUP BY e.id
       ORDER BY e.event_date ASC`,
      [req.params.id]
    );

    res.json({ ...rows[0], events });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { name, genre, bio, email, phone, status } = req.body;
    if (!name) return res.status(400).json({ message: "name wajib diisi" });

    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO artists (name, genre, bio, email, phone, status, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, genre || null, bio || null, email || null, phone || null, status || "ACTIVE", photo_url]
    );
    res.status(201).json({ message: "Artis berhasil dibuat", id: result.insertId });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const { name, genre, bio, email, phone, status } = req.body;
    const [current] = await db.query("SELECT * FROM artists WHERE id=?", [req.params.id]);
    if (!current.length) return res.status(404).json({ message: "Artis tidak ditemukan" });

    let photo_url = current[0].photo_url;
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    } else if (req.body.photo_url !== undefined) {
      photo_url = req.body.photo_url ? req.body.photo_url : null;
    }

    const finalName = name !== undefined && name.trim() ? name.trim() : current[0].name;
    const finalGenre = genre !== undefined ? (genre.trim() || null) : current[0].genre;
    const finalBio = bio !== undefined ? (bio.trim() || null) : current[0].bio;
    const finalEmail = email !== undefined ? (email.trim() || null) : current[0].email;
    const finalPhone = phone !== undefined ? (phone.trim() || null) : current[0].phone;
    const finalStatus = status || current[0].status;

    await db.query(
      "UPDATE artists SET name=?, genre=?, bio=?, email=?, phone=?, status=?, photo_url=? WHERE id=?",
      [finalName, finalGenre, finalBio, finalEmail, finalPhone, finalStatus, photo_url, req.params.id]
    );
    res.json({ message: "Artis berhasil diupdate" });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM artists WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Artis tidak ditemukan" });
    res.json({ message: "Artis berhasil dihapus" });
  } catch (err) { next(err); }
};
