import bcrypt from "bcryptjs";
import db from "../database.js";

export const getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) { next(err); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, password } = req.body;
    let sql = "UPDATE users SET name=?, phone=?";
    const params = [name, phone || null];

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      sql += ", password=?";
      params.push(hashed);
    }

    sql += " WHERE id=?";
    params.push(req.user.id);

    await db.query(sql, params);
    res.json({ message: "Profil berhasil diupdate" });
  } catch (err) { next(err); }
};

export const toggleActive = async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT is_active FROM users WHERE id=?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "User tidak ditemukan" });
    const newStatus = rows[0].is_active ? 0 : 1;
    await db.query("UPDATE users SET is_active=? WHERE id=?", [newStatus, req.params.id]);
    res.json({ message: `User berhasil di${newStatus ? "aktifkan" : "nonaktifkan"}` });
  } catch (err) { next(err); }
};
