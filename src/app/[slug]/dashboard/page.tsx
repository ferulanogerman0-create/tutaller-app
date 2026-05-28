import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { count, eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { listProximosRecordatorios } from '@/lib/actions/recordatorios';
import { listStockBajo } from '@/lib/actions/inventario';
import { Bell, ArrowRight, ClipboardList, Wrench, DollarSign, Users, AlertTriangle, TrendingUp, TrendingDown, Truck, Briefcase } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (!user) return null;

  const tid = user.tenantId;
  const base = `/${slug}/dashboard`;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const week = new Date(today); week.setDate(week.getDate() - 7);
  const month = new Date(today); month.setDate(1);
  const lastMonth = new Date(month); lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [
    clientes, vehiculos,
    ordEnReparacion, ordIngresadas, ordReparadas, ordPendientesPago,
    factMes, factMesAnt, factHoy, factSem,
    movHoy,
    proximos, stockBajo,
    topDeudores, recordatoriosHoy, recordatoriosVencidos,
    topMecanicos, proveedoresDeuda,
  ] = await Promise.all([
    db.select({ c: count() }).from(schema.clientes).where(eq(schema.clientes.tenantId, tid)),
    db.select({ c: count() }).from(schema.vehiculos).where(eq(schema.vehiculos.tenantId, tid)),
    db.select({ c: count() }).from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tid), eq(schema.ordenes.estado, 'en_reparacion'))),
    db.select({ c: count() }).from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tid), eq(schema.ordenes.estado, 'ingresado'))),
    db.select({ c: count() }).from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tid), eq(schema.ordenes.estado, 'reparado'))),
    db.select({ c: count() }).from(schema.ordenes)
      .where(and(eq(schema.ordenes.tenantId, tid), eq(schema.ordenes.pagoEstado, 'pendiente'), sql`CAST(${schema.ordenes.totalBruto} AS NUMERIC) > 0`)),
    db.select({ s: sql<string>`COALESCE(SUM(CAST(${schema.ordenes.totalBruto} AS NUMERIC)), 0)` })
      .from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tid), gte(schema.ordenes.fechaIngreso, month))),
    db.select({ s: sql<string>`COALESCE(SUM(CAST(${schema.ordenes.totalBruto} AS NUMERIC)), 0)` })
      .from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tid), gte(schema.ordenes.fechaIngreso, lastMonth), lte(schema.ordenes.fechaIngreso, month))),
    db.select({ s: sql<string>`COALESCE(SUM(CAST(${schema.ordenes.totalBruto} AS NUMERIC)), 0)` })
      .from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tid), gte(schema.ordenes.fechaIngreso, today))),
    db.select({ s: sql<string>`COALESCE(SUM(CAST(${schema.ordenes.totalBruto} AS NUMERIC)), 0)` })
      .from(schema.ordenes).where(and(eq(schema.ordenes.tenantId, tid), gte(schema.ordenes.fechaIngreso, week))),
    db.select({ in: sql<string>`COALESCE(SUM(CAST(${schema.cajaMovimientos.total} AS NUMERIC)), 0)` })
      .from(schema.cajaMovimientos).where(and(eq(schema.cajaMovimientos.tenantId, tid), gte(schema.cajaMovimientos.createdAt, today))),
    listProximosRecordatorios(30),
    listStockBajo(),
    db.select({
      id: schema.clientes.id, nombre: schema.clientes.nombre, telefono: schema.clientes.telefono,
      saldo: schema.clientes.saldoCuentaCorriente,
    }).from(schema.clientes)
      .where(and(eq(schema.clientes.tenantId, tid), sql`CAST(${schema.clientes.saldoCuentaCorriente} AS NUMERIC) > 0`))
      .orderBy(desc(sql`CAST(${schema.clientes.saldoCuentaCorriente} AS NUMERIC)`))
      .limit(5),
    db.select({ c: count() }).from(schema.recordatorios)
      .where(and(eq(schema.recordatorios.tenantId, tid), eq(schema.recordatorios.estado, 'pendiente'), gte(schema.recordatorios.fechaProgramada, today), lte(schema.recordatorios.fechaProgramada, tomorrow))),
    db.select({ c: count() }).from(schema.recordatorios)
      .where(and(eq(schema.recordatorios.tenantId, tid), eq(schema.recordatorios.estado, 'pendiente'), lte(schema.recordatorios.fechaProgramada, today))),
    db.execute(sql`
      SELECT u.nombre, COUNT(o.id)::INT AS ordenes
      FROM users u
      INNER JOIN ordenes o ON o.tecnico_id = u.id
      WHERE o.tenant_id = ${tid} AND u.tenant_id = ${tid}
        AND o.fecha_ingreso >= ${month.toISOString()}
      GROUP BY u.id, u.nombre
      ORDER BY ordenes DESC
      LIMIT 5
    `) as Promise<unknown[]>,
    db.select({
      id: schema.proveedores.id, nombre: schema.proveedores.nombre, saldo: schema.proveedores.saldo,
    }).from(schema.proveedores)
      .where(and(eq(schema.proveedores.tenantId, tid), eq(schema.proveedores.activo, true), sql`CAST(${schema.proveedores.saldo} AS NUMERIC) > 0`))
      .orderBy(desc(sql`CAST(${schema.proveedores.saldo} AS NUMERIC)`))
      .limit(5),
  ]);

  const mesActual = Number(factMes[0]?.s || 0);
  const mesAnterior = Number(factMesAnt[0]?.s || 0);
  const deltaPct = mesAnterior > 0 ? ((mesActual - mesAnterior) / mesAnterior) * 100 : 0;

  const nombre = user.nombre.split(' ')[0] || 'Usuario';

  const isNewTenant = clientes[0].c === 0 && vehiculos[0].c === 0;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-fma-white mb-1">Hola, {nombre}</h1>
      <p className="text-fma-white-soft/60 mb-6">Resumen del taller</p>

      {isNewTenant && (
        <div className="mb-6 bg-fma-cyan/10 border border-fma-cyan/30 rounded-lg p-5">
          <h2 className="text-fma-cyan font-bold text-lg mb-1">¡Bienvenido a TuTaller.app! 🎉</h2>
          <p className="text-fma-white-soft/70 text-sm mb-4">Tu cuenta está lista. Completá estos pasos para empezar:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <Link href={`${base}/configuracion`} className="flex items-start gap-3 bg-fma-black-2 rounded-md p-3 hover:border-fma-cyan border border-fma-gray transition-colors">
              <span className="text-2xl">⚙️</span>
              <div>
                <p className="font-medium text-fma-white">1. Configurar taller</p>
                <p className="text-fma-white-soft/50 text-xs">Nombre, teléfono, CUIT, logo</p>
              </div>
            </Link>
            <Link href={`${base}/clientes/nuevo`} className="flex items-start gap-3 bg-fma-black-2 rounded-md p-3 hover:border-fma-cyan border border-fma-gray transition-colors">
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-medium text-fma-white">2. Agregar cliente</p>
                <p className="text-fma-white-soft/50 text-xs">Primer cliente del taller</p>
              </div>
            </Link>
            <Link href={`${base}/ordenes/nueva`} className="flex items-start gap-3 bg-fma-black-2 rounded-md p-3 hover:border-fma-cyan border border-fma-gray transition-colors">
              <span className="text-2xl">🔧</span>
              <div>
                <p className="font-medium text-fma-white">3. Crear orden</p>
                <p className="text-fma-white-soft/50 text-xs">Primera orden de trabajo</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Facturado hoy" value={`$${Number(factHoy[0]?.s || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} icon={DollarSign} color="text-green-400" href={`${base}/ordenes`} />
        <KpiCard label="Facturado semana" value={`$${Number(factSem[0]?.s || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} icon={TrendingUp} color="text-green-400" href={`${base}/ordenes`} />
        <KpiCard
          label="Facturado mes"
          value={`$${mesActual.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          icon={TrendingUp} color="text-fma-cyan" href={`${base}/informes`}
          delta={mesAnterior > 0 ? `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}% vs mes ant.` : undefined}
          deltaPositive={deltaPct >= 0}
        />
        <KpiCard label="Caja hoy" value={`$${Number(movHoy[0]?.in || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} icon={DollarSign} color="text-fma-cyan" href={`${base}/caja`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Clientes" value={clientes[0].c.toString()} icon={Users} color="text-fma-white-soft/80" href={`${base}/clientes`} />
        <KpiCard label="Vehículos" value={vehiculos[0].c.toString()} icon={Truck} color="text-fma-white-soft/80" href={`${base}/vehiculos`} />
        <KpiCard label="Pendientes cobro" value={ordPendientesPago[0].c.toString()} icon={DollarSign} color="text-orange-400" href={`${base}/cuentas-corrientes`} />
        <KpiCard label="Recordatorios hoy" value={recordatoriosHoy[0].c.toString()} icon={Bell} color={recordatoriosHoy[0].c > 0 ? 'text-yellow-300' : 'text-fma-white-soft/80'} href={`${base}/recordatorios`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Ingresadas" value={ordIngresadas[0].c.toString()} icon={ClipboardList} color="text-blue-300" href={`${base}/ordenes?estado=ingresado`} />
        <KpiCard label="En reparación" value={ordEnReparacion[0].c.toString()} icon={Wrench} color="text-red-400" href={`${base}/ordenes?estado=en_reparacion`} />
        <KpiCard label="Reparadas" value={ordReparadas[0].c.toString()} icon={ClipboardList} color="text-green-400" href={`${base}/ordenes?estado=reparado`} />
        <KpiCard label="Recordatorios vencidos" value={recordatoriosVencidos[0].c.toString()} icon={AlertTriangle} color={recordatoriosVencidos[0].c > 0 ? 'text-red-400' : 'text-fma-white-soft/80'} href={`${base}/recordatorios`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-fma-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-fma-cyan" />
              Próximos recordatorios
            </h2>
            <Link href={`${base}/recordatorios`} className="text-xs text-fma-cyan hover:underline">Ver todos →</Link>
          </div>
          {proximos.length === 0 && <div className="text-sm text-fma-white-soft/40 py-4">Sin recordatorios próximos</div>}
          <div className="space-y-2">
            {proximos.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-fma-gray last:border-0">
                <div className="min-w-0">
                  <div className="text-sm text-fma-white truncate">{r.titulo}</div>
                  <div className="text-xs text-fma-white-soft/50 truncate">
                    {r.cliente?.nombre || 'Sin cliente'}{r.vehiculo ? ` · ${r.vehiculo.dominio}` : ''}
                  </div>
                </div>
                <div className="text-xs text-fma-cyan ml-3 flex-shrink-0">{new Date(r.fechaProgramada).toLocaleDateString('es-AR')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-fma-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-400" /> Top deudores
            </h2>
            <Link href={`${base}/cuentas-corrientes`} className="text-xs text-fma-cyan hover:underline">Ver todos →</Link>
          </div>
          {topDeudores.length === 0 && <div className="text-sm text-fma-white-soft/40 py-4">Sin deudores</div>}
          <div className="space-y-2">
            {topDeudores.map((c) => (
              <Link key={c.id} href={`${base}/cuentas-corrientes/${c.id}`} className="flex items-center justify-between py-1.5 border-b border-fma-gray last:border-0 hover:bg-fma-black-3 -mx-2 px-2 rounded">
                <div className="min-w-0">
                  <div className="text-sm text-fma-white truncate">{c.nombre}</div>
                  <div className="text-xs text-fma-white-soft/50">{c.telefono || '—'}</div>
                </div>
                <div className="text-orange-400 font-bold text-sm ml-3 flex-shrink-0">${Number(c.saldo).toLocaleString('es-AR')}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-fma-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-fma-cyan" /> Top mecánicos mes
            </h2>
            <Link href={`${base}/trabajadores`} className="text-xs text-fma-cyan hover:underline">Ver →</Link>
          </div>
          {(topMecanicos as { nombre: string; ordenes: number }[]).length === 0 && <div className="text-sm text-fma-white-soft/40 py-4">Sin actividad este mes</div>}
          <div className="space-y-2">
            {(topMecanicos as { nombre: string; ordenes: number }[]).map((m, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-fma-gray last:border-0">
                <div className="text-sm text-fma-white">{m.nombre}</div>
                <div className="text-fma-cyan font-bold text-sm">{m.ordenes} órdenes</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-fma-white flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-400" /> Deudas a proveedores
            </h2>
            <Link href={`${base}/proveedores`} className="text-xs text-fma-cyan hover:underline">Ver todos →</Link>
          </div>
          {proveedoresDeuda.length === 0 && <div className="text-sm text-fma-white-soft/40 py-4">Sin deudas pendientes</div>}
          <div className="space-y-2">
            {proveedoresDeuda.map((p) => (
              <Link key={p.id} href={`${base}/proveedores/${p.id}`} className="flex items-center justify-between py-1.5 border-b border-fma-gray last:border-0 hover:bg-fma-black-3 -mx-2 px-2 rounded">
                <div className="text-sm text-fma-white">{p.nombre}</div>
                <div className="text-red-400 font-bold text-sm">${Number(p.saldo).toLocaleString('es-AR')}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {stockBajo.length > 0 && (
        <div className="card border border-red-500/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Stock bajo ({stockBajo.length})
            </h2>
            <Link href={`${base}/inventario`} className="text-xs text-fma-cyan hover:underline">Ver inventario →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {stockBajo.slice(0, 8).map((i) => (
              <div key={i.id} className="bg-fma-black-3 rounded p-2 flex items-center justify-between gap-2 text-sm">
                <div className="text-fma-white truncate">{i.nombre}</div>
                <div className="text-red-400 font-bold font-mono">{i.stock}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, href, delta, deltaPositive }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; href: string;
  delta?: string; deltaPositive?: boolean;
}) {
  return (
    <Link href={href} className="card hover:ring-2 hover:ring-fma-cyan/40 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs uppercase tracking-wide text-fma-white-soft/50">{label}</div>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {delta && <div className={`text-xs mt-1 ${deltaPositive ? 'text-green-400' : 'text-red-400'}`}>{delta}</div>}
    </Link>
  );
}
