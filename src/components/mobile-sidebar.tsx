'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { FmaLogo } from './fma-logo';

type NavItem = { href: string; label: string };

export function MobileSidebar({ items, children }: { items: NavItem[]; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Top bar mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-fma-black-2 border-b border-fma-gray flex items-center justify-between p-3">
        <button onClick={() => setOpen(true)} className="text-fma-white p-1">
          <Menu className="h-6 w-6" />
        </button>
        <Link href={items[0]?.href || '#'} className="flex items-center gap-2">
          <FmaLogo className="h-7 w-7" />
          <span className="font-bold text-fma-white">TuTaller</span>
        </Link>
        <div className="w-8" />
      </header>

      {/* Overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/70 z-40" onClick={() => setOpen(false)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 bottom-0 w-72 bg-fma-black-2 border-r border-fma-gray flex flex-col"
          >
            <div className="p-3 flex items-center justify-between border-b border-fma-gray">
              <div className="flex items-center gap-2">
                <FmaLogo className="h-8 w-8" />
                <div>
                  <div className="font-bold text-fma-white">TuTaller</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-fma-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    pathname === item.href
                      ? 'bg-fma-cyan/20 text-fma-cyan'
                      : 'text-fma-white-soft/80 hover:bg-fma-black-3 hover:text-fma-cyan'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div onClick={() => setOpen(false)}>{children}</div>
          </aside>
        </div>
      )}
    </>
  );
}
