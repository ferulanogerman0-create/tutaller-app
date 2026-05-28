export default function Landing() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-fma-black px-6 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-fma-white mb-3">
            TuTaller<span className="text-fma-cyan">.app</span>
          </h1>
          <p className="text-fma-white-soft/70 text-lg">
            Gestión integral para talleres mecánicos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left mb-10 text-sm text-fma-white-soft/60">
          {[
            '✓ Órdenes y presupuestos',
            '✓ Clientes y vehículos',
            '✓ Caja e inventario',
            '✓ Recordatorios service',
            '✓ Bot WhatsApp (plan Bot)',
            '✓ Multi-usuario',
          ].map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>

        <div className="flex flex-col gap-3 items-center">
          <a href="/signup" className="btn-primary w-full max-w-xs text-center">
            Crear cuenta gratis
          </a>
          <p className="text-xs text-fma-white-soft/40">14 días de prueba · Sin tarjeta</p>
        </div>

        <p className="text-xs text-fma-white-soft/30 mt-12">
          ¿Ya tenés cuenta?{' '}
          <a href="/login" className="text-fma-cyan hover:underline">Ingresar</a>
        </p>
      </div>
    </main>
  );
}
