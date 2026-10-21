# Airport Cargo & Warehouse Management System

A production-grade, full-stack digital management platform for airport cargo terminals and airside warehouses. Built with **React 19**, **TypeScript**, **Node.js/Express**, **Mongoose / MongoDB**, and **Redis caching**.

---

## ✈️ 1. Project Overview

Airports and cargo terminals handle thousands of tons of cargo daily. Manual coordination leads to misplaced consignments, ramp delays, and warehouse capacity overruns. This system provides an end-to-end digital lifecycle:
- **Consignment Registration:** Automatic generation of unique cargo codes (e.g. `CG-10025`), weight verification, commodity classification, and route logging.
- **Warehouse Capacity Management:** Real-time occupancy calculation (`Available = Total Capacity - Occupied Capacity`), rack/bay allocation, and protection against overfill.
- **7-Stage Shipment Lifecycle:** Strict state machine enforcement:
  `Registered` → `Received` → `Stored` → `Processing` → `Loaded` → `In Transit` → `Delivered`.
- **Live Cargo Tracking with Redis Caching:** Sub-millisecond tracking queries with cache-aside pattern, automatic invalidation on movement, and graceful in-memory fallback.
- **Role-Based Access Control (RBAC):** Admin (full system & safe deletion) vs. Warehouse Staff (intake, allocation, status advancement).

---

## 🛠️ 2. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend:** Node.js, Express.js, TypeScript, Zod Schema Validation
- **Database:** MongoDB Atlas / Community Server with Mongoose models & embedded store fallback
- **Caching:** Redis (`ioredis`) for high-frequency tracking queries with seamless fallback
- **Authentication:** JWT tokens, bcrypt password hashing, HTTP-only cookie support
- **Testing:** Node.js native test runner (`node:test`) executed via `tsx`

---

## 🔐 3. Demo Credentials

The database comes pre-seeded with two demo accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@airportcargo.com` | `Admin123!` | Dashboard, Cargo CRUD, Safe Delete, Warehouse Management, User RBAC |
| **Warehouse Staff** | `staff@airportcargo.com` | `Staff123!` | Cargo intake, storage allocation, shipment status advancement, tracking |

*Demo tracking cargo code:* **`CG-10025`** (Aerospace Components, FRA → DXB).

---

## 💻 4. Local Development (VS Code without Docker)

This application runs natively on macOS, Linux, and Windows without Docker or Docker Compose.

### Prerequisites
1. **Node.js:** v18 LTS or later (`node -v`)
2. **Git:** Installed on your system
3. **VS Code**

### Quickstart Commands
```bash
# 1. Clone repository & install dependencies
npm install

# 2. Run unit tests on domain rules
npm test

# 3. Start local development server
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🌐 5. Deployment Guide (Vercel + Render)

### A. MongoDB Atlas Cloud Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. Under **Database Access**, create a user (e.g. `cargo_admin` with password).
3. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) or Render IPs.
4. Copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/airport_cargo?retryWrites=true&w=majority
   ```

### B. Backend on Render
1. Create a **New Web Service** on Render and connect your repository.
2. Settings:
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `node server.ts` (or `npm start`)
   - **Health Check Path:** `/api/health`
3. Environment Variables:
   - `PORT`: `10000` (or leave default assigned by Render)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string>`
   - `JWT_SECRET`: `<Generate a random 32-character string>`
   - `REDIS_URL`: `<Your Redis connection string, or omit for automatic fallback>`

### C. Frontend on Vercel
1. Import your GitHub repository to Vercel.
2. Framework Preset: **Vite**.
3. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables:
   - `VITE_API_URL`: `https://your-backend-app.onrender.com/api`

---

## 📡 6. REST API Reference

### Authentication
- `POST /api/auth/login` — Sign in and receive JWT token & session cookie
- `POST /api/auth/logout` — Invalidate session cookie
- `GET /api/auth/me` — Retrieve active authenticated user profile

### Dashboard & Analytics
- `GET /api/dashboard/stats` — Summary metrics, distribution, and warehouse utilization
- `GET /api/dashboard/recent-activity` — Recent airside movements and checkpoints

### Cargo Consignments
- `GET /api/cargo` — List cargos with search, status, type, and warehouse filters + pagination
- `GET /api/cargo/:id` — Get full cargo details
- `POST /api/cargo` — Register new cargo (validates positive weight & capacity)
- `PUT /api/cargo/:id` — Update consignment details
- `DELETE /api/cargo/:id` — Safe deletion (Admin only, only Registered or Delivered status)

### Shipment Lifecycle
- `GET /api/shipments` — View all shipments
- `GET /api/shipments/:id` — View shipment details and audit trail
- `PUT /api/shipments/:id/status` — Advance shipment status (validates transition rules)

### Warehouses
- `GET /api/warehouses` — List all facilities with live available capacity
- `GET /api/warehouses/:id` — Warehouse details & stored cargo items
- `POST /api/warehouses` — Create new storage facility
- `POST /api/warehouses/:id/assign` — Assign cargo consignment to bay rack
- `POST /api/warehouses/:id/remove` — Release consignment from warehouse

### Tracking
- `GET /api/tracking/:cargoCode` — Public tracking endpoint with Redis cache-aside

---

## 🧪 7. Unit Testing

Run the test suite powered by Node.js built-in test runner:
```bash
npm test
```
Verifies:
- Available capacity formula clamps and avoids negative occupancy
- Warehouse weight limit enforcement
- Cargo code syntax validation (`CG-10025`)
- Sequential 7-stage lifecycle state progression
