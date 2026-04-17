import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const BUSINESS_PROFILES = [
  { value: 'Salud', label: 'Salud' },
  { value: 'Autos', label: 'Autos' },
  { value: 'Vida', label: 'Vida' },
  { value: 'Hogar', label: 'Hogar' },
  { value: 'General', label: 'General' },
] as const;

const registerSchema = z
  .object({
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    companyName: z.string().min(1, 'El nombre de la empresa es requerido'),
    businessProfile: z.string().min(1, 'Selecciona un perfil de negocio'),
    contactName: z.string().min(1, 'El nombre de contacto es requerido'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        businessProfile: data.businessProfile,
        contactName: data.contactName,
      });
      toast.success('Registro exitoso. Revisa tu correo');
      navigate('/login');
    } catch {
      toast.error('Error al registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Crear cuenta
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="reg-email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Correo electrónico
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
              errors.email ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="tu@empresa.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="reg-password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Contraseña
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
              errors.password ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Mínimo 8 caracteres"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="reg-confirm"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Confirmar contraseña
          </label>
          <input
            id="reg-confirm"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
              errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Repite tu contraseña"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label
            htmlFor="reg-company"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Nombre de la empresa
          </label>
          <input
            id="reg-company"
            type="text"
            {...register('companyName')}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
              errors.companyName ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Mi Empresa S.A."
          />
          {errors.companyName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.companyName.message}
            </p>
          )}
        </div>

        {/* Business Profile */}
        <div>
          <label
            htmlFor="reg-profile"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Perfil de negocio
          </label>
          <select
            id="reg-profile"
            {...register('businessProfile')}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
              errors.businessProfile ? 'border-red-400' : 'border-gray-300'
            }`}
          >
            <option value="">Selecciona un perfil</option>
            {BUSINESS_PROFILES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {errors.businessProfile && (
            <p className="mt-1 text-xs text-red-500">
              {errors.businessProfile.message}
            </p>
          )}
        </div>

        {/* Contact Name */}
        <div>
          <label
            htmlFor="reg-contact"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Nombre de contacto
          </label>
          <input
            id="reg-contact"
            type="text"
            {...register('contactName')}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${
              errors.contactName ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Juan Pérez"
          />
          {errors.contactName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.contactName.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Registrando…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
