import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes           from "./routes/authRoutes.js";
import userRoutes           from "./routes/userRoutes.js";
import artistRoutes         from "./routes/artistRoutes.js";
import eventRoutes          from "./routes/eventRoutes.js";
import ticketCategoryRoutes from "./routes/ticketCategoryRoutes.js";
import orderRoutes          from "./routes/orderRoutes.js";
import paymentRoutes        from "./routes/paymentRoutes.js";
import ticketRoutes         from "./routes/ticketRoutes.js";
import errorHandler         from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API LOUDER - Sistem Pemesanan Tiket Konser");
});

// Routes
app.use("/api/louder/auth",              authRoutes);
app.use("/api/louder/users",             userRoutes);
app.use("/api/louder/artists",           artistRoutes);
app.use("/api/louder/events",            eventRoutes);
app.use("/api/louder/ticket-categories", ticketCategoryRoutes);
app.use("/api/louder/orders",            orderRoutes);
app.use("/api/louder/payments",          paymentRoutes);
app.use("/api/louder/tickets",           ticketRoutes);

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`LOUDER backend running on port ${PORT}`);
});

export default app;
