# BillCraft — Full-Stack Billing Software

## Quick Start

```bash
# Terminal 1 — Backend
cd backend
npm install
cp .env.example .env     # set JWT_SECRET to any long random string
npm run dev              # → http://localhost:4000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev              # → http://localhost:5173
```

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + TanStack Router + Tailwind CSS v3
- **Backend:** Node.js + Express + TypeScript
- **Database:** Excel file (`backend/data/billcraft.xlsx`) — auto-created on first run
- **Auth:** JWT (bcryptjs for password hashing)
- **PDF:** jsPDF + jspdf-autotable (client-side generation)
- **Excel Export:** SheetJS/xlsx (server-side)

## Features
- ✅ Vendor registration with unique ID (VND-XXXXXX)
- ✅ Login with Vendor ID + password
- ✅ Inventory management (add / edit / delete products)
- ✅ Bill creation with product search
- ✅ GST calculation (CGST + SGST)
- ✅ PDF invoice download (client-side, no server needed)
- ✅ All data stored in Excel (.xlsx) — easy to open and view
- ✅ Export all bills to Excel from dashboard header button
- ✅ Profile editing

## Data Storage
All data lives in `backend/data/billcraft.xlsx` with 3 sheets:
- **Users** — vendor accounts  
- **Products** — inventory per vendor
- **Bills** — saved invoices (line items as JSON in one column)

You can open this file in Excel/Google Sheets to view your data directly.

## Copilot Integration
See `COPILOT_GUIDE.md` for ready-to-use prompts for GitHub Copilot.
