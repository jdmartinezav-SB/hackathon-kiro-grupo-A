import { z } from 'zod';

// ── POST /v1/consumers/:id/apps ────────────────────────────
const createAppSchema = z.object({
  name: z.string().min(1, 'Nombre de aplicación requerido').max(255),
  description: z.string().min(1, 'Descripción requerida').max(1000),
  redirectUrls: z
    .array(z.string().url('URL de redirección inválida'))
    .optional(),
});

// ── PUT /v1/admin/consumers/:id/status ─────────────────────
const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'revoked'], {
    errorMap: () => ({
      message: 'Status debe ser: active, suspended o revoked',
    }),
  }),
  reason: z.string().min(1, 'Motivo requerido').max(1000),
});

// ── GET /v1/admin/consumers query params ───────────────────
const consumerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(['pending', 'active', 'suspended', 'revoked'])
    .optional(),
  businessProfile: z
    .enum(['salud', 'autos', 'vida', 'hogar', 'general'])
    .optional(),
  search: z.string().max(255).optional(),
});

// ── Param validation ───────────────────────────────────────
const consumerIdParamSchema = z.object({
  id: z.string().uuid('ID de consumidor inválido'),
});

type CreateAppInput = z.infer<typeof createAppSchema>;
type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
type ConsumerListQuery = z.infer<typeof consumerListQuerySchema>;

export {
  createAppSchema,
  updateStatusSchema,
  consumerListQuerySchema,
  consumerIdParamSchema,
};
export type { CreateAppInput, UpdateStatusInput, ConsumerListQuery };
