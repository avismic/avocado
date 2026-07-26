-- db/schema.sql
-- Neon PostgreSQL Database Schema for Fleet Management PWA

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('driver', 'owner')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Attendance Logs Table
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Fuel Logs Table
CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  liters NUMERIC(10, 2),
  cost NUMERIC(10, 2) NOT NULL,
  odometer NUMERIC(10, 2) NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_attendance_driver_id ON attendance_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_fuel_driver_id ON fuel_logs(driver_id);

-- Initial seed data for development / mock environments
INSERT INTO users (id, username, password_hash, full_name, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'driver1', 'driverpw', 'Driver One', 'driver'),
  ('22222222-2222-2222-2222-222222222222', 'owner1', 'ownerpw', 'Owner One', 'owner')
ON CONFLICT (username) DO NOTHING;
