import db from "../database.js";

export const getByEvent = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM ticket_categories WHERE event_id = ?", [req.params.eventId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { event_id, name, price, quota } = req.body;
    if (!event_id || !name || price == null || !quota) {
      return res.status(400).json({ message: "event_id, name, price, quota wajib diisi" });
    }
    const [result] = await db.query(
      "INSERT INTO ticket_categories (event_id, name, price, quota) VALUES (?,?,?,?)",
      [event_id, name, price, quota]
    );
    res.status(201).json({ message: "Kategori tiket berhasil dibuat", id: result.insertId });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const { name, price, quota } = req.body;
    const [result] = await db.query(
      "UPDATE ticket_categories SET name=?, price=?, quota=? WHERE id=?",
      [name, price, quota, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Kategori tidak ditemukan" });
    res.json({ message: "Kategori tiket berhasil diupdate" });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    const [result] = await db.query("DELETE FROM ticket_categories WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Kategori tidak ditemukan" });
    res.json({ message: "Kategori tiket berhasil dihapus" });
  } catch (err) { next(err); }
};
