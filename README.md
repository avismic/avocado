# 🚛 Fleet Management PWA

A modern **Progressive Web Application (PWA)** for fleet management, allowing drivers and fleet owners to efficiently manage attendance, fuel logs, and fleet operations from any device.

Built with **Vanilla JavaScript, Vite, Express.js, and Neon PostgreSQL**, the application supports offline functionality, location tracking, and role-based dashboards. :contentReference[oaicite:0]{index=0}

---

## ✨ Features

### Driver

- 🔐 Secure login
- 📍 GPS-based attendance marking
- ⛽ Fuel logging
- 📊 Attendance history
- 💾 Offline support with automatic synchronization
- 📱 Installable Progressive Web App

### Fleet Owner

- 👥 Owner dashboard
- 📈 View driver attendance
- ⛽ View driver fuel logs
- 📊 Fleet monitoring

### General

- Progressive Web App (PWA)
- Offline caching
- Service Worker support
- Responsive Apple-inspired UI
- Role-based authentication
- REST API backend
- PostgreSQL database

---

# 🛠 Tech Stack

## Frontend

- Vanilla JavaScript (ES Modules)
- HTML5
- CSS3
- Vite

## Backend

- Node.js
- Express.js

## Database

- Neon PostgreSQL

## Testing

- Vitest
- JSDOM

---

# 📁 Project Structure

```
Fleet-Management-PWA
│
├── css/
├── db/
├── features/
│   ├── attendance/
│   ├── driver-dashboard/
│   ├── fuel/
│   ├── login/
│   ├── owner-dashboard/
│   └── shared/
│
├── js/
│   ├── utils/
│   ├── auth.js
│   ├── router.js
│   └── app.js
│
├── tests/
│
├── server.js
├── manifest.json
├── sw.js
└── package.json
```

---

# 🚀 Installation

Clone the repository

```bash
git clone <repository-url>
```

Move into the project

```bash
cd Fleet-Management-PWA
```

Install dependencies

```bash
npm install
```

---

# ⚙️ Environment Variables

Create a `.env` file.

```env
DATABASE_URL=your_neon_database_url
```

or

```env
VITE_NEON_DATABASE_URL=your_database_url
```

---

# ▶️ Running the Project

### Start the frontend

```bash
npm run dev
```

### Start the backend

```bash
node server.js
```

The frontend runs on Vite while the backend serves the REST API.

---

# 🗄 Database

Run the schema:

```sql
db/schema.sql
```

The schema creates:

- Users
- Attendance Logs
- Fuel Logs

It also inserts demo users for development.

---

# 👤 Demo Accounts

Driver

```
Username: driver1
Password: driverpw
```

Owner

```
Username: owner1
Password: ownerpw
```

---

# 📡 API Endpoints

## Authentication

```
POST /api/auth/login
```

---

## Attendance

```
POST /api/attendance
```

---

## Fuel

```
POST /api/fuel
```

---

# 📱 Progressive Web App

The application supports:

- Installable application
- Offline mode
- Local caching
- Background synchronization
- Automatic request retry when back online

---

# 🧪 Testing

Run all tests:

```bash
npm test
```

---

# 🚀 Deployment

Frontend can be deployed using any static hosting service.

Backend requires:

- Node.js
- Express
- PostgreSQL (Neon)

---

# 📸 Screens

- Login
- Driver Dashboard
- Attendance
- Fuel Log
- Owner Dashboard
- Attendance History

---

# 📌 Future Improvements

- JWT authentication
- Password hashing (bcrypt)
- Driver profile management
- Vehicle management
- Route tracking
- Analytics dashboard
- Push notifications
- Image upload for fuel receipts
- Export reports
- Multi-company support

---

# 👨‍💻 Authors

Developed as a Fleet Management Progressive Web Application using modern web technologies.

---

# 📄 License

This project is developed for educational purposes and may be extended for production use.
