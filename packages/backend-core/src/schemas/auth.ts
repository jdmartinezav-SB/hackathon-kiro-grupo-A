import { z } from 'zod';

const businessProfiles = ['salud', 'autos', 'vida', 'hogar', 'general'] as const;

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(128, 'La contraseña no puede exceder 128 caracteres'),
  companyName: z.string().min(1, 'Nombre de empresa requerido').max(255),
  businessProfile: z.enum(businessProfiles, {
    errorMap: () => ({
      message: `Perfil de negocio debe ser uno de: ${businessProfiles.join(', ')}`,
    }),
  }),
  contactName: z.string().min(1, 'Nombre de contacto requerido').max(255),
  phone: z.string().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const verifyEmailSchema = z.object({
  consumerId: z.string().uuid('ID de consumidor inválido'),
});

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  businessProfiles,
};
export type { RegisterInput, LoginInput, VerifyEmailInput };
