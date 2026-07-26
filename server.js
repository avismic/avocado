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

app.post("/api/drivers", async (req, res) => {
  try {
    const { username, password, full_name, owner_id } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await sql`
      SELECT id FROM users WHERE username = ${username}
    `;

    if (existing.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const newDriver = await sql`
      INSERT INTO users (username, password_hash, full_name, role, owner_id)
      VALUES (${username}, ${password}, ${full_name}, 'driver', ${owner_id ?? null})
      RETURNING id, username, full_name, role
    `;

    res.status(201).json(newDriver[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/drivers", async (req, res) => {
  try {
    const { owner_id } = req.query;

    let drivers;
    if (owner_id) {
      drivers = await sql`
        SELECT id, username, full_name, role 
        FROM users 
        WHERE role = 'driver' AND owner_id = ${owner_id}
      `;
    } else {
      drivers = await sql`
        SELECT id, username, full_name, role 
        FROM users 
        WHERE role = 'driver'
      `;
    }

    res.status(200).json(drivers);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/drivers/details", async (req, res) => {
  try {
    const { owner_id } = req.query;
    if (!owner_id) {
      return res.status(400).json({ error: "owner_id is required" });
    }

    const drivers = await sql`
      SELECT 
        u.id,
        u.full_name,
        u.username,
        u.password_hash AS password,
        COALESCE(f.total_fuel, 0) AS total_fuel_spent,
        a.last_attendance_time,
        a.last_latitude,
        a.last_longitude
      FROM users u
      LEFT JOIN (
        SELECT 
          driver_id, 
          SUM(cost) AS total_fuel
        FROM fuel_logs
        GROUP BY driver_id
      ) f ON u.id = f.driver_id
      LEFT JOIN (
        SELECT DISTINCT ON (driver_id)
          driver_id,
          timestamp AS last_attendance_time,
          latitude AS last_latitude,
          longitude AS last_longitude
        FROM attendance_logs
        ORDER BY driver_id, timestamp DESC
      ) a ON u.id = a.driver_id
      WHERE u.role = 'driver' AND u.owner_id = ${owner_id}
      ORDER BY u.full_name ASC
    `;

    res.status(200).json(drivers);
  } catch (error) {
    console.error("Error fetching driver details:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
