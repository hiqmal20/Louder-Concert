import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../database.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, dan password wajib diisi" });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) return res.status(409).json({ message: "Email sudah digunakan" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone || null, hashed, "customer"]
    );

    res.status(201).json({ message: "Registrasi berhasil", userId: result.insertId });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email dan password wajib diisi" });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE email = ? AND is_active = 1", [email]);
    if (!rows.length) return res.status(401).json({ message: "Email atau password salah" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Email atau password salah" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) { next(err); }
};

export const me = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User tidak ditemukan" });
    res.json(rows[0]);
  } catch (err) { next(err); }
};
