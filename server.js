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
