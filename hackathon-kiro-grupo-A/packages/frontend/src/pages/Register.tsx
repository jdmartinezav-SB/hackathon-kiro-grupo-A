import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { SbInput, SbSelect, SbButton } from '../components/ui';

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

  const { control, handleSubmit } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      businessProfile: '',
      contactName: '',
    },
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
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <SbInput
              type="email"
              label="Correo electrónico"
              placeholder="tu@empresa.com"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              autoComplete="email"
              id="reg-email"
              name="email"
            />
          )}
        />

        {/* Password */}
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <SbInput
              type="password"
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              autoComplete="new-password"
              id="reg-password"
              name="password"
            />
          )}
        />

        {/* Confirm Password */}
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <SbInput
              type="password"
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              autoComplete="new-password"
              id="reg-confirm"
              name="confirmPassword"
            />
          )}
        />

        {/* Company Name */}
        <Controller
          name="companyName"
          control={control}
          render={({ field, fieldState }) => (
            <SbInput
              type="text"
              label="Nombre de la empresa"
              placeholder="Mi Empresa S.A."
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              id="reg-company"
              name="companyName"
            />
          )}
        />

        {/* Business Profile */}
        <Controller
          name="businessProfile"
          control={control}
          render={({ field, fieldState }) => (
            <SbSelect
              label="Perfil de negocio"
              placeholder="Selecciona un perfil"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              name="businessProfile"
            >
              <option value="">Selecciona un perfil</option>
              {BUSINESS_PROFILES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </SbSelect>
          )}
        />

        {/* Contact Name */}
        <Controller
          name="contactName"
          control={control}
          render={({ field, fieldState }) => (
            <SbInput
              type="text"
              label="Nombre de contacto"
              placeholder="Juan Pérez"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              id="reg-contact"
              name="contactName"
            />
          )}
        />

        {/* Submit */}
        <SbButton
          variant="primary"
          styleType="fill"
          type="submit"
          loading={loading}
          className="w-full"
        >
          {loading ? 'Registrando…' : 'Crear cuenta'}
        </SbButton>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-medium text-[var(--sb-ui-color-primary-base)] hover:text-[var(--sb-ui-color-primary-D100)]"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
