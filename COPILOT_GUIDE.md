# BillCraft — GitHub Copilot Prompt Guide

Use these prompts exactly as written when talking to GitHub Copilot Chat.
Copy-paste them one at a time and follow the instructions after each.

---

## PHASE 1 — Project Setup

### Prompt 1 — Explain the project structure to Copilot
```
I have a full-stack billing app called BillCraft.
- Frontend: React 18 + TypeScript + Vite + TanStack Router + Tailwind CSS v3
- Backend:  Node.js + Express + TypeScript
- Database: Excel file (billcraft.xlsx) using the `xlsx` (SheetJS) package
- Auth: JWT tokens via bcryptjs
The frontend lives in /frontend and backend in /backend.
Please help me work on this project.
```

---

## PHASE 2 — Install & Run

### Prompt 2 — Install all dependencies
```
In my /backend folder, run: npm install
In my /frontend folder, run: npm install
Then start both dev servers. Backend port 4000, frontend port 5173.
```

**Manual steps (do these yourself):**
```bash
# Terminal 1 — Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Terminal 2 — Frontend  
cd frontend
npm install
npm run dev
```

---

## PHASE 3 — Tailwind CSS Fix (if colors look wrong)

### Prompt 3 — Fix Tailwind config
```
My Tailwind CSS is not applying colors. The styles.css uses CSS custom properties
like hsl(var(--primary)). The tailwind.config.js maps these color names.
Please check that the tailwind.config.js extends colors with hsl(var(--primary) / <alpha-value>)
format, and that postcss.config.js has tailwindcss and autoprefixer plugins.
Also make sure index.html does NOT import tw-animate-css.
```

**If colors still don't show**, ask Copilot:
```
My bg-primary class is not applying background color. The CSS variable --primary is
defined as `214 20% 91%` in :root. How do I make Tailwind v3 use this variable?
```

---

## PHASE 4 — Excel Database

### Prompt 4 — Understand the Excel DB structure
```
My backend uses an Excel file at /backend/data/billcraft.xlsx as the database.
It has 3 sheets:
1. "Users" — vendor accounts with columns: uniqueId, name, age, email, mobile, 
   shopName, gstNo, address, city, district, state, passwordHash, createdAt
2. "Products" — inventory with columns: id, userId, name, price, quantity, unit, hsn, createdAt, updatedAt
3. "Bills" — invoices with columns: id, userId, billNo, date, itemsJson, subTotal,
   cgstPercent, sgstPercent, cgstAmount, sgstAmount, grandTotal, customerName,
   customerPhone, customerAddress, createdAt
   (bill line items are stored as a JSON string in the "itemsJson" column)
The db.ts file handles all read/write using the xlsx npm package.
```

### Prompt 5 — If you get an Excel write error
```
I get an error writing to billcraft.xlsx. The error is: [paste error here]
The db.ts file uses XLSX.readFile and XLSX.writeFile from the xlsx package.
The data folder should be at /backend/data/. Please fix the error.
```

---

## PHASE 5 — Adding Features

### Prompt 6 — Add a new API route
```
In my BillCraft backend, add a new Express route in /backend/src/routes/.
The route should follow the same pattern as products.ts:
- Use requireAuth middleware from middleware/auth.ts
- Use readDB() and writeDB() from db.ts  
- Return { success: true, data: ... } on success
- Return { success: false, error: '...' } on failure
The new route is: [describe what you want]
```

### Prompt 7 — Add a frontend page
```
In my BillCraft frontend, add a new page using TanStack Router file-based routing.
Create the file at /frontend/src/routes/[pagename].tsx
Use the useStore() hook from @/lib/store for data.
Use the api services from @/api/services.ts for API calls.
Style with Tailwind CSS using the existing color variables (bg-primary, text-foreground etc).
The page should: [describe what you want]
```

### Prompt 8 — Fix a TypeScript error
```
I have a TypeScript error in my BillCraft project:
File: [filename]
Error: [paste error]
The shared types are in /frontend/src/lib/types.ts (frontend) 
and /backend/src/types/index.ts (backend).
Please fix the type error.
```

---

## PHASE 6 — Excel Export

### Prompt 9 — Customize the Excel export
```
In /backend/src/db.ts, the exportBillsToExcel() function creates a Bills Export sheet.
Currently it has these columns: Bill No, Date, Customer Name, Customer Phone,
Customer Address, Product Name, HSN Code, Quantity, Unit, Rate, Amount,
Sub Total, CGST %, CGST Amount, SGST %, SGST Amount, Grand Total, Shop Name, GST No.
Please modify it to also add: [any new columns you want]
```

### Prompt 10 — Add date range filter to export
```
In my BillCraft app, modify the GET /api/bills/export endpoint in bills.ts
to accept optional query parameters: ?from=YYYY-MM-DD&to=YYYY-MM-DD
Filter the bills to only include those in that date range before calling exportBillsToExcel().
Also add a date picker UI in the frontend dashboard to select the date range before exporting.
```

---

## PHASE 7 — PDF Invoices

### Prompt 11 — Understand invoice generation
```
In my BillCraft frontend, PDF invoices are generated client-side using jsPDF + jspdf-autotable.
The function is generateInvoicePDF(bill, user) in /frontend/src/lib/invoice.ts.
It takes a Bill object and User object (both typed in /frontend/src/lib/types.ts)
and downloads a PDF directly in the browser.
The PDF includes: shop header, GSTIN, bill number, date, customer details,
items table (SL.NO, DESCRIPTION, HSN, QTY, RATE, AMOUNT),
subtotal/CGST/SGST/grand total, amount in words, and signature line.
```

### Prompt 12 — Customize the PDF
```
In /frontend/src/lib/invoice.ts, please modify generateInvoicePDF() to:
[describe your customization — e.g., add a logo, change colors, add terms & conditions]
The doc is a jsPDF instance. Current page size is A4 portrait with 10mm margins.
```

---

## PHASE 8 — Common Fixes

### Fix: "Cannot find module" error
```
My frontend gives "Cannot find module '@/lib/store'" or similar path errors.
The tsconfig.app.json has baseUrl="." and paths={"@/*": ["./src/*"]}.
The vite.config.ts has resolve.alias {"@": path.resolve(__dirname, "./src")}.
Please check if these are correctly set up.
```

### Fix: CORS error in browser
```
My frontend at localhost:5173 gets a CORS error calling localhost:4000.
In /backend/src/index.ts, the CORS config should allow origin: "http://localhost:5173".
Also make sure vite.config.ts has server.proxy: { "/api": "http://localhost:4000" }.
Please fix the CORS issue.
```

### Fix: JWT token not being sent
```
My API calls return 401 Unauthorized. In /frontend/src/api/client.ts,
the axios interceptor should attach the token from localStorage key "billcraft_token"
as "Authorization: Bearer <token>" header on every request.
Please verify the interceptor is correctly configured.
```

### Fix: TanStack Router route not found
```
My TanStack Router shows a 404 for a route I added.
The routeTree.gen.ts is auto-generated — I should NOT edit it manually.
Instead, the router plugin generates it from files in /frontend/src/routes/.
Each route file must export: export const Route = createFileRoute('/path')({ component: MyComponent })
Please check my route file is correctly structured.
```

---

## Quick Reference

| What | Where |
|------|-------|
| API base URL | `http://localhost:4000/api` |
| Frontend URL | `http://localhost:5173` |
| Excel DB file | `backend/data/billcraft.xlsx` |
| JWT token storage | `localStorage["billcraft_token"]` |
| User storage | `localStorage["billcraft_user"]` |
| Auth routes | `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/profile` |
| Product routes | `/api/products` (GET, POST, PUT/:id, DELETE/:id) |
| Bill routes | `/api/bills` (GET, POST), `/api/bills/stats`, `/api/bills/export`, `/api/bills/:id` |

