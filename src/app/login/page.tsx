'use client';
import { useState } from 'react';

export default function RootLoginPage() {
  const [slug, setSlug] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const s = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (s) window.location.href = `/${s}/login`;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-fma-black px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fma-white mb-1">
            TuTaller<span className="text-fma-cyan">.app</span>
          </h1>
          <p className="text-fma-white-soft/50 text-sm">Ingresá a tu taller</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-xs text-fma-white-soft/60 mb-1">Nombre de tu taller (slug)</label>
            <div className="flex items-center gap-1">
              <span className="text-fma-white-soft/30 text-sm">tutaller.app/</span>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                required
                placeholder="mi-taller"
                className="input-field flex-1"
                autoFocus
              />
            </div>
          </div>
          <button type="submit" disabled={!slug.trim()} className="btn-primary w-full disabled:opacity-50">
            Continuar
          </button>
          <p className="text-center text-xs text-fma-white-soft/40">
            ¿No tenés cuenta?{' '}
            <a href="/signup" className="text-fma-cyan hover:underline">Crear cuenta gratis</a>
          </p>
        </form>
      </div>
    </main>
  );
}
