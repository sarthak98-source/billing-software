/**
 * routes/bills.ts
 *
 * GET  /api/bills          — list bills (optional ?date=YYYY-MM-DD)
 * POST /api/bills          — save new bill
 * GET  /api/bills/stats    — today's sales & counts
 * GET  /api/bills/export   — download all bills as Excel (.xlsx)
 * GET  /api/bills/:id      — single bill
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readDB, writeDB, exportBillsToExcel } from '../db';
import { requireAuth } from '../middleware/auth';
import type { Bill, BillItem } from '../types/index';

const router = Router();
router.use(requireAuth);

function userBills(userId: string): Bill[] {
  return readDB().bills.filter(b => b.userId === userId);
}

/** GET /api/bills */
router.get('/', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.uniqueId;
    let bills = userBills(userId);
    if (req.query.date) {
      const d = req.query.date as string;
      bills = bills.filter(b => b.date.startsWith(d));
    }
    bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, bills });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch bills.' });
  }
});

/** GET /api/bills/stats */
router.get('/stats', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.uniqueId;
    const db     = readDB();
    const all    = db.bills.filter(b => b.userId === userId);
    const today  = new Date().toDateString();
    const todaysBills = all.filter(b => new Date(b.date).toDateString() === today);
    const todaysSales = todaysBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalProducts = db.products.filter(p => p.userId === userId).length;
    res.json({
      success: true,
      stats: { totalProducts, totalBills: all.length, todaysBills: todaysBills.length, todaysSales },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch stats.' });
  }
});

/** GET /api/bills/export — returns .xlsx file */
router.get('/export', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.uniqueId;
    const db     = readDB();
    const bills  = db.bills.filter(b => b.userId === userId);
    const user   = db.users.find(u => u.uniqueId === userId);

    const buffer   = exportBillsToExcel(bills, user?.shopName || '', user?.gstNo || '');
    const filename = `BillCraft_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate export.' });
  }
});

/** GET /api/bills/:id */
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db   = readDB();
    const bill = db.bills.find(b => b.id === req.params.id && b.userId === req.user!.uniqueId);
    if (!bill) { res.status(404).json({ success: false, error: 'Bill not found.' }); return; }
    res.json({ success: true, bill });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch bill.' });
  }
});

/** POST /api/bills */
router.post('/', (req: Request, res: Response): void => {
  try {
    const { customerName, customerPhone, customerAddress, cgstPercent, sgstPercent, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'Bill must contain at least one item.' });
      return;
    }
    const userId = req.user!.uniqueId;
    const db     = readDB();
    const count  = db.bills.filter(b => b.userId === userId).length;
    const sub    = (items as BillItem[]).reduce((s, i) => s + i.amount, 0);
    const cgst   = sub * (parseFloat(cgstPercent) || 0) / 100;
    const sgst   = sub * (parseFloat(sgstPercent) || 0) / 100;
    const now    = new Date().toISOString();
    const bill: Bill = {
      id: uuidv4(), userId, billNo: count + 1, date: now,
      items: items as BillItem[],
      subTotal: sub, cgstPercent: parseFloat(cgstPercent) || 0,
      sgstPercent: parseFloat(sgstPercent) || 0,
      cgstAmount: cgst, sgstAmount: sgst, grandTotal: sub + cgst + sgst,
      customerName: customerName || '', customerPhone: customerPhone || '',
      customerAddress: customerAddress || '', createdAt: now,
    };
    db.bills.push(bill);
    writeDB(db);
    res.status(201).json({ success: true, bill });
  } catch (err) {
    console.error('Save bill error:', err);
    res.status(500).json({ success: false, error: 'Failed to save bill.' });
  }
});

export default router;
