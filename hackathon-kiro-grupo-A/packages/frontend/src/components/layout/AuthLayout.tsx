import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600">
            <span className="text-xl font-bold text-white">C2</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Conecta 2.0</h1>
          <p className="mt-1 text-sm text-gray-500">
            Portal de APIs para aliados
          </p>
        </div>

        {/* Card container */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
