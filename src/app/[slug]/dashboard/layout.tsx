import { redirect } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import { getTenantById } from '@/lib/tenant';
import { daysRemaining } from '@/lib/billing';
import { FmaLogo } from '@/components/fma-logo';
import { GlobalSearch } from '@/components/global-search';
import { MobileSidebar } from '@/components/mobile-sidebar';
import {
  LayoutDashboard, Users, Car, ClipboardList, DollarSign,
  Calendar, Bell, Package, UserCircle, BarChart3, FileText, Settings, LogOut, Gift,
} from 'lucide-react';

const NAV_DEFS = [
  { path: '', label: 'Inicio', icon: LayoutDashboard, roles: 'all' as const },
  { path: '/ordenes', label: 'Órdenes', icon: ClipboardList, roles: ['admin','mecanico','recepcion'] },
  { path: '/presupuestos', label: 'Presupuestos', icon: FileText, roles: ['admin','recepcion'] },
  { path: '/clientes', label: 'Clientes', icon: Users, roles: ['admin','recepcion','contable'] },
  { path: '/vehiculos', label: 'Vehículos', icon: Car, roles: ['admin','mecanico','recepcion'] },
  { path: '/referidos', label: 'Referidos', icon: Gift, roles: ['admin','recepcion'] },
  { path: '/caja', label: 'Caja', icon: DollarSign, roles: ['admin','recepcion','contable'] },
  { path: '/cierres', label: 'Cierres', icon: DollarSign, roles: ['admin','contable','recepcion'] },
  { path: '/cuentas-corrientes', label: 'Cuentas Ctes.', icon: DollarSign, roles: ['admin','contable'] },
  { path: '/finanzas', label: 'Finanzas', icon: BarChart3, roles: ['admin','contable'] },
  { path: '/calendario', label: 'Calendario', icon: Calendar, roles: ['admin','mecanico','recepcion'] },
  { path: '/recordatorios', label: 'Recordatorios', icon: Bell, roles: ['admin','mecanico','recepcion'] },
  { path: '/inventario', label: 'Inventario', icon: Package, roles: ['admin','recepcion'] },
  { path: '/proveedores', label: 'Proveedores', icon: Package, roles: ['admin','recepcion'] },
  { path: '/trabajadores', label: 'Trabajadores', icon: UserCircle, roles: ['admin'] },
  { path: '/graficas', label: 'Gráficas', icon: BarChart3, roles: ['admin','contable'] },
  { path: '/informes', label: 'Informes', icon: FileText, roles: ['admin','contable'] },
  { path: '/configuracion', label: 'Configuración', icon: Settings, roles: ['admin'] },
  { path: '/auditoria', label: 'Auditoría', icon: FileText, roles: ['admin'] },
  { path: '/admin/import', label: 'Importar DIRUP', icon: Settings, roles: ['admin'] },
  { path: '/billing', label: 'Plan y facturación', icon: DollarSign, roles: ['owner'] },
];

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/${slug}/login`);

  const base = `/${slug}/dashboard`;
  const tenant = await getTenantById(user.tenantId);
  const days = tenant ? daysRemaining(tenant.trialEndsAt) : 0;
  const showTrialBanner = tenant?.plan === 'trial';

  // Paywall: expired trial can only access billing page
  if (tenant?.plan === 'trial' && days === 0) {
    const h = await headers();
    const pathname = h.get('x-pathname') || '';
    if (!pathname.endsWith('/billing')) {
      redirect(`/${slug}/dashboard/billing`);
    }
  }

  const visible = NAV_DEFS
    .filter((item) =>
      item.roles === 'all' ? true : user.role === 'admin' ? true : (item.roles as string[]).includes(user.role)
    )
    .map((item) => ({ ...item, href: `${base}${item.path}` }));

  const userFooter = (
    <div className="p-3 border-t border-fma-gray">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-fma-cyan text-fma-black flex items-center justify-center font-bold text-sm">
          {user.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="leading-tight">
          <div className="text-sm font-medium text-fma-white">{user.nombre}</div>
          <div className="text-xs text-fma-white-soft/50 capitalize">{user.role}</div>
        </div>
      </div>
      <form action={`/api/auth/logout?slug=${slug}`} method="POST">
        <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-fma-white-soft/80 hover:bg-fma-black-3 hover:text-red-400 transition-colors">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-fma-black">
      <MobileSidebar items={visible.map(i => ({ href: i.href, label: i.label }))}>
        {userFooter}
      </MobileSidebar>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 bg-fma-black-2 border-r border-fma-gray flex-col flex-shrink-0">
        <div className="p-4 flex items-center gap-2 border-b border-fma-gray">
          <FmaLogo className="h-9 w-9" />
          <div className="leading-tight">
            <div className="font-bold text-fma-white">TuTaller</div>
            <div className="text-xs text-fma-white-soft/50">{slug}</div>
          </div>
        </div>
        <div className="p-2 border-b border-fma-gray">
          <GlobalSearch />
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {visible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-fma-white-soft/80 hover:bg-fma-black-3 hover:text-fma-cyan transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        {userFooter}
      </aside>

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {showTrialBanner && (
          <div className={`px-4 py-2 text-xs flex items-center justify-between gap-2 ${days <= 3 ? 'bg-red-900/50 border-b border-red-500/30 text-red-300' : 'bg-orange-900/40 border-b border-orange-500/30 text-orange-300'}`}>
            <span>
              {days === 0
                ? '⚠ Tu período de prueba venció. Activá un plan para seguir usando TuTaller.'
                : `⏳ Trial: ${days} día${days === 1 ? '' : 's'} restante${days === 1 ? '' : 's'}.`}
            </span>
            <Link href={`/${slug}/dashboard/billing`} className="font-semibold underline whitespace-nowrap hover:text-white">
              Ver planes →
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
