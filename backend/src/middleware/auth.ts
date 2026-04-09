/**
 * middleware/auth.ts — JWT authentication middleware
 * Accepts token via Authorization header OR ?auth= query param (for file downloads)
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/index';

export const JWT_SECRET = process.env.JWT_SECRET || 'billcraft_secret_change_in_production';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Accept token from header OR query string (for direct download links)
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.auth) {
    token = req.query.auth as string;
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'No token provided. Please login.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token. Please login again.' });
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
