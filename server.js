import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const sql = neon(
  process.env.DATABASE_URL || process.env.VITE_NEON_DATABASE_URL,
);

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const users = await sql`
      SELECT id, username, password_hash, full_name, role 
      FROM users 
      WHERE username = ${username}
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = users[0];

    if (user.password_hash !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/attendance", async (req, res) => {
  try {
    const { id, driver_id, latitude, longitude, timestamp } = req.body;

    await sql`
      INSERT INTO attendance_logs (id, driver_id, latitude, longitude, timestamp)
      VALUES (${id}, ${driver_id}, ${latitude}, ${longitude}, ${Number(timestamp)})
    `;

    res.status(200).json({ success: true, message: "Attendance recorded" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/fuel", async (req, res) => {
  try {
    const {
      id,
      driver_id,
      liters,
      cost,
      amount_spent,
      odometer,
      odometer_reading,
      latitude,
      longitude,
      timestamp,
    } = req.body;

    const finalCost = cost ?? amount_spent;
    const finalOdometer = odometer ?? odometer_reading;

    await sql`
      INSERT INTO fuel_logs (id, driver_id, liters, cost, odometer, latitude, longitude, timestamp)
      VALUES (
        ${id},
        ${driver_id},
        ${liters ?? null},
        ${finalCost},
        ${finalOdometer},
        ${latitude},
        ${longitude},
        ${Number(timestamp)}
      )
    `;

    res.status(200).json({ success: true, message: "Fuel log recorded" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
