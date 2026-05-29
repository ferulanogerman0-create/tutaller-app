import { redirect } from 'next/navigation';
import { getTenantBySlug } from '@/lib/tenant';

export default async function LoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) redirect('/');

  return (
    <main className="page-light min-h-screen flex items-center justify-center px-4 overflow-hidden relative">
      {/* holographic light leaks */}
      <div className="holo holo-tr" />
      <div className="holo holo-bl" />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fma-cyan to-violet-600 flex items-center justify-center mb-4 shadow-lg">
            <span className="text-2xl font-black text-white">{tenant.nombre.charAt(0).toUpperCase()}</span>
          </div>
          <h1 className="text-xl font-bold text-[#0b0b0d]">{tenant.nombre}</h1>
          <p className="text-xs text-black/40 mt-1">tutaller.app/{slug}</p>
        </div>

        <form className="glass-light rounded-2xl p-6 space-y-4" action="/api/auth/login" method="POST">
          <input type="hidden" name="slug" value={slug} />
          <div>
            <label className="block text-sm mb-1 text-black/70 font-medium">Usuario</label>
            <input
              name="username" type="text" required autoComplete="username"
              className="w-full bg-white/70 border border-black/15 rounded-lg px-3 py-2 text-[#0b0b0d] focus:outline-none focus:border-fma-cyan focus:ring-2 focus:ring-fma-cyan/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-black/70 font-medium">Contraseña</label>
            <input
              name="password" type="password" required autoComplete="current-password"
              className="w-full bg-white/70 border border-black/15 rounded-lg px-3 py-2 text-[#0b0b0d] focus:outline-none focus:border-fma-cyan focus:ring-2 focus:ring-fma-cyan/20 transition-all"
            />
          </div>
          <button type="submit" className="btn-primary w-full rounded-lg py-2.5">Ingresar</button>
        </form>

        <p className="text-center text-xs text-black/40 mt-6">
          <a href="/login" className="hover:text-fma-cyan-dark transition-colors">← Otro taller</a>
        </p>
      </div>
    </main>
  );
}
