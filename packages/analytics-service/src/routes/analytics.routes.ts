import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';
import pool from '../config/database.js';

const router = Router();

interface TimeSeriesPoint {
  date: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
}

interface DashboardResponse {
  totalRequests: number;
  successRate: number;
  errorRate: number;
  avgLatencyMs: number;
  timeSeries: TimeSeriesPoint[];
}

// GET /v1/analytics/dashboard/:appId — Authenticated
router.get(
  '/v1/analytics/dashboard/:appId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { appId } = req.params;

      if (!appId) {
        throw new AppError(400, 'VALIDATION_ERROR', 'appId is required');
      }

      const queryParams = req.query as Record<string, string | undefined>;
      const from = queryParams.from;
      const to = queryParams.to;
      const apiId = queryParams.apiId;

      // Build WHERE conditions
      const conditions: string[] = ['application_id = $1'];
      const values: unknown[] = [appId];
      let idx = 2;

      if (from) {
        conditions.push('metric_date >= $' + idx);
        values.push(from);
        idx++;
      }

      if (to) {
        conditions.push('metric_date <= $' + idx);
        values.push(to);
        idx++;
      }

      if (apiId) {
        conditions.push('api_version_id = $' + idx);
        values.push(apiId);
        idx++;
      }

      const whereClause = 'WHERE ' + conditions.join(' AND ');

      // Aggregate query
      const aggregateSql =
        'SELECT ' +
        'COALESCE(SUM(total_requests), 0)::int AS total_requests, ' +
        'COALESCE(SUM(success_count), 0)::int AS success_count, ' +
        'COALESCE(SUM(error_count), 0)::int AS error_count, ' +
        'COALESCE(SUM(avg_latency_ms * total_requests), 0) AS weighted_latency_sum ' +
        'FROM usage_metric ' + whereClause;

      const aggregateResult = await pool.query(aggregateSql, values);
      const agg = aggregateResult.rows[0];

      const totalRequests: number = agg.total_requests;
      const successCount: number = agg.success_count;
      const errorCount: number = agg.error_count;
      const weightedLatencySum: number = parseFloat(agg.weighted_latency_sum);

      // Time series query
      const timeSeriesSql =
        'SELECT ' +
        'metric_date, ' +
        'SUM(total_requests)::int AS total_requests, ' +
        'SUM(success_count)::int AS success_count, ' +
        'SUM(error_count)::int AS error_count, ' +
        'CASE WHEN SUM(total_requests) > 0 ' +
        'THEN SUM(avg_latency_ms * total_requests) / SUM(total_requests) ' +
        'ELSE 0 END AS avg_latency_ms ' +
        'FROM usage_metric ' + whereClause +
        ' GROUP BY metric_date ORDER BY metric_date ASC';

      const timeSeriesResult = await pool.query(timeSeriesSql, values);

      const timeSeries: TimeSeriesPoint[] = timeSeriesResult.rows.map((row) => ({
        date: new Date(row.metric_date).toISOString().slice(0, 10),
        totalRequests: row.total_requests,
        successCount: row.success_count,
        errorCount: row.error_count,
        avgLatencyMs: parseFloat(parseFloat(row.avg_latency_ms).toFixed(2)),
      }));

      // Compute rates
      const successRate = totalRequests > 0
        ? parseFloat(((successCount / totalRequests) * 100).toFixed(2))
        : 0;
      const errorRate = totalRequests > 0
        ? parseFloat(((errorCount / totalRequests) * 100).toFixed(2))
        : 0;
      const avgLatencyMs = totalRequests > 0
        ? parseFloat((weightedLatencySum / totalRequests).toFixed(2))
        : 0;

      const response: DashboardResponse = {
        totalRequests,
        successRate,
        errorRate,
        avgLatencyMs,
        timeSeries,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// GET /v1/analytics/quota/:appId — Authenticated
interface QuotaResponse {
  appId: string;
  quotaUsed: number;
  quotaLimit: number;
  quotaUsedPercent: number;
  quotaPeriod: string;
}

const DEFAULT_QUOTA_LIMIT = 10000;
const DEFAULT_QUOTA_PERIOD = 'monthly';

async function getSubscriptionPlan(
  appId: string
): Promise<{ quotaLimit: number; quotaPeriod: string } | null> {
  try {
    const planSql =
      'SELECT sp.quota_limit, sp.quota_period ' +
      'FROM application a ' +
      'JOIN consumer c ON a.consumer_id = c.id ' +
      'JOIN subscription_plan sp ON c.subscription_plan_id = sp.id ' +
      'WHERE a.id = $1';
    const result = await pool.query(planSql, [appId]);
    if (result.rows.length > 0) {
      return {
        quotaLimit: parseInt(result.rows[0].quota_limit, 10),
        quotaPeriod: result.rows[0].quota_period,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function buildPeriodCondition(quotaPeriod: string): string {
  switch (quotaPeriod) {
    case 'daily':
      return 'metric_date = CURRENT_DATE';
    case 'yearly':
      return "metric_date >= date_trunc('year', CURRENT_DATE)";
    case 'monthly':
    default:
      return "metric_date >= date_trunc('month', CURRENT_DATE)";
  }
}

router.get(
  '/v1/analytics/quota/:appId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appId = req.params.appId as string;

      if (!appId) {
        throw new AppError(400, 'VALIDATION_ERROR', 'appId is required');
      }

      // Verify the application exists
      const appCheckSql = 'SELECT id FROM application WHERE id = $1';
      let appExists = false;
      try {
        const appResult = await pool.query(appCheckSql, [appId]);
        appExists = appResult.rows.length > 0;
      } catch {
        appExists = false;
      }

      if (!appExists) {
        throw new AppError(404, 'NOT_FOUND', 'Application not found');
      }

      // Try to get plan from subscription_plan via consumer join
      const plan = await getSubscriptionPlan(appId);
      const quotaLimit = plan?.quotaLimit ?? DEFAULT_QUOTA_LIMIT;
      const quotaPeriod = plan?.quotaPeriod ?? DEFAULT_QUOTA_PERIOD;

      // Sum quota_used for the current period
      const periodCondition = buildPeriodCondition(quotaPeriod);
      const usageSql =
        'SELECT COALESCE(SUM(quota_used), 0)::int AS total_quota_used ' +
        'FROM usage_metric ' +
        'WHERE application_id = $1 AND ' + periodCondition;

      const usageResult = await pool.query(usageSql, [appId]);
      const quotaUsed: number = usageResult.rows[0].total_quota_used;

      const quotaUsedPercent = quotaLimit > 0
        ? parseFloat(((quotaUsed / quotaLimit) * 100).toFixed(2))
        : 0;

      const response: QuotaResponse = {
        appId,
        quotaUsed,
        quotaLimit,
        quotaUsedPercent,
        quotaPeriod,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
