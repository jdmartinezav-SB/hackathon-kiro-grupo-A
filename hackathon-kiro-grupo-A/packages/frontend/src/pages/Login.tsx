import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { SbInput, SbButton } from '../components/ui';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Bienvenido');
      navigate('/catalog');
    } catch {
      toast.error('Credenciales inválidas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Iniciar sesión
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
              id="email"
              data-testid="login-email"
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
              placeholder="••••••••"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              autoComplete="current-password"
              id="password"
              data-testid="login-password"
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
          data-testid="login-submit"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </SbButton>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿No tienes cuenta?{' '}
        <Link
          to="/register"
          className="font-medium text-[var(--sb-ui-color-primary-base)] hover:text-[var(--sb-ui-color-primary-D100)]"
        >
          Regístrate
        </Link>
      </p>
    </div>
  );
}
