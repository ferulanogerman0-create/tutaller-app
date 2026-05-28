import Link from 'next/link';

const features = [
  { icon: '🔧', title: 'Órdenes de trabajo', desc: 'Creá, actualizá y cerrá órdenes desde cualquier dispositivo.' },
  { icon: '👤', title: 'Clientes y vehículos', desc: 'Historial completo por cliente y por vehículo.' },
  { icon: '💰', title: 'Caja e inventario', desc: 'Control de movimientos, stock y proveedores.' },
  { icon: '🔔', title: 'Recordatorios service', desc: 'Alertas automáticas para próximo mantenimiento.' },
  { icon: '📊', title: 'Reportes y finanzas', desc: 'Facturación diaria, mensual y métricas del taller.' },
  { icon: '🤖', title: 'Bot WhatsApp', desc: 'Operá el taller desde WhatsApp con audios y texto.' },
];

const plans = [
  {
    name: 'Web',
    price: 'USD 50',
    period: '/mes',
    highlight: false,
    features: ['App completa', 'Órdenes y caja', 'Reportes PDF', '3 usuarios', 'Soporte email'],
  },
  {
    name: 'Bot',
    price: 'USD 80',
    period: '/mes',
    highlight: true,
    badge: 'Más popular',
    features: ['Todo Web incluido', 'Bot WhatsApp', 'Voz + texto', '3 grupos WA', 'Soporte prioritario'],
  },
  {
    name: 'Enterprise',
    price: 'USD 150+',
    period: '/mes',
    highlight: false,
    features: ['Todo Bot incluido', 'Usuarios ilimitados', 'API acceso', 'SLA garantizado', 'Onboarding dedicado'],
  },
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-fma-black text-fma-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block bg-fma-cyan/10 border border-fma-cyan/30 text-fma-cyan text-xs font-medium px-3 py-1 rounded-full mb-6">
          🎉 Founding members — 30% off de por vida (primeros 50 talleres)
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          Gestión de taller<br /><span className="text-fma-cyan">sin complicaciones</span>
        </h1>
        <p className="text-fma-white-soft/60 text-xl mb-10 max-w-2xl mx-auto">
          Todo lo que necesita tu taller mecánico en un solo lugar.
          Órdenes, clientes, caja, inventario y bot WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="btn-primary px-8 py-3 text-base">
            Empezar gratis — 14 días
          </Link>
          <Link href="/login" className="btn-secondary px-8 py-3 text-base">
            Ingresar al sistema
          </Link>
        </div>
        <p className="text-xs text-fma-white-soft/30 mt-4">Sin tarjeta de crédito · Configuración en 2 minutos</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">Todo lo que necesitás</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card hover:border-fma-cyan/40 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-fma-white mb-1">{f.title}</h3>
              <p className="text-sm text-fma-white-soft/50">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-2">Precios simples</h2>
        <p className="text-center text-fma-white-soft/50 text-sm mb-10">ARS disponible · Founding members 30% off</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.name} className={`card relative flex flex-col ${p.highlight ? 'border-fma-cyan' : ''}`}>
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-fma-cyan text-fma-black text-xs font-bold px-3 py-0.5 rounded-full">
                  {p.badge}
                </span>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-lg text-fma-white">{p.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-3xl font-bold ${p.highlight ? 'text-fma-cyan' : 'text-fma-white'}`}>{p.price}</span>
                  <span className="text-fma-white-soft/40 text-sm">{p.period}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {p.features.map((feat) => (
                  <li key={feat} className="text-sm text-fma-white-soft/70 flex items-center gap-2">
                    <span className="text-green-400">✓</span>{feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={p.highlight ? 'btn-primary text-center text-sm' : 'btn-secondary text-center text-sm'}
              >
                Empezar prueba gratis
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="border-t border-fma-gray py-16 text-center px-6">
        <h2 className="text-2xl font-bold mb-3">Listo para modernizar tu taller?</h2>
        <p className="text-fma-white-soft/50 mb-6 text-sm">14 días gratis, sin tarjeta, cancelás cuando quieras.</p>
        <Link href="/signup" className="btn-primary px-8 py-3 text-base inline-block">
          Crear cuenta gratis
        </Link>
        <p className="text-xs text-fma-white-soft/30 mt-8">
          TuTaller.app · Producto de FERVOR ·{' '}
          <a href="/login" className="hover:text-fma-cyan">Ingresar</a>
        </p>
      </section>
    </main>
  );
}
