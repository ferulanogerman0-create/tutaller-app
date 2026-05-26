// Landing root TuTaller — TODO: build marketing page
export default function Landing() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold mb-4">TuTaller.app</h1>
        <p className="text-slate-600 mb-8">
          Gestión integral de taller mecánico. Órdenes, clientes, vehículos, inventario,
          caja, recordatorios y bot WhatsApp — todo en un solo lugar.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/signup" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">
            Probar gratis 14 días
          </a>
          <a href="/pricing" className="px-6 py-3 border rounded-lg font-medium">
            Ver precios
          </a>
        </div>
        <p className="text-xs text-slate-400 mt-12">Status: en desarrollo · Fase 2 · 2026-05-22</p>
      </div>
    </main>
  );
}
