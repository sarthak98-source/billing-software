/**
 * routes/auth.ts — Authentication endpoints
 *
 * POST /api/auth/register  — create new vendor account
 * POST /api/auth/login     — login and get JWT
 * GET  /api/auth/me        — get current user profile (requires auth)
 * PUT  /api/auth/profile   — update profile (requires auth)
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { readDB, writeDB } from '../db';
import { signToken, requireAuth } from '../middleware/auth';
import type { User } from '../types/index';

const router = Router();

// ── Helper: generate unique vendor ID like VND-XXXXXX ──
function generateUniqueId(existingIds: string[]): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id: string;
  do {
    id = 'VND-';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingIds.includes(id));
  return id;
}

// ── Sanitize user for API response (remove password hash) ──
function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _pw, ...safe } = user;
  return safe;
}

/**
 * POST /api/auth/register
 * Body: { name, age, email, mobile, shopName, gstNo, address, city, district, state, password }
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, age, email, mobile, shopName,
      gstNo, address, city, district, state, password,
    } = req.body;

    // ── Validation ──
    if (!name || !email || !mobile || !shopName || !password) {
      res.status(400).json({ success: false, error: 'Please fill all required fields.' });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
      return;
    }

    const db = readDB();

    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      res.status(409).json({ success: false, error: 'Email already registered.' });
      return;
    }
    if (db.users.find(u => u.mobile === mobile)) {
      res.status(409).json({ success: false, error: 'Mobile number already registered.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const uniqueId = generateUniqueId(db.users.map(u => u.uniqueId));

    const newUser: User = {
      uniqueId,
      name,
      age: age || '',
      email: email.toLowerCase(),
      mobile,
      shopName,
      gstNo: gstNo || '',
      address: address || '',
      city: city || '',
      district: district || '',
      state: state || '',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDB(db);

    res.status(201).json({
      success: true,
      uniqueId,
      message: 'Registration successful. Save your Vendor ID to login.',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * Body: { uniqueId, password }
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { uniqueId, password } = req.body;

    if (!uniqueId || !password) {
      res.status(400).json({ success: false, error: 'Please fill in all fields.' });
      return;
    }

    const db = readDB();
    const user = db.users.find(u => u.uniqueId.toUpperCase() === uniqueId.toString().toUpperCase());

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid Unique ID. Please check and try again.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
      return;
    }

    const token = signToken({ uniqueId: user.uniqueId, email: user.email });

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error during login.' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
router.get('/me', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = readDB();
    const user = db.users.find(u => u.uniqueId === req.user!.uniqueId);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

/**
 * PUT /api/auth/profile
 * Body: partial user fields (except uniqueId, passwordHash)
 */
router.put('/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = readDB();
    const idx = db.users.findIndex(u => u.uniqueId === req.user!.uniqueId);

    if (idx === -1) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const { uniqueId: _uid, passwordHash: _pw, createdAt: _ca, ...allowed } = req.body;

    // If changing password
    if (allowed.password) {
      if (allowed.password.length < 6) {
        res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
        return;
      }
      db.users[idx].passwordHash = await bcrypt.hash(allowed.password, 10);
      delete allowed.password;
    }

    db.users[idx] = { ...db.users[idx], ...allowed };
    writeDB(db);

    res.json({ success: true, user: sanitizeUser(db.users[idx]) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

export default router;
