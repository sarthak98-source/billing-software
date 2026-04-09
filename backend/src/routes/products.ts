/**
 * routes/products.ts — Product / Inventory CRUD
 *
 * All routes require JWT auth. Products are scoped per user.
 *
 * GET    /api/products          — list all products for this user
 * POST   /api/products          — add a new product
 * PUT    /api/products/:id      — update a product
 * DELETE /api/products/:id      — delete a product
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readDB, writeDB } from '../db';
import { requireAuth } from '../middleware/auth';
import type { Product } from '../types/index';

const router = Router();

// All product routes require authentication
router.use(requireAuth);

/**
 * GET /api/products
 * Returns all products belonging to the authenticated user
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const db = readDB();
    const products = db.products.filter(p => p.userId === req.user!.uniqueId);
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch products.' });
  }
});

/**
 * POST /api/products
 * Body: { name, price, quantity, unit, hsn }
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, price, quantity, unit, hsn } = req.body;

    if (!name || price === undefined || quantity === undefined) {
      res.status(400).json({ success: false, error: 'name, price, and quantity are required.' });
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedQty   = parseInt(quantity);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ success: false, error: 'Price must be a valid non-negative number.' });
      return;
    }
    if (isNaN(parsedQty) || parsedQty < 0) {
      res.status(400).json({ success: false, error: 'Quantity must be a valid non-negative number.' });
      return;
    }

    const db = readDB();
    const now = new Date().toISOString();

    const newProduct: Product = {
      id:        uuidv4(),
      userId:    req.user!.uniqueId,
      name:      name.trim(),
      price:     parsedPrice,
      quantity:  parsedQty,
      unit:      unit || 'pcs',
      hsn:       hsn || '',
      createdAt: now,
      updatedAt: now,
    };

    db.products.push(newProduct);
    writeDB(db);

    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error('Add product error:', err);
    res.status(500).json({ success: false, error: 'Failed to add product.' });
  }
});

/**
 * PUT /api/products/:id
 * Body: partial { name, price, quantity, unit, hsn }
 */
router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const db = readDB();

    const idx = db.products.findIndex(
      p => p.id === id && p.userId === req.user!.uniqueId
    );

    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Product not found.' });
      return;
    }

    const { id: _id, userId: _uid, createdAt: _ca, ...allowed } = req.body;

    // Parse numeric fields if present
    if (allowed.price !== undefined) allowed.price = parseFloat(allowed.price);
    if (allowed.quantity !== undefined) allowed.quantity = parseInt(allowed.quantity);

    db.products[idx] = {
      ...db.products[idx],
      ...allowed,
      updatedAt: new Date().toISOString(),
    };

    writeDB(db);
    res.json({ success: true, product: db.products[idx] });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, error: 'Failed to update product.' });
  }
});

/**
 * DELETE /api/products/:id
 */
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const db = readDB();

    const idx = db.products.findIndex(
      p => p.id === id && p.userId === req.user!.uniqueId
    );

    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Product not found.' });
      return;
    }

    db.products.splice(idx, 1);
    writeDB(db);

    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete product.' });
  }
});

export default router;
