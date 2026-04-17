import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import pool from '../config/database';

const router = Router();

const VALID_EVENT_TYPES = [
  'new_version',
  'maintenance',
  'sunset',
  'quota_warning',
  'quota_exhausted',
  'general',
];

// GET /v1/notifications — Authenticated consumer
router.get(
  '/v1/notifications',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const readParam = req.query.read as string | undefined;
      const pageParam = req.query.page as string | undefined;
      const pageSizeParam = req.query.pageSize as string | undefined;

      const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1);
      const pageSize = Math.min(Math.max(parseInt(pageSizeParam || '20', 10) || 20, 1), 50);
      const offset = (page - 1) * pageSize;

      const conditions: string[] = ['consumer_id = $1'];
      const values: unknown[] = [userId];
      let idx = 2;

      if (readParam === 'true' || readParam === 'false') {
        conditions.push('read = $' + idx);
        values.push(readParam === 'true');
        idx++;
      }

      const whereClause = 'WHERE ' + conditions.join(' AND ');

      const countSql = 'SELECT COUNT(*)::int AS total FROM notification ' + whereClause;
      const countResult = await pool.query(countSql, values);
      const total: number = countResult.rows[0].total;

      const selectSql =
        'SELECT * FROM notification ' +
        whereClause +
        ' ORDER BY created_at DESC' +
        ' LIMIT $' + idx + ' OFFSET $' + (idx + 1);

      const selectResult = await pool.query(selectSql, [...values, pageSize, offset]);

      res.status(200).json({
        notifications: selectResult.rows,
        total,
        page,
        pageSize,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /v1/notifications/:id/read — Mark as read
router.put(
  '/v1/notifications/:id/read',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const notificationId = req.params.id;

      const updateSql =
        'UPDATE notification SET read = true, read_at = NOW() ' +
        'WHERE id = $1 AND consumer_id = $2 RETURNING *';

      const result = await pool.query(updateSql, [notificationId, userId]);

      if (result.rows.length === 0) {
        throw new AppError(404, 'NOT_FOUND', 'Notification not found');
      }

      res.status(200).json({ data: result.rows[0], statusCode: 200 });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /v1/notifications/preferences — Update preferences
router.put(
  '/v1/notifications/preferences',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { preferences } = req.body as {
        preferences?: Array<{
          eventType: string;
          emailEnabled: boolean;
          portalEnabled: boolean;
        }>;
      };

      if (!Array.isArray(preferences) || preferences.length === 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'preferences must be a non-empty array');
      }

      for (const pref of preferences) {
        if (!VALID_EVENT_TYPES.includes(pref.eventType)) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Invalid eventType: ' + pref.eventType + '. Valid: ' + VALID_EVENT_TYPES.join(', ')
          );
        }
        if (typeof pref.emailEnabled !== 'boolean' || typeof pref.portalEnabled !== 'boolean') {
          throw new AppError(400, 'VALIDATION_ERROR', 'emailEnabled and portalEnabled must be booleans');
        }
      }

      const upsertSql =
        'INSERT INTO notification_preference (consumer_id, event_type, email_enabled, portal_enabled) ' +
        'VALUES ($1, $2::notification_type, $3, $4) ' +
        'ON CONFLICT (consumer_id, event_type) ' +
        'DO UPDATE SET email_enabled = $3, portal_enabled = $4 ' +
        'RETURNING *';

      const results = [];
      for (const pref of preferences) {
        const result = await pool.query(upsertSql, [
          userId,
          pref.eventType,
          pref.emailEnabled,
          pref.portalEnabled,
        ]);
        results.push(result.rows[0]);
      }

      res.status(200).json({ data: results, statusCode: 200 });
    } catch (error) {
      next(error);
    }
  }
);

// POST /v1/internal/notifications/send — Internal (no auth)
router.post(
  '/v1/internal/notifications/send',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { consumerId, type, title, message, channel, priority, metadata } = req.body as {
        consumerId?: string;
        type?: string;
        title?: string;
        message?: string;
        channel?: string;
        priority?: string;
        metadata?: Record<string, unknown>;
      };

      const errors: string[] = [];
      if (!consumerId) errors.push('consumerId is required');
      if (!type) errors.push('type is required');
      if (!title) errors.push('title is required');
      if (!message) errors.push('message is required');

      if (type && !VALID_EVENT_TYPES.includes(type)) {
        errors.push('Invalid type: ' + type + '. Valid: ' + VALID_EVENT_TYPES.join(', '));
      }

      if (errors.length > 0) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', errors);
      }

      const insertSql =
        'INSERT INTO notification (consumer_id, type, title, message, channel, priority, metadata) ' +
        'VALUES ($1, $2::notification_type, $3, $4, $5::notification_channel, $6::notification_priority, $7) ' +
        'RETURNING *';

      const result = await pool.query(insertSql, [
        consumerId,
        type,
        title,
        message,
        channel || 'portal',
        priority || 'medium',
        metadata ? JSON.stringify(metadata) : '{}',
      ]);

      res.status(201).json({ data: result.rows[0], statusCode: 201 });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
