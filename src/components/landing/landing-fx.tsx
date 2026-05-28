'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/* ─── Scroll-aware landing nav (dark text over light hero → dark glass over body) ─── */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'glass-light border-black/5' : 'border-transparent bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" data-cursor>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fma-cyan to-violet-600 flex items-center justify-center text-white font-black text-sm">T</div>
          <span className="font-bold text-lg tracking-tight text-black">
            TuTaller<span className="text-fma-cyan">.app</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="text-sm transition-colors px-3 py-1.5 text-black/60 hover:text-black">
            Ingresar
          </Link>
          <Link href="/signup" className="btn-primary text-sm px-4 py-2 rounded-lg">
            Empezar gratis
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero 3D stage: metallic gear + exploded shards, mouse-parallax (Noomo "case") ─── */
export function HeroStage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty('--px', String(x));
        el.style.setProperty('--py', String(y));
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);

  const pieces = [
    { src: '/3d/wrench.png',       t: '14%', l: '8%',  s: 'w-16 md:w-24', d: 3.0, delay: '0s',   rot: '-18deg' },
    { src: '/3d/nutbolt.png',      t: '64%', l: '4%',  s: 'w-12 md:w-20', d: 3.8, delay: '0.9s', rot: '10deg'  },
    { src: '/3d/hammerwrench.png', t: '70%', l: '80%', s: 'w-16 md:w-28', d: 2.6, delay: '0.5s', rot: '14deg'  },
    { src: '/3d/wrench.png',       t: '10%', l: '82%', s: 'w-12 md:w-20', d: 3.4, delay: '1.4s', rot: '24deg'  },
  ];
  const shards = [
    { t: '30%', l: '16%', s: 16, d: 4.0, delay: '0.6s' },
    { t: '80%', l: '42%', s: 14, d: 3.6, delay: '0.3s' },
    { t: '22%', l: '70%', s: 18, d: 4.2, delay: '1.1s' },
    { t: '54%', l: '90%', s: 12, d: 2.8, delay: '1.6s' },
  ];

  return (
    <div ref={ref} className="hero-stage absolute inset-0 pointer-events-none">
      {/* centerpiece 3D gear */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="floater" style={{ '--d': '1.2' } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/3d/gear.png" alt="" aria-hidden className="gear-img animate-float-slow drop-shadow-2xl select-none" />
        </div>
      </div>

      {/* scattered 3D tool fragments */}
      {pieces.map((p, i) => (
        <div key={i} className="floater absolute" style={{ top: p.t, left: p.l, '--d': String(p.d) } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.src}
            alt=""
            aria-hidden
            className={`${p.s} animate-float select-none drop-shadow-xl`}
            style={{ animationDelay: p.delay, rotate: p.rot }}
          />
        </div>
      ))}

      {/* white shatter shards */}
      {shards.map((sh, i) => (
        <span
          key={`s${i}`}
          className="shard animate-float"
          style={{ top: sh.t, left: sh.l, width: sh.s, height: sh.s, animationDelay: sh.delay, '--d': String(sh.d) } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ─── Custom cursor (dot + lagging ring, grows over interactive) ─── */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    let rx = window.innerWidth / 2, ry = window.innerHeight / 2;
    let x = rx, y = ry, raf = 0;
    const onMove = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px)`;
      const t = e.target as HTMLElement;
      const hot = !!t.closest('a, button, [data-cursor], input, textarea, select');
      ring.current?.classList.toggle('cursor-ring--hot', hot);
    };
    const loop = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    document.body.classList.add('has-custom-cursor');
    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      document.body.classList.remove('has-custom-cursor');
    };
  }, []);
  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden />
      <div ref={ring} className="cursor-ring" aria-hidden />
    </>
  );
}

/* ─── Magnetic wrapper: pulls toward pointer ─── */
export function Magnetic({ children, className = '', strength = 0.4 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - (r.left + r.width / 2);
    const my = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = 'translate(0,0)'; };
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={`magnetic ${className}`}>
      {children}
    </div>
  );
}

/* ─── Scroll progress bar (top) ─── */
export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-fma-cyan via-violet-500 to-fma-cyan transition-[width] duration-150 ease-out"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

/* ─── Reveal on scroll ─── */
export function Reveal({
  children,
  className = '',
  delay = 0,
  variant = 'up',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'up' | '3d';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`${variant === '3d' ? 'reveal-3d' : 'reveal'} ${shown ? 'in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── 3D tilt card following pointer ─── */
export function Tilt({
  children,
  className = '',
  max = 10,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - py) * max}deg`);
    el.style.setProperty('--ry', `${(px - 0.5) * max}deg`);
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`tilt ${glare ? 'tilt-glare' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Count-up number when in view ─── */
export function CountUp({
  to,
  suffix = '',
  decimals = 0,
  duration = 1600,
  className = '',
}: {
  to: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setVal(to * eased);
        if (t < 1) requestAnimationFrame(tick);
        else setVal(to);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return (
    <span ref={ref} className={className}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ─── Hero parallax: floating cards follow pointer; mobile mockup always visible ─── */
export function HeroFloaters() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty('--px', String(x));
        el.style.setProperty('--py', String(y));
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="hero-floaters absolute inset-0 pointer-events-none">
      {/* desktop floating cards */}
      <div className="floater animate-float absolute top-32 right-[10%] hidden lg:block" style={{ '--d': '1.4' } as React.CSSProperties}>
        <div className="glass rounded-2xl p-4 shadow-2xl w-52">
          <div className="text-xs text-white/40 mb-1">Orden #1042</div>
          <div className="text-sm font-semibold text-white mb-2">Toyota Corolla · 2021</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Entregado hoy</span>
          </div>
        </div>
      </div>
      <div className="floater animate-float-slow absolute bottom-40 left-[8%] hidden lg:block" style={{ '--d': '-1.8' } as React.CSSProperties}>
        <div className="glass rounded-2xl p-4 shadow-2xl w-48">
          <div className="text-xs text-white/40 mb-1">Caja · hoy</div>
          <div className="text-2xl font-black text-fma-cyan">$284.500</div>
          <div className="text-xs text-white/50 mt-1">↑ 18% vs ayer</div>
        </div>
      </div>
      <div className="floater animate-float absolute top-48 left-[12%] hidden xl:block" style={{ '--d': '2.2', animationDelay: '3s' } as React.CSSProperties}>
        <div className="glass rounded-2xl p-3 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-fma-cyan/20 flex items-center justify-center text-fma-cyan text-sm">🤖</div>
            <div>
              <div className="text-xs font-medium text-white">Bot respondió</div>
              <div className="text-xs text-white/40">hace 2 min</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
