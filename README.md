# BillCraft — Full-Stack Billing Software

A professional billing and invoice management system for shop vendors.
**Tech Stack:** React + TypeScript + TanStack Router (Frontend) | Node.js + Express + TypeScript (Backend)

---

## Project Structure

```
billcraft/
├── frontend/          ← React + Vite + TanStack Router
└── backend/           ← Node.js + Express + TypeScript
```

---

## 🚀 Quick Start

### Step 1 — Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2 — Configure Backend Environment

```bash
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
```

### Step 3 — Start the Backend

```bash
npm run dev        # development (auto-restart on changes)
# OR
npm run build && npm start   # production
```

Backend runs on: **http://localhost:4000**
Data is stored in: `backend/data/db.json` (auto-created on first run)

---

### Step 4 — Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 5 — Start the Frontend

```bash
npm run dev
```

Frontend runs on: **http://localhost:5173**

> The Vite dev server proxies all `/api` requests to `http://localhost:4000` automatically.

---

## 📋 API Endpoints

### Auth
| Method | Endpoint             | Description                    | Auth |
|--------|----------------------|--------------------------------|------|
| POST   | /api/auth/register   | Register new vendor            | ❌   |
| POST   | /api/auth/login      | Login and get JWT token        | ❌   |
| GET    | /api/auth/me         | Get current user profile       | ✅   |
| PUT    | /api/auth/profile    | Update profile / password      | ✅   |

### Products
| Method | Endpoint             | Description                    | Auth |
|--------|----------------------|--------------------------------|------|
| GET    | /api/products        | List all products for user     | ✅   |
| POST   | /api/products        | Add a new product              | ✅   |
| PUT    | /api/products/:id    | Update a product               | ✅   |
| DELETE | /api/products/:id    | Delete a product               | ✅   |

### Bills
| Method | Endpoint             | Description                    | Auth |
|--------|----------------------|--------------------------------|------|
| GET    | /api/bills           | List all bills (filter: ?date) | ✅   |
| POST   | /api/bills           | Save a new bill                | ✅   |
| GET    | /api/bills/stats     | Today's sales & bill count     | ✅   |
| GET    | /api/bills/export    | Download bills as Excel        | ✅   |
| GET    | /api/bills/:id       | Get a single bill              | ✅   |

---

## 📊 Excel Integration (Next Steps)

The `/api/bills/export` endpoint is already implemented and ready.
You just need to install the `xlsx` package:

```bash
cd backend
npm install xlsx
npm install -D @types/xlsx
```

After installing, visit `GET /api/bills/export` with a valid Bearer token to download all bills as a `.xlsx` file.

The export includes one row per bill item with these columns:
- Bill No, Date, Customer Name, Customer Phone, Customer Address
- Product Name, HSN Code, Quantity, Unit, Rate, Amount
- Sub Total, CGST %, CGST Amount, SGST %, SGST Amount, Grand Total
- Shop Name, GST No

### Export via Frontend (add this button anywhere in BillingSection or Dashboard)

```tsx
import { getBillsExportUrl } from '@/api/services';

// In your component:
<a href={getBillsExportUrl()} download>
  <button>Export to Excel</button>
</a>
```

> **Note:** The export URL includes the JWT token as a query param for the download link to work directly.
> For production, consider a more secure approach (e.g. short-lived signed URLs).

---

## 🗄️ Database

The backend uses a **simple JSON file** database at `backend/data/db.json`.

**Structure:**
```json
{
  "users": [...],
  "products": [...],
  "bills": [...]
}
```

**Why JSON file instead of MySQL?**
- Zero setup — works out of the box
- Perfect for single-shop deployments
- Easy to backup (just copy the file)

**When to upgrade to MySQL:**
- Multiple concurrent users editing data simultaneously
- 10,000+ bills / products
- Multi-server deployment

**Upgrading to MySQL later:**
Only `backend/src/db.ts` needs to be replaced with a MySQL adapter (e.g. using `mysql2` or `prisma`). All routes stay the same.

---

## 🏗️ Production Build

```bash
# Backend
cd backend
npm run build
node dist/index.js

# Frontend
cd frontend
npm run build
# Serve the dist/ folder with nginx or any static host
```

For production, set `FRONTEND_URL` in backend `.env` to your actual frontend domain.

---

## 🔐 Security Notes

1. **Change JWT_SECRET** in `.env` — use a long random string (32+ chars)
2. **Never commit** `backend/.env` or `backend/data/db.json` to git
3. The `.gitignore` already excludes both

---

## 📦 Dependencies

### Backend
- `express` — HTTP server
- `cors` — cross-origin support
- `bcryptjs` — password hashing
- `jsonwebtoken` — JWT auth
- `uuid` — unique IDs
- `xlsx` *(optional)* — Excel export

### Frontend
- `react` + `react-dom`
- `@tanstack/react-router` — file-based routing
- `axios` — HTTP client with interceptors
- `jspdf` + `jspdf-autotable` — PDF invoice generation
- `lucide-react` — icons
- `tailwindcss` — styling
