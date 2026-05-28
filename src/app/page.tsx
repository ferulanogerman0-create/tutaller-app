import Link from 'next/link';

const features = [
  {
    icon: '⚡',
    title: 'Órdenes en tiempo real',
    desc: 'Creá, asignás y cerrás órdenes desde cualquier dispositivo. Sin papel, sin demoras.',
    color: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/20',
  },
  {
    icon: '👤',
    title: 'Historial completo',
    desc: 'Cada cliente y vehículo con su historial, presupuestos y recordatorios de service.',
    color: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/20',
  },
  {
    icon: '💰',
    title: 'Caja e inventario',
    desc: 'Control total de movimientos, stock actualizado y gestión de proveedores.',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/20',
  },
  {
    icon: '🔔',
    title: 'Recordatorios automáticos',
    desc: 'El sistema avisa a tus clientes por WhatsApp cuándo vence el próximo service.',
    color: 'from-orange-500/20 to-amber-500/20',
    border: 'border-orange-500/20',
  },
  {
    icon: '📊',
    title: 'Finanzas y reportes',
    desc: 'Dashboard con ingresos, egresos, cierres de caja y PDFs para imprimir.',
    color: 'from-pink-500/20 to-rose-500/20',
    border: 'border-pink-500/20',
  },
  {
    icon: '🤖',
    title: 'Bot WhatsApp con IA',
    desc: 'Operá el taller con audios y mensajes de texto. El bot entiende lenguaje natural.',
    color: 'from-fma-cyan/20 to-sky-500/20',
    border: 'border-fma-cyan/20',
  },
];

const plans = [
  {
    key: 'web',
    name: 'Web',
    price: '$50.000',
    usd: 'USD 50',
    period: '/mes',
    highlight: false,
    desc: 'Para el taller que quiere digitalizarse',
    features: ['App completa multi-dispositivo', 'Órdenes, caja e inventario', 'Reportes PDF imprimibles', 'Hasta 3 usuarios', 'Soporte por email'],
  },
  {
    key: 'bot',
    name: 'Bot',
    price: '$80.000',
    usd: 'USD 80',
    period: '/mes',
    highlight: true,
    badge: 'Más elegido',
    desc: 'Para el taller que quiere automatizar',
    features: ['Todo lo del plan Web', 'Bot WhatsApp con IA', 'Responde audios y texto', 'Hasta 3 grupos de WA', 'Soporte prioritario'],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '$150.000',
    usd: 'USD 150',
    period: '/mes',
    highlight: false,
    desc: 'Para cadenas y franquicias',
    features: ['Todo lo del plan Bot', 'Usuarios ilimitados', 'Acceso a la API', 'SLA garantizado 99.9%', 'Onboarding dedicado'],
  },
];

const stats = [
  { value: '14', label: 'días gratis', suffix: '' },
  { value: '2', label: 'minutos de setup', suffix: '' },
  { value: '38', label: 'acciones de bot', suffix: '+' },
  { value: '99.9', label: 'uptime garantizado', suffix: '%' },
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-fma-black text-fma-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fma-cyan to-violet-600 flex items-center justify-center text-white font-black text-sm">T</div>
            <span className="font-bold text-fma-white text-lg tracking-tight">TuTaller<span className="text-fma-cyan">.app</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5">
              Ingresar
            </Link>
            <Link href="/signup" className="btn-primary text-sm px-4 py-2 rounded-lg">
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16 overflow-hidden">

        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-pulse-glow absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-fma-cyan/8 blur-[120px]" />
          <div className="animate-pulse-glow absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[120px]" style={{animationDelay:'2s'}} />
          <div className="animate-pulse-glow absolute top-1/2 left-1/2 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-[100px]" style={{animationDelay:'4s'}} />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />

        {/* Floating 3D elements */}
        <div className="animate-float absolute top-32 right-[10%] hidden lg:block">
          <div className="glass rounded-2xl p-4 shadow-2xl w-52 card-3d">
            <div className="text-xs text-white/40 mb-1">Orden #1042</div>
            <div className="text-sm font-semibold text-white mb-2">Toyota Corolla · AÑO 2021</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">Entregado hoy</span>
            </div>
          </div>
        </div>
        <div className="animate-float-slow absolute bottom-40 left-[8%] hidden lg:block">
          <div className="glass rounded-2xl p-4 shadow-2xl w-48 card-3d">
            <div className="text-xs text-white/40 mb-1">Caja · hoy</div>
            <div className="text-2xl font-black text-fma-cyan">$284.500</div>
            <div className="text-xs text-white/50 mt-1">↑ 18% vs ayer</div>
          </div>
        </div>
        <div className="animate-float absolute top-48 left-[12%] hidden xl:block" style={{animationDelay:'3s'}}>
          <div className="glass rounded-2xl p-3 shadow-xl card-3d">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-fma-cyan/20 flex items-center justify-center text-fma-cyan text-sm">🤖</div>
              <div>
                <div className="text-xs font-medium text-white">Bot respondió</div>
                <div className="text-xs text-white/40">hace 2 min</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="animate-fade-up inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-fma-cyan animate-pulse" />
            <span className="gradient-text-gold font-bold">Founding members</span>
            <span className="text-white/60">— 30% off de por vida · Primeros 50 talleres</span>
          </div>

          <h1 className="animate-fade-up-delay1 text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            El software que<br />
            <span className="gradient-text">transforma tu taller</span>
          </h1>

          <p className="animate-fade-up-delay2 text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gestión completa, bot de WhatsApp con IA y reportes en tiempo real.
            Todo lo que necesita tu taller mecánico, en un solo lugar.
          </p>

          <div className="animate-fade-up-delay3 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="relative group inline-flex items-center justify-center gap-2 bg-fma-cyan text-fma-black font-bold px-8 py-4 rounded-xl text-base transition-all hover:bg-fma-cyan-light hover:scale-105 hover:shadow-[0_0_40px_rgba(0,180,216,0.4)]"
            >
              Empezar gratis — 14 días
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 glass rounded-xl px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all"
            >
              Ver precios
            </Link>
          </div>
          <p className="animate-fade-in text-xs text-white/25 mt-5">Sin tarjeta de crédito · Configuración en 2 minutos · Cancelás cuando quieras</p>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-fma-cyan" />
          <div className="w-1.5 h-1.5 rounded-full bg-fma-cyan animate-bounce" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl md:text-5xl font-black gradient-text mb-1">
                  {s.value}{s.suffix}
                </div>
                <div className="text-sm text-white/40 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block glass rounded-full px-4 py-1.5 text-xs font-medium text-fma-cyan mb-4">Funcionalidades</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Todo lo que necesitás,<br />
              <span className="gradient-text">nada que no usás</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">Diseñado específicamente para talleres mecánicos argentinos.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`card-3d relative rounded-2xl p-6 bg-gradient-to-br ${f.color} border ${f.border} cursor-default overflow-hidden noise`}
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block glass rounded-full px-4 py-1.5 text-xs font-medium text-violet-400 mb-4">3 pasos</div>
            <h2 className="text-4xl md:text-5xl font-black">
              Arrancás en <span className="gradient-text">2 minutos</span>
            </h2>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-fma-cyan/30 via-violet-500/30 to-fma-cyan/30" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { num: '01', title: 'Creás tu cuenta', desc: 'Nombre del taller y listo. Sin formularios, sin burocracia.' },
                { num: '02', title: 'Cargás tus datos', desc: 'Importás clientes, vehículos y órdenes desde DIRUP u otro sistema.' },
                { num: '03', title: 'Operás desde cualquier lugar', desc: 'App web + bot WhatsApp. Tu taller en el celular.' },
              ].map((step) => (
                <div key={step.num} className="text-center">
                  <div className="w-16 h-16 rounded-2xl glass-cyan flex items-center justify-center text-2xl font-black text-fma-cyan mx-auto mb-4 glow-border">
                    {step.num}
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block glass rounded-full px-4 py-1.5 text-xs font-medium text-fma-cyan mb-4">Precios</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Invertís una vez,<br />
              <span className="gradient-text">ganás para siempre</span>
            </h2>
            <p className="text-white/40">Todos los planes incluyen 14 días gratis. Sin contrato ni permanencia.</p>
            <div className="inline-flex items-center gap-2 mt-4 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 text-xs text-amber-400">
              <span>⚡</span>
              Founding members activos — 30% off de por vida en cualquier plan
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((p) => (
              <div
                key={p.key}
                className={`relative rounded-2xl flex flex-col card-3d overflow-hidden ${
                  p.highlight
                    ? 'glass-cyan glow-border'
                    : 'glass'
                }`}
              >
                {p.badge && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fma-cyan via-violet-500 to-fma-cyan" />
                )}
                <div className="p-8 flex flex-col flex-1">
                  {p.badge && (
                    <div className="inline-flex self-start bg-fma-cyan/15 border border-fma-cyan/30 text-fma-cyan text-xs font-bold px-3 py-1 rounded-full mb-4">
                      {p.badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-1">{p.name}</h3>
                    <div className="flex items-end gap-2 mb-2">
                      <span className={`text-5xl font-black ${p.highlight ? 'gradient-text' : 'text-white'}`}>
                        {p.price}
                      </span>
                      <span className="text-white/30 text-sm mb-2">{p.period}</span>
                    </div>
                    <div className="text-xs text-white/30">{p.usd} · tipo de cambio oficial</div>
                    <p className="text-sm text-white/40 mt-3">{p.desc}</p>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-sm text-white/70">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${p.highlight ? 'bg-fma-cyan/20 text-fma-cyan' : 'bg-white/10 text-white/60'}`}>✓</div>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                      p.highlight
                        ? 'bg-fma-cyan text-fma-black hover:bg-fma-cyan-light hover:shadow-[0_0_30px_rgba(0,180,216,0.35)] hover:scale-105'
                        : 'glass border border-white/10 text-white hover:bg-white/10 hover:scale-105'
                    }`}
                  >
                    Empezar prueba gratis
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-white/25 mt-8">
            También disponible en ARS — precio equivalente al tipo de cambio oficial.
            Pagos procesados por MercadoPago. Cancelás en cualquier momento.
          </p>
        </div>
      </section>

      {/* ── Bot highlight ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden glass-cyan glow-border p-8 md:p-12">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fma-cyan/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="inline-block glass rounded-full px-4 py-1.5 text-xs font-medium text-fma-cyan mb-4">Solo en plan Bot y Enterprise</div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                  Tu taller opera solo<br />
                  <span className="gradient-text">por WhatsApp</span>
                </h2>
                <p className="text-white/50 mb-6 leading-relaxed">
                  El bot entiende audios y texto. Consultá órdenes, cargá movimientos de caja,
                  buscá clientes y más — todo desde el celular, sin abrir la app.
                </p>
                <Link href="/signup" className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl hover:scale-105 transition-all hover:shadow-[0_0_30px_rgba(0,180,216,0.3)]">
                  Probar bot gratis <span>→</span>
                </Link>
              </div>
              <div className="flex-shrink-0 space-y-3 w-full md:w-72">
                {[
                  { from: 'Germán', msg: '🎤 audio 0:08', time: '10:23', type: 'out' },
                  { from: 'TuTaller Bot', msg: '✅ Orden #1042 entregada. Facturación: $42.000', time: '10:23', type: 'in' },
                  { from: 'Germán', msg: 'cuántas órdenes cerramos hoy', time: '10:24', type: 'out' },
                  { from: 'TuTaller Bot', msg: '📊 Hoy cerraron 7 órdenes · Total cobrado: $284.500', time: '10:24', type: 'in' },
                ].map((m, i) => (
                  <div key={i} className={`flex ${m.type === 'out' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.type === 'out'
                        ? 'bg-[#005C4B] text-white'
                        : 'glass text-white'
                    }`}>
                      <div className="font-medium text-xs text-white/50 mb-0.5">{m.from}</div>
                      <div>{m.msg}</div>
                      <div className="text-xs text-white/30 text-right mt-0.5">{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fma-cyan/5 to-transparent" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Tu taller merece<br />
            <span className="gradient-text">tecnología de punta</span>
          </h2>
          <p className="text-white/40 text-lg mb-10">
            14 días gratis, sin tarjeta, sin contrato. Empezás hoy y ves los resultados mañana.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 bg-fma-cyan text-fma-black font-black px-10 py-5 rounded-2xl text-lg transition-all hover:bg-fma-cyan-light hover:scale-105 hover:shadow-[0_0_60px_rgba(0,180,216,0.5)]"
          >
            Crear cuenta gratis
            <span className="text-2xl">→</span>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-fma-cyan to-violet-600 flex items-center justify-center text-white font-black text-xs">T</div>
            <span className="text-white/40 text-sm">TuTaller.app — Producto de FERVOR</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <a href="/login" className="hover:text-fma-cyan transition-colors">Ingresar</a>
            <a href="/signup" className="hover:text-fma-cyan transition-colors">Registro</a>
            <a href="mailto:hola@tutaller.app" className="hover:text-fma-cyan transition-colors">hola@tutaller.app</a>
          </div>
        </div>
      </footer>

    </main>
  );
}
