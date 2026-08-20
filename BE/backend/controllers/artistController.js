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
    res.json(rows[0]);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    if (!name) return res.status(400).json({ message: "name wajib diisi" });

    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO artists (name, bio, photo_url) VALUES (?, ?, ?)",
      [name, bio || null, photo_url]
    );
    res.status(201).json({ message: "Artis berhasil dibuat", id: result.insertId });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : req.body.photo_url || null;

    const [result] = await db.query(
      "UPDATE artists SET name=?, bio=?, photo_url=? WHERE id=?",
      [name, bio || null, photo_url, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Artis tidak ditemukan" });
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
