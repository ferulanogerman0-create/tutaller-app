'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 32);
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', slug: '', ownerNombre: '', username: '', password: '' });
  const [slugManual, setSlugManual] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slugManual && form.nombre) {
      setForm(f => ({ ...f, slug: slugify(form.nombre) }));
    }
  }, [form.nombre, slugManual]);

  useEffect(() => {
    if (!form.slug) { setSlugStatus('idle'); return; }
    const t = setTimeout(async () => {
      setSlugStatus('checking');
      const r = await fetch(`/api/signup/check-slug?slug=${encodeURIComponent(form.slug)}`);
      const d = await r.json();
      setSlugStatus(d.available ? 'available' : 'taken');
    }, 400);
    return () => clearTimeout(t);
  }, [form.slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const r = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error || 'Error al crear cuenta'); setLoading(false); return; }
    router.push(`/${form.slug}/dashboard`);
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (k === 'slug') setSlugManual(true);
    setForm(f => ({ ...f, [k]: e.target.value }));
  };

  const slugOk = slugStatus === 'available';
  const canSubmit = form.nombre && form.slug && slugOk && form.ownerNombre && form.username && form.password.length >= 6;

  return (
    <main className="min-h-screen flex items-center justify-center bg-fma-black px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fma-white mb-2">TuTaller<span className="text-fma-cyan">.app</span></h1>
          <p className="text-fma-white-soft/60 text-sm">14 días gratis · sin tarjeta de crédito</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-lg font-semibold text-fma-white">Crear cuenta</h2>

          {error && (
            <div className="bg-red-900/40 border border-red-500/40 text-red-300 text-sm rounded-md px-3 py-2">{error}</div>
          )}

          <div>
            <label className="block text-xs text-fma-white-soft/60 mb-1">Nombre del taller *</label>
            <input
              value={form.nombre} onChange={set('nombre')} required
              placeholder="Ej: Taller El Maestro"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-fma-white-soft/60 mb-1">URL de acceso *</label>
            <div className="flex items-center gap-2">
              <span className="text-fma-white-soft/40 text-sm whitespace-nowrap">tutaller.app/</span>
              <div className="relative flex-1">
                <input
                  value={form.slug} onChange={set('slug')} required
                  pattern="^[a-z0-9-]{3,32}$"
                  placeholder="mi-taller"
                  className={`input-field w-full pr-7 ${slugStatus === 'taken' ? 'border-red-500' : slugStatus === 'available' ? 'border-green-500' : ''}`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">
                  {slugStatus === 'checking' && <span className="text-fma-white-soft/40">…</span>}
                  {slugStatus === 'available' && <span className="text-green-400">✓</span>}
                  {slugStatus === 'taken' && <span className="text-red-400">✗</span>}
                </span>
              </div>
            </div>
            {slugStatus === 'taken' && <p className="text-xs text-red-400 mt-1">Ese nombre ya está en uso, elegí otro.</p>}
            <p className="text-xs text-fma-white-soft/40 mt-1">Solo letras minúsculas, números y guiones.</p>
          </div>

          <div className="border-t border-fma-gray pt-4">
            <p className="text-xs text-fma-white-soft/40 mb-3">Datos del administrador</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-fma-white-soft/60 mb-1">Tu nombre *</label>
                <input value={form.ownerNombre} onChange={set('ownerNombre')} required placeholder="Juan García" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-xs text-fma-white-soft/60 mb-1">Usuario *</label>
                <input value={form.username} onChange={set('username')} required placeholder="juan" autoComplete="username" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-xs text-fma-white-soft/60 mb-1">Contraseña * <span className="text-fma-white-soft/30">(mín. 6 caracteres)</span></label>
                <input value={form.password} onChange={set('password')} required type="password" minLength={6} autoComplete="new-password" className="input-field w-full" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={!canSubmit || loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Creando cuenta…' : 'Crear cuenta gratis'}
          </button>

          <p className="text-center text-xs text-fma-white-soft/40">
            ¿Ya tenés cuenta?{' '}
            <a href="/" className="text-fma-cyan hover:underline">Volver al inicio</a>
          </p>
        </form>
      </div>
    </main>
  );
}
