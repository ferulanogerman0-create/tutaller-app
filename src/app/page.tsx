import Link from 'next/link';
import { ScrollProgress, Reveal, Tilt, CountUp, CustomCursor, Magnetic, LandingNav, HeroStage } from '@/components/landing/landing-fx';

const features = [
  { icon: '⚡', title: 'Órdenes en tiempo real', desc: 'Creá, asignás y cerrás órdenes desde cualquier dispositivo. Sin papel, sin demoras.', chip: 'bg-cyan-500/15' },
  { icon: '👤', title: 'Historial completo', desc: 'Cada cliente y vehículo con su historial, presupuestos y recordatorios de service.', chip: 'bg-violet-500/15' },
  { icon: '💰', title: 'Caja e inventario', desc: 'Control total de movimientos, stock actualizado y gestión de proveedores.', chip: 'bg-emerald-500/15' },
  { icon: '🔔', title: 'Recordatorios automáticos', desc: 'El sistema avisa a tus clientes por WhatsApp cuándo vence el próximo service.', chip: 'bg-orange-500/15' },
  { icon: '📊', title: 'Finanzas y reportes', desc: 'Dashboard con ingresos, egresos, cierres de caja y PDFs para imprimir.', chip: 'bg-pink-500/15' },
  { icon: '🤖', title: 'Bot WhatsApp con IA', desc: 'Operá el taller con audios y mensajes de texto. El bot entiende lenguaje natural.', chip: 'bg-sky-500/15' },
];

const plans = [
  {
    key: 'web', name: 'Web', price: '$50.000', usd: 'USD 50', period: '/mes', highlight: false,
    desc: 'Para el taller que quiere digitalizarse',
    features: ['App completa multi-dispositivo', 'Órdenes, caja e inventario', 'Reportes PDF imprimibles', 'Hasta 3 usuarios', 'Soporte por email'],
  },
  {
    key: 'bot', name: 'Bot', price: '$80.000', usd: 'USD 80', period: '/mes', highlight: true, badge: 'Más elegido',
    desc: 'Para el taller que quiere automatizar',
    features: ['Todo lo del plan Web', 'Bot WhatsApp con IA', 'Responde audios y texto', 'Hasta 3 grupos de WA', 'Soporte prioritario'],
  },
  {
    key: 'enterprise', name: 'Enterprise', price: '$150.000', usd: 'USD 150', period: '/mes', highlight: false,
    desc: 'Para cadenas y franquicias',
    features: ['Todo lo del plan Bot', 'Usuarios ilimitados', 'Acceso a la API', 'SLA garantizado 99.9%', 'Onboarding dedicado'],
  },
];

const stats = [
  { to: 7, label: 'días gratis', suffix: '', decimals: 0 },
  { to: 2, label: 'minutos de setup', suffix: '', decimals: 0 },
  { to: 38, label: 'acciones de bot', suffix: '+', decimals: 0 },
  { to: 99.9, label: 'uptime garantizado', suffix: '%', decimals: 1 },
];

export default function Landing() {
  return (
    <main className="min-h-screen page-light overflow-x-hidden">
      <CustomCursor />
      <ScrollProgress />

      {/* ── Navbar (scroll-aware) ── */}
      <LandingNav />

      {/* ── Hero — Noomo "case" style: light showcase panel ── */}
      <section className="hero-light relative min-h-screen flex items-center justify-center px-3 sm:px-6 pt-20 pb-8 overflow-hidden">
        <div className="hero-panel relative w-full max-w-6xl mx-auto rounded-[1.75rem] md:rounded-[2.5rem] overflow-hidden">

          {/* holographic light leaks */}
          <div className="holo holo-tr" />
          <div className="holo holo-bl" />
          <div className="holo holo-tl" />

          <div className="relative px-6 md:px-12 pt-10 md:pt-16 pb-8 md:pb-12 min-h-[78vh] flex flex-col">

            {/* Giant headline + 3D object piercing it */}
            <div className="animate-fade-up relative flex-1 flex items-center justify-center py-8">
              <h1 className="hero-bespoke relative z-0 text-center select-none">TUTALLER</h1>
              <HeroStage />
            </div>

            {/* Bottom row: tag · CTA · description */}
            <div className="animate-fade-up-delay2 relative z-10 grid grid-cols-1 md:grid-cols-3 items-end gap-6 md:gap-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded-full border border-black/25 px-3 py-1 font-semibold text-black/80">TuTaller</span>
                <span className="text-black/55">Gestión / Bot IA / Taller</span>
              </div>

              <div className="flex justify-start md:justify-center">
                <Magnetic>
                  <Link href="/signup" className="shine inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3 rounded-full transition-transform hover:scale-105" data-cursor>
                    EMPEZAR GRATIS <span>→</span>
                  </Link>
                </Magnetic>
              </div>

              <div className="md:text-right md:justify-self-end max-w-xs">
                <h3 className="font-bold text-black mb-1">Tu taller, en un solo lugar</h3>
                <p className="text-sm text-black/55 leading-relaxed">
                  Órdenes, caja, inventario y bot de WhatsApp con IA. Listo en 2 minutos · 7 días gratis.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-black/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-black/50 animate-bounce" />
        </div>
      </section>

      {/* ── Kinetic marquee band ── */}
      <div className="marquee-mask py-5 border-y border-black/5 overflow-hidden">
        <div className="marquee-track items-center gap-8 text-3xl md:text-4xl font-black tracking-tight">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-8 pr-8">
              {['ÓRDENES', 'CAJA', 'INVENTARIO', 'BOT WHATSAPP', 'CLIENTES', 'REPORTES', 'TURNOS'].map((w) => (
                <span key={w} className="flex items-center gap-8 text-black/[0.09]">
                  {w}
                  <span className="text-fma-cyan/50 text-xl">◆</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <section className="py-16 border-b border-black/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 80} className="text-center">
                <div className="text-4xl md:text-5xl font-black gradient-text mb-1">
                  <CountUp to={s.to} suffix={s.suffix} decimals={s.decimals} />
                </div>
                <div className="text-sm text-black/45 font-medium">{s.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <div className="inline-block glass-light rounded-full px-4 py-1.5 text-xs font-semibold text-fma-cyan-dark mb-4">Funcionalidades</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-[#0b0b0d]">
              Todo lo que necesitás,<br />
              <span className="gradient-text">nada que no usás</span>
            </h2>
            <p className="text-black/45 text-lg max-w-xl mx-auto">Diseñado específicamente para talleres mecánicos argentinos.</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 100} variant="3d">
                <Tilt className="glass-light rounded-2xl p-6 h-full">
                  <div className={`w-14 h-14 rounded-2xl ${f.chip} flex items-center justify-center text-3xl mb-4`}>{f.icon}</div>
                  <h3 className="font-bold text-[#0b0b0d] text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-black/55 leading-relaxed">{f.desc}</p>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <Reveal className="text-center mb-16">
            <div className="inline-block glass-light rounded-full px-4 py-1.5 text-xs font-semibold text-violet-600 mb-4">3 pasos</div>
            <h2 className="text-4xl md:text-5xl font-black text-[#0b0b0d]">
              Arrancás en <span className="gradient-text">2 minutos</span>
            </h2>
          </Reveal>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-fma-cyan/40 via-violet-500/40 to-fma-cyan/40" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { num: '01', title: 'Creás tu cuenta', desc: 'Nombre del taller y listo. Sin formularios, sin burocracia.' },
                { num: '02', title: 'Cargás tus datos', desc: 'Importás clientes, vehículos y órdenes desde DIRUP u otro sistema.' },
                { num: '03', title: 'Operás desde cualquier lugar', desc: 'App web + bot WhatsApp. Tu taller en el celular.' },
              ].map((step, i) => (
                <Reveal key={step.num} delay={i * 140} className="text-center">
                  <div className="w-16 h-16 rounded-2xl glass-light-cyan flex items-center justify-center text-2xl font-black text-fma-cyan-dark mx-auto mb-4 glow-border">
                    {step.num}
                  </div>
                  <h3 className="font-bold text-[#0b0b0d] text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-black/50 leading-relaxed">{step.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <div className="inline-block glass-light rounded-full px-4 py-1.5 text-xs font-semibold text-fma-cyan-dark mb-4">Precios</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-[#0b0b0d]">
              Invertís una vez,<br />
              <span className="gradient-text">ganás para siempre</span>
            </h2>
            <p className="text-black/45">Todos los planes incluyen 7 días gratis. Sin contrato ni permanencia.</p>
            <div className="inline-flex items-center gap-2 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2 text-xs text-amber-600 font-medium">
              <span>⚡</span>
              Founding members activos — 30% off de por vida en cualquier plan
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((p, i) => (
              <Reveal key={p.key} delay={i * 120} className="h-full">
                <Tilt
                  max={p.highlight ? 8 : 6}
                  className={`relative rounded-2xl flex flex-col overflow-hidden h-full ${
                    p.highlight ? 'glass-light-cyan glow-border md:-translate-y-3' : 'glass-light'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fma-cyan via-violet-500 to-fma-cyan" />
                  )}
                  <div className="p-8 flex flex-col flex-1">
                    {p.badge && (
                      <div className="inline-flex self-start bg-fma-cyan/15 border border-fma-cyan/30 text-fma-cyan-dark text-xs font-bold px-3 py-1 rounded-full mb-4">
                        {p.badge}
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-black/50 uppercase tracking-widest mb-1">{p.name}</h3>
                      <div className="flex items-end gap-2 mb-2">
                        <span className={`text-5xl font-black ${p.highlight ? 'gradient-text' : 'text-[#0b0b0d]'}`}>
                          {p.price}
                        </span>
                        <span className="text-black/35 text-sm mb-2">{p.period}</span>
                      </div>
                      <div className="text-xs text-black/40">{p.usd} · tipo de cambio oficial</div>
                      <p className="text-sm text-black/50 mt-3">{p.desc}</p>
                    </div>
                    <ul className="space-y-3 flex-1 mb-8">
                      {p.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-3 text-sm text-black/70">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${p.highlight ? 'bg-fma-cyan/20 text-fma-cyan-dark' : 'bg-black/10 text-black/50'}`}>✓</div>
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={`w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                        p.highlight
                          ? 'bg-fma-cyan text-fma-black hover:bg-fma-cyan-light hover:shadow-[0_0_30px_rgba(0,180,216,0.35)] hover:scale-105'
                          : 'border border-black/15 bg-white/50 text-[#0b0b0d] hover:bg-white hover:scale-105'
                      }`}
                    >
                      Empezar prueba gratis
                    </Link>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>

          <p className="text-center text-xs text-black/40 mt-8">
            También disponible en ARS — precio equivalente al tipo de cambio oficial.
            Pagos procesados por MercadoPago. Cancelás en cualquier momento.
          </p>
        </div>
      </section>

      {/* ── Bot highlight ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden glass-light-cyan glow-border p-8 md:p-12">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fma-cyan/15 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1">
                  <div className="inline-block glass-light rounded-full px-4 py-1.5 text-xs font-semibold text-fma-cyan-dark mb-4">Solo en plan Bot y Enterprise</div>
                  <h2 className="text-3xl md:text-4xl font-black text-[#0b0b0d] mb-4">
                    Tu taller opera solo<br />
                    <span className="gradient-text">por WhatsApp</span>
                  </h2>
                  <p className="text-black/55 mb-6 leading-relaxed">
                    El bot entiende audios y texto. Consultá órdenes, cargá movimientos de caja,
                    buscá clientes y más — todo desde el celular, sin abrir la app.
                  </p>
                  <Magnetic>
                    <Link href="/signup" className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl hover:scale-105 transition-all hover:shadow-[0_0_30px_rgba(0,180,216,0.3)]">
                      Probar bot gratis <span>→</span>
                    </Link>
                  </Magnetic>
                </div>
                <div className="flex-shrink-0 space-y-3 w-full md:w-72">
                  {[
                    { from: 'Germán', msg: '🎤 audio 0:08', time: '10:23', type: 'out' },
                    { from: 'TuTaller Bot', msg: '✅ Orden #1042 entregada. Facturación: $42.000', time: '10:23', type: 'in' },
                    { from: 'Germán', msg: 'cuántas órdenes cerramos hoy', time: '10:24', type: 'out' },
                    { from: 'TuTaller Bot', msg: '📊 Hoy cerraron 7 órdenes · Total cobrado: $284.500', time: '10:24', type: 'in' },
                  ].map((m, i) => (
                    <div key={i} className={`flex ${m.type === 'out' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        m.type === 'out' ? 'bg-[#d9fdd3] text-[#111b21]' : 'bg-white text-[#111b21]'
                      }`}>
                        <div className="font-semibold text-xs text-black/40 mb-0.5">{m.from}</div>
                        <div>{m.msg}</div>
                        <div className="text-xs text-black/35 text-right mt-0.5">{m.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <Reveal className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-[#0b0b0d]">
            Tu taller merece<br />
            <span className="gradient-text">tecnología de punta</span>
          </h2>
          <p className="text-black/45 text-lg mb-10">
            7 días gratis, sin tarjeta, sin contrato. Empezás hoy y ves los resultados mañana.
          </p>
          <Magnetic>
            <Link
              href="/signup"
              className="shine inline-flex items-center gap-3 bg-fma-cyan text-fma-black font-black px-10 py-5 rounded-2xl text-lg transition-all hover:bg-fma-cyan-light hover:scale-105 hover:shadow-[0_0_60px_rgba(0,180,216,0.45)]"
            >
              Crear cuenta gratis
              <span className="text-2xl">→</span>
            </Link>
          </Magnetic>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-black/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-fma-cyan to-violet-600 flex items-center justify-center text-white font-black text-xs">T</div>
            <span className="text-black/45 text-sm">TuTaller.app — Producto de FERVOR</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-black/40">
            <a href="/login" className="hover:text-fma-cyan-dark transition-colors">Ingresar</a>
            <a href="/signup" className="hover:text-fma-cyan-dark transition-colors">Registro</a>
            <a href="mailto:hola@tutaller.app" className="hover:text-fma-cyan-dark transition-colors">hola@tutaller.app</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
