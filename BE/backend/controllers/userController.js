import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

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
    const [current] = await db.query("SELECT * FROM users WHERE id=?", [req.user.id]);
    if (!current.length) return res.status(404).json({ message: "User tidak ditemukan" });

    const { name, phone, password, avatar_url: bodyAvatar, avatar_base64 } = req.body;
    const finalName = name !== undefined && name.trim() ? name.trim() : current[0].name;
    const finalPhone = phone !== undefined ? (phone.trim() || null) : current[0].phone;

    let finalAvatar = current[0].avatar_url;
    if (req.file) {
      finalAvatar = `/uploads/${req.file.filename}`;
    } else if (avatar_base64) {
      try {
        const matches = avatar_base64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        let ext = "jpg";
        let rawBase64 = avatar_base64;
        if (matches && matches.length === 3) {
          ext = matches[1] === "jpeg" ? "jpg" : matches[1];
          rawBase64 = matches[2];
        }
        const buffer = Buffer.from(rawBase64, "base64");
        const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
        const uploadDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        finalAvatar = `/uploads/${filename}`;
      } catch (e) {
        console.error("Failed to decode base64 avatar", e);
      }
    } else if (bodyAvatar !== undefined) {
      finalAvatar = bodyAvatar ? bodyAvatar : null;
    }

    let sql = "UPDATE users SET name=?, phone=?, avatar_url=?";
    const params = [finalName, finalPhone, finalAvatar];

    if (password && password.trim()) {
      const hashed = await bcrypt.hash(password.trim(), 10);
      sql += ", password=?";
      params.push(hashed);
    }

    sql += " WHERE id=?";
    params.push(req.user.id);

    await db.query(sql, params);

    const [updated] = await db.query(
      "SELECT id, name, email, phone, role, avatar_url FROM users WHERE id=?",
      [req.user.id]
    );

    res.json({ message: "Profil berhasil diupdate", user: updated[0] });
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
