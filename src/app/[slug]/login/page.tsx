import { FmaLogo } from '@/components/fma-logo';

export default async function LoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <FmaLogo className="h-20 w-20 mb-4" />
          <h1 className="text-2xl font-bold text-fma-white">FMA Mecatrónica</h1>
          <p className="text-sm text-fma-white-soft/60">Sistema de gestión</p>
        </div>
        <form className="card space-y-4" action="/api/auth/login" method="POST">
          <input type="hidden" name="slug" value={slug} />
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Usuario</label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white focus:outline-none focus:border-fma-cyan"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Ingresar
          </button>
        </form>
      </div>
    </main>
  );
}
