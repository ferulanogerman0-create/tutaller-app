import { redirect } from 'next/navigation';
import { getTenantBySlug } from '@/lib/tenant';

export default async function LoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) redirect('/');

  const error = undefined; // client-side error handling via query param could be added later

  return (
    <main className="min-h-screen flex items-center justify-center bg-fma-black px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-fma-black-2 border-2 border-fma-cyan flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-fma-cyan">{tenant.nombre.charAt(0).toUpperCase()}</span>
          </div>
          <h1 className="text-xl font-bold text-fma-white">{tenant.nombre}</h1>
          <p className="text-xs text-fma-white-soft/40 mt-1">tutaller.app/{slug}</p>
        </div>

        <form className="card space-y-4" action="/api/auth/login" method="POST">
          <input type="hidden" name="slug" value={slug} />
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Usuario</label>
            <input
              name="username" type="text" required autoComplete="username"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Contraseña</label>
            <input
              name="password" type="password" required autoComplete="current-password"
              className="input-field w-full"
            />
          </div>
          <button type="submit" className="btn-primary w-full">Ingresar</button>
        </form>

        <p className="text-center text-xs text-fma-white-soft/30 mt-6">
          <a href="/login" className="hover:text-fma-cyan">← Otro taller</a>
        </p>
      </div>
    </main>
  );
}
