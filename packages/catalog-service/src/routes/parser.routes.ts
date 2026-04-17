import { Router, Request, Response } from 'express';
import { parse, format, validate } from '../parser';
import type { InternalApiDefinition } from '../parser';

const router = Router();

const VALID_FORMATS = ['yaml', 'json'] as const;
type Format = (typeof VALID_FORMATS)[number];

function isValidFormat(value: unknown): value is Format {
  return typeof value === 'string' && VALID_FORMATS.includes(value as Format);
}

/**
 * POST /v1/internal/parser/parse
 * Body: { content: string, format: 'yaml' | 'json' }
 */
router.post('/parse', (req: Request, res: Response): void => {
  const { content, format: fmt } = req.body;

  if (typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ success: false, errors: [{ line: 1, field: 'content', message: 'Field "content" is required and must be a non-empty string' }] });
    return;
  }

  if (!isValidFormat(fmt)) {
    res.status(400).json({ success: false, errors: [{ line: 1, field: 'format', message: 'Field "format" is required and must be "yaml" or "json"' }] });
    return;
  }

  const result = parse(content, fmt);

  if (result.success && result.model) {
    res.status(200).json({ success: true, model: result.model });
    return;
  }

  // Parse failed — also run validate() on the raw object if possible
  let errors = result.errors ?? [];
  try {
    const raw = fmt === 'yaml'
      ? (require('js-yaml').load(content) as Record<string, unknown>)
      : (JSON.parse(content) as Record<string, unknown>);

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const validationErrors = validate(raw);
      if (validationErrors.length > 0) {
        errors = [...errors, ...validationErrors];
      }
    }
  } catch {
    // Raw content is unparseable — stick with original errors
  }

  res.status(400).json({ success: false, errors });
});

/**
 * POST /v1/internal/parser/format
 * Body: { model: InternalApiDefinition, format: 'yaml' | 'json' }
 */
router.post('/format', (req: Request, res: Response): void => {
  const { model, format: fmt } = req.body;

  if (!model || typeof model !== 'object' || Array.isArray(model)) {
    res.status(400).json({ error: 'Field "model" is required and must be an object' });
    return;
  }

  if (!isValidFormat(fmt)) {
    res.status(400).json({ error: 'Field "format" is required and must be "yaml" or "json"' });
    return;
  }

  try {
    const content = format(model as InternalApiDefinition, fmt);
    res.status(200).json({ content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: `Failed to format model: ${message}` });
  }
});

export default router;
