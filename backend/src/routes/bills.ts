/**
 * routes/bills.ts — Bills CRUD + Excel export
 *
 * All routes require JWT auth. Bills are scoped per user.
 *
 * GET  /api/bills             — list all bills (optional ?date=YYYY-MM-DD filter)
 * POST /api/bills             — save a new bill
 * GET  /api/bills/stats       — today's sales & bill count
 * GET  /api/bills/export      — download all bills as Excel (.xlsx)
 * GET  /api/bills/:id         — get a single bill
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readDB, writeDB } from '../db';
import { requireAuth } from '../middleware/auth';
import type { Bill, BillItem } from '../types/index';

const router = Router();
router.use(requireAuth);

// ── Helper: count bills for a user ──
function userBills(userId: string): Bill[] {
  const db = readDB();
  return db.bills.filter(b => b.userId === userId);
}

/**
 * GET /api/bills
 * Optional query: ?date=2024-01-15  (filter by date, YYYY-MM-DD)
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.uniqueId;
    let bills = userBills(userId);

    if (req.query.date) {
      const filterDate = req.query.date as string;
      bills = bills.filter(b => b.date.startsWith(filterDate));
    }

    // Sort newest first
    bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, bills });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bills.' });
  }
});

/**
 * GET /api/bills/stats
 * Returns today's bill count and total sales amount
 */
router.get('/stats', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.uniqueId;
    const all    = userBills(userId);
    const today  = new Date().toDateString();

    const todaysBills = all.filter(b => new Date(b.date).toDateString() === today);
    const todaysSales = todaysBills.reduce((sum, b) => sum + b.grandTotal, 0);

    res.json({
      success: true,
      stats: {
        totalProducts: readDB().products.filter(p => p.userId === userId).length,
        totalBills:    all.length,
        todaysBills:   todaysBills.length,
        todaysSales,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats.' });
  }
});

/**
 * GET /api/bills/export
 * Downloads all bills as an Excel file.
 *
 * NOTE: Requires `xlsx` package — install with: npm install xlsx
 * Until xlsx is installed, this returns a JSON response instead.
 */
router.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    // Dynamically import xlsx so the server still boots without it
    let XLSX: typeof import('xlsx') | null = null;
    try {
      XLSX = await import('xlsx');
    } catch {
      // xlsx not installed yet — inform user
      res.status(501).json({
        success: false,
        error: 'Excel export requires the xlsx package. Run: npm install xlsx',
        hint: 'After installing, this endpoint will download an .xlsx file automatically.',
      });
      return;
    }

    const userId = req.user!.uniqueId;
    const bills  = userBills(userId);
    const db     = readDB();
    const user   = db.users.find(u => u.uniqueId === userId);

    // ── Build rows: one row per bill item ──
    const rows: Record<string, string | number>[] = [];

    for (const bill of bills) {
      for (const item of bill.items) {
        rows.push({
          'Bill No':         bill.billNo,
          'Date':            new Date(bill.date).toLocaleDateString('en-IN'),
          'Customer Name':   bill.customerName  || '-',
          'Customer Phone':  bill.customerPhone || '-',
          'Customer Address':bill.customerAddress || '-',
          'Product Name':    item.name,
          'HSN Code':        item.hsn || '-',
          'Quantity':        item.quantity,
          'Unit':            item.unit,
          'Rate (Rs.)':      item.rate,
          'Amount (Rs.)':    item.amount,
          'Sub Total (Rs.)': bill.subTotal,
          'CGST %':          bill.cgstPercent,
          'CGST Amount':     bill.cgstAmount,
          'SGST %':          bill.sgstPercent,
          'SGST Amount':     bill.sgstAmount,
          'Grand Total (Rs.)': bill.grandTotal,
          'Shop Name':       user?.shopName || '-',
          'GST No':          user?.gstNo    || '-',
        });
      }
    }

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'No bills found to export.' });
      return;
    }

    const workbook  = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto column widths
    const colWidths = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2,
    }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `BillCraft_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate Excel export.' });
  }
});

/**
 * GET /api/bills/:id
 */
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db   = readDB();
    const bill = db.bills.find(
      b => b.id === req.params.id && b.userId === req.user!.uniqueId
    );
    if (!bill) {
      res.status(404).json({ success: false, error: 'Bill not found.' });
      return;
    }
    res.json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bill.' });
  }
});

/**
 * POST /api/bills
 * Body: { customerName, customerPhone, customerAddress, cgstPercent, sgstPercent, items: BillItem[] }
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      customerName, customerPhone, customerAddress,
      cgstPercent, sgstPercent, items,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'Bill must contain at least one item.' });
      return;
    }

    const userId = req.user!.uniqueId;
    const db     = readDB();

    // Compute sequential bill number for this user
    const userBillCount = db.bills.filter(b => b.userId === userId).length;

    const subTotal   = (items as BillItem[]).reduce((sum, item) => sum + item.amount, 0);
    const cgstAmt    = subTotal * (parseFloat(cgstPercent) || 0) / 100;
    const sgstAmt    = subTotal * (parseFloat(sgstPercent) || 0) / 100;
    const grandTotal = subTotal + cgstAmt + sgstAmt;
    const now        = new Date().toISOString();

    const newBill: Bill = {
      id:              uuidv4(),
      userId,
      billNo:          userBillCount + 1,
      date:            now,
      items:           items as BillItem[],
      subTotal,
      cgstPercent:     parseFloat(cgstPercent) || 0,
      sgstPercent:     parseFloat(sgstPercent) || 0,
      cgstAmount:      cgstAmt,
      sgstAmount:      sgstAmt,
      grandTotal,
      customerName:    customerName    || '',
      customerPhone:   customerPhone   || '',
      customerAddress: customerAddress || '',
      createdAt:       now,
    };

    db.bills.push(newBill);
    writeDB(db);

    res.status(201).json({ success: true, bill: newBill });
  } catch (err) {
    console.error('Save bill error:', err);
    res.status(500).json({ success: false, error: 'Failed to save bill.' });
  }
});

export default router;
