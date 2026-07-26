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

// Add this helper function near the top of server.js
async function getAddressFromCoords(lat, lon) {
  if (!lat || !lon) return null;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18`,
      {
        headers: {
          "User-Agent": "FleetManagementApp/1.0",
        },
      },
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      const primary =
        addr.road ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.quarter ||
        addr.locality ||
        addr.subdistrict ||
        addr.county ||
        addr.hamlet ||
        addr.village ||
        "";
      const secondary =
        addr.city ||
        addr.town ||
        addr.city_district ||
        addr.state_district ||
        "";
      const parts = [primary, secondary].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(", ");
      }
    }
  } catch (err) {}
  return null;
}

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

    let address = null;
    try {
      if (latitude && longitude) {
        address = await getAddressFromCoords(latitude, longitude);
      }
    } catch (err) {
      address = null;
    }

    await sql`
      INSERT INTO attendance_logs (id, driver_id, latitude, longitude, address, timestamp)
      VALUES (${id}, ${driver_id}, ${latitude}, ${longitude}, ${address}, ${Number(timestamp)})
    `;

    res
      .status(200)
      .json({ success: true, message: "Attendance recorded", address });
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
        a.last_longitude,
        a.last_address
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
          longitude AS last_longitude,
          address AS last_address
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

app.post("/api/admin/add-owner", async (req, res) => {
  try {
    const { full_name, username, password } = req.body;
    if (!full_name || !username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const [newOwner] = await sql`
      INSERT INTO users (full_name, username, password_hash, role)
      VALUES (${full_name}, ${username}, ${password}, 'owner')
      RETURNING id, full_name, username, role
    `;

    res.status(201).json(newOwner);
  } catch (error) {
    console.error("Error adding owner:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/owners", async (req, res) => {
  try {
    const owners = await sql`
      SELECT id, full_name, username, password_hash AS password 
      FROM users 
      WHERE role = 'owner'
    `;
    res.json(owners);
  } catch (error) {
    console.error("Error fetching owners:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/drivers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM users WHERE id = ${id} AND role = 'driver'
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: "Driver not found" });
    }

    res.status(200).json({ success: true, message: "Driver deleted" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/attendance", async (req, res) => {
  try {
    const { driver_id } = req.query;
    let logs;
    if (driver_id) {
      logs = await sql`
        SELECT id, driver_id, latitude, longitude, address, timestamp 
        FROM attendance_logs 
        WHERE driver_id = ${driver_id} 
        ORDER BY timestamp DESC
      `;
    } else {
      logs = await sql`
        SELECT id, driver_id, latitude, longitude, address, timestamp 
        FROM attendance_logs 
        ORDER BY timestamp DESC
      `;
    }
    res.status(200).json(logs);
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

    let address = null;
    try {
      if (latitude && longitude) {
        address = await getAddressFromCoords(latitude, longitude);
      }
    } catch (err) {
      address = null;
    }

    await sql`
      INSERT INTO fuel_logs (id, driver_id, liters, cost, odometer, latitude, longitude, address, timestamp)
      VALUES (
        ${id},
        ${driver_id},
        ${liters ?? null},
        ${finalCost},
        ${finalOdometer},
        ${latitude},
        ${longitude},
        ${address},
        ${Number(timestamp)}
      )
    `;

    res
      .status(200)
      .json({ success: true, message: "Fuel log recorded", address });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/fuel", async (req, res) => {
  try {
    const { driver_id } = req.query;
    let logs;
    if (driver_id) {
      logs = await sql`
        SELECT id, driver_id, liters, cost, odometer, latitude, longitude, address, timestamp 
        FROM fuel_logs 
        WHERE driver_id = ${driver_id} 
        ORDER BY timestamp DESC
      `;
    } else {
      logs = await sql`
        SELECT id, driver_id, liters, cost, odometer, latitude, longitude, address, timestamp 
        FROM fuel_logs 
        ORDER BY timestamp DESC
      `;
    }
    res.status(200).json(logs);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
