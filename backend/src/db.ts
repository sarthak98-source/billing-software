/**
 * db.ts — Excel-based database
 *
 * All data is stored in /data/billcraft.xlsx with 3 sheets:
 *   Sheet "Users"    — vendor accounts
 *   Sheet "Products" — inventory items  
 *   Sheet "Bills"    — saved invoices (bill items stored as JSON string in a column)
 *
 * Uses the `xlsx` (SheetJS) package.
 */

import fs   from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import type { DB, User, Product, Bill } from './types/index';

const DATA_DIR  = path.join(__dirname, '..', 'data');
const XLSX_FILE = path.join(DATA_DIR, 'billcraft.xlsx');

// ── Sheet names ──
const SHEET_USERS    = 'Users';
const SHEET_PRODUCTS = 'Products';
const SHEET_BILLS    = 'Bills';

/** Ensure data directory exists */
function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** Read full workbook — returns empty workbook if file missing */
function getWorkbook(): XLSX.WorkBook {
  ensureDir();
  if (!fs.existsSync(XLSX_FILE)) {
    const wb = XLSX.utils.book_new();
    // Create empty sheets with headers
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['uniqueId','name','age','email','mobile','shopName','gstNo','address','city','district','state','passwordHash','createdAt'],
    ]), SHEET_USERS);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['id','userId','name','price','quantity','unit','hsn','createdAt','updatedAt'],
    ]), SHEET_PRODUCTS);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['id','userId','billNo','date','itemsJson','subTotal','cgstPercent','sgstPercent','cgstAmount','sgstAmount','grandTotal','customerName','customerPhone','customerAddress','createdAt'],
    ]), SHEET_BILLS);
    XLSX.writeFile(wb, XLSX_FILE);
    return wb;
  }
  return XLSX.readFile(XLSX_FILE);
}

/** Save workbook back to disk */
function saveWorkbook(wb: XLSX.WorkBook): void {
  ensureDir();
  XLSX.writeFile(wb, XLSX_FILE);
}

/** Convert a worksheet to array of typed objects */
function sheetToObjects<T>(ws: XLSX.WorkSheet): T[] {
  if (!ws) return [];
  const rows = XLSX.utils.sheet_to_json<T>(ws, { defval: '' });
  return rows;
}

/** Replace entire sheet in workbook with new data */
function replaceSheet<T extends object>(wb: XLSX.WorkBook, sheetName: string, rows: T[], headers: string[]): void {
  if (wb.SheetNames.includes(sheetName)) {
    delete wb.Sheets[sheetName];
    wb.SheetNames.splice(wb.SheetNames.indexOf(sheetName), 1);
  }
  const ws = rows.length > 0
    ? XLSX.utils.json_to_sheet(rows, { header: headers })
    : XLSX.utils.aoa_to_sheet([headers]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

// ── Public API ──

export function readDB(): DB {
  const wb = getWorkbook();

  const rawUsers    = sheetToObjects<Record<string,string>>(wb.Sheets[SHEET_USERS]);
  const rawProducts = sheetToObjects<Record<string,string>>(wb.Sheets[SHEET_PRODUCTS]);
  const rawBills    = sheetToObjects<Record<string,string>>(wb.Sheets[SHEET_BILLS]);

  const users: User[] = rawUsers.map(r => ({
    uniqueId:     String(r.uniqueId     || ''),
    name:         String(r.name         || ''),
    age:          String(r.age          || ''),
    email:        String(r.email        || ''),
    mobile:       String(r.mobile       || ''),
    shopName:     String(r.shopName     || ''),
    gstNo:        String(r.gstNo        || ''),
    address:      String(r.address      || ''),
    city:         String(r.city         || ''),
    district:     String(r.district     || ''),
    state:        String(r.state        || ''),
    passwordHash: String(r.passwordHash || ''),
    createdAt:    String(r.createdAt    || ''),
  })).filter(u => u.uniqueId !== '');

  const products: Product[] = rawProducts.map(r => ({
    id:        String(r.id        || ''),
    userId:    String(r.userId    || ''),
    name:      String(r.name      || ''),
    price:     parseFloat(String(r.price    || '0')),
    quantity:  parseInt(String(r.quantity   || '0')),
    unit:      String(r.unit      || 'pcs'),
    hsn:       String(r.hsn       || ''),
    createdAt: String(r.createdAt || ''),
    updatedAt: String(r.updatedAt || ''),
  })).filter(p => p.id !== '');

  const bills: Bill[] = rawBills.map(r => {
    let items = [];
    try { items = JSON.parse(String(r.itemsJson || '[]')); } catch { items = []; }
    return {
      id:              String(r.id              || ''),
      userId:          String(r.userId          || ''),
      billNo:          parseInt(String(r.billNo  || '0')),
      date:            String(r.date            || ''),
      items,
      subTotal:        parseFloat(String(r.subTotal    || '0')),
      cgstPercent:     parseFloat(String(r.cgstPercent || '0')),
      sgstPercent:     parseFloat(String(r.sgstPercent || '0')),
      cgstAmount:      parseFloat(String(r.cgstAmount  || '0')),
      sgstAmount:      parseFloat(String(r.sgstAmount  || '0')),
      grandTotal:      parseFloat(String(r.grandTotal  || '0')),
      customerName:    String(r.customerName    || ''),
      customerPhone:   String(r.customerPhone   || ''),
      customerAddress: String(r.customerAddress || ''),
      createdAt:       String(r.createdAt       || ''),
    };
  }).filter(b => b.id !== '');

  return { users, products, bills };
}

export function writeDB(db: DB): void {
  const wb = getWorkbook();

  // ── Write Users ──
  const userHeaders = ['uniqueId','name','age','email','mobile','shopName','gstNo','address','city','district','state','passwordHash','createdAt'];
  replaceSheet(wb, SHEET_USERS, db.users, userHeaders);

  // ── Write Products ──
  const productHeaders = ['id','userId','name','price','quantity','unit','hsn','createdAt','updatedAt'];
  replaceSheet(wb, SHEET_PRODUCTS, db.products, productHeaders);

  // ── Write Bills (items serialised as JSON string in one column) ──
  const billRows = db.bills.map(b => ({
    id:              b.id,
    userId:          b.userId,
    billNo:          b.billNo,
    date:            b.date,
    itemsJson:       JSON.stringify(b.items),
    subTotal:        b.subTotal,
    cgstPercent:     b.cgstPercent,
    sgstPercent:     b.sgstPercent,
    cgstAmount:      b.cgstAmount,
    sgstAmount:      b.sgstAmount,
    grandTotal:      b.grandTotal,
    customerName:    b.customerName,
    customerPhone:   b.customerPhone,
    customerAddress: b.customerAddress,
    createdAt:       b.createdAt,
  }));
  const billHeaders = ['id','userId','billNo','date','itemsJson','subTotal','cgstPercent','sgstPercent','cgstAmount','sgstAmount','grandTotal','customerName','customerPhone','customerAddress','createdAt'];
  replaceSheet(wb, SHEET_BILLS, billRows, billHeaders);

  saveWorkbook(wb);
}

/**
 * exportBillsToExcel — generates a nicely formatted Excel report for one user's bills.
 * Returns a Buffer ready to send as HTTP response.
 */
export function exportBillsToExcel(bills: Bill[], shopName: string, gstNo: string): Buffer {
  const rows: Record<string, string | number>[] = [];

  for (const bill of bills) {
    for (const item of bill.items) {
      rows.push({
        'Bill No':            bill.billNo,
        'Date':               new Date(bill.date).toLocaleDateString('en-IN'),
        'Customer Name':      bill.customerName  || '-',
        'Customer Phone':     bill.customerPhone || '-',
        'Customer Address':   bill.customerAddress || '-',
        'Product Name':       item.name,
        'HSN Code':           item.hsn || '-',
        'Quantity':           item.quantity,
        'Unit':               item.unit,
        'Rate (Rs.)':         item.rate,
        'Amount (Rs.)':       item.amount,
        'Sub Total (Rs.)':    bill.subTotal,
        'CGST %':             bill.cgstPercent,
        'CGST Amount (Rs.)':  bill.cgstAmount,
        'SGST %':             bill.sgstPercent,
        'SGST Amount (Rs.)':  bill.sgstAmount,
        'Grand Total (Rs.)':  bill.grandTotal,
        'Shop Name':          shopName || '-',
        'GST No':             gstNo    || '-',
      });
    }
  }

  const wb = XLSX.utils.book_new();

  if (rows.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['No bills found']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Bills');
  } else {
    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto column widths
    const colWidths = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2,
    }));
    ws['!cols'] = colWidths;
    // Bold header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cellAddr]) {
        ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'E8EEF7' } } };
      }
    }
    XLSX.utils.book_append_sheet(wb, ws, 'Bills Export');
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
