import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool from '../config/database';
import { AppError } from '../middleware/error-handler';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'conecta2-dev-secret';
const BCRYPT_ROUNDS = 10;

// ── Validation schemas ──────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  businessProfile: z.enum(['insurtech', 'broker', 'enterprise', 'startup']),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ── POST /v1/auth/register ──────────────────────────────────────────

router.post(
  '/v1/auth/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.issues);
      }

      const { email, password, companyName, contactName, businessProfile, phone } = parsed.data;

      // Check duplicate email
      const existing = await pool.query('SELECT id FROM consumer WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        throw new AppError(409, 'CONFLICT', 'Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Insert consumer
      const result = await pool.query(
        `INSERT INTO consumer (email, password_hash, company_name, contact_name, business_profile, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [email, passwordHash, companyName, contactName, businessProfile, phone || null]
      );

      res.status(201).json({
        consumerId: result.rows[0].id,
        message: 'Registration successful',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /v1/auth/login ─────────────────────────────────────────────

router.post(
  '/v1/auth/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.issues);
      }

      const { email, password } = parsed.data;

      // Find consumer
      const result = await pool.query(
        `SELECT id, email, password_hash, company_name, contact_name, business_profile, status, role
         FROM consumer WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Consumer not found');
      }

      const consumer = result.rows[0];

      // Check status
      if (consumer.status !== 'active') {
        throw new AppError(403, 'ACCOUNT_SUSPENDED', 'Account is suspended or revoked');
      }

      // Verify password
      const valid = await bcrypt.compare(password, consumer.password_hash);
      if (!valid) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }

      // Generate JWT
      const payload = {
        consumerId: consumer.id,
        email: consumer.email,
        role: consumer.role,
        businessProfile: consumer.business_profile,
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

      // Update last activity
      await pool.query(
        'UPDATE consumer SET last_activity_at = NOW() WHERE id = $1',
        [consumer.id]
      );

      res.json({
        accessToken,
        consumer: {
          id: consumer.id,
          email: consumer.email,
          companyName: consumer.company_name,
          role: consumer.role,
          businessProfile: consumer.business_profile,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
