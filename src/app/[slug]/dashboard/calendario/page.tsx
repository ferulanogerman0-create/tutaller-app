import Link from 'next/link';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { listTurnosSemana, createTurno, deleteTurno } from '@/lib/actions/turnos';
import { Trash2 } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function inicioSemana(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // lunes = 0
  x.setDate(x.getDate() - day);
  return x;
}

export default async function CalendarioPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ semana?: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const { semana } = await searchParams;
  const baseDate = semana ? new Date(semana) : new Date();
  const inicio = inicioSemana(baseDate);
  const me = await getSessionUser();
  const tid = me!.tenantId;
  const turnos = await listTurnosSemana(inicio);

  const clientes = await db.select({ id: schema.clientes.id, nombre: schema.clientes.nombre })
    .from(schema.clientes)
    .where(eq(schema.clientes.tenantId, tid))
    .orderBy(schema.clientes.nombre).limit(2000);
  const vehiculos = await db.select({ id: schema.vehiculos.id, dominio: schema.vehiculos.dominio })
    .from(schema.vehiculos)
    .where(eq(schema.vehiculos.tenantId, tid))
    .orderBy(schema.vehiculos.dominio).limit(2000);
  const tecnicos = await db.select({ id: schema.users.id, nombre: schema.users.nombre })
    .from(schema.users)
    .where(and(eq(schema.users.tenantId, tid), eq(schema.users.activo, true)));

  const dias: { fecha: Date; turnos: typeof turnos }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    const finD = new Date(d);
    finD.setDate(finD.getDate() + 1);
    dias.push({
      fecha: d,
      turnos: turnos.filter((t) => new Date(t.fechaInicio) >= d && new Date(t.fechaInicio) < finD),
    });
  }

  const prev = new Date(inicio); prev.setDate(prev.getDate() - 7);
  const next = new Date(inicio); next.setDate(next.getDate() + 7);

  return (
    <div className="p-6 max-w-[1600px]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-fma-white">Calendario</h1>
        <div className="flex gap-2">
          <Link href={`${base}/calendario?semana=${prev.toISOString()}`} className="btn-secondary text-sm">← Anterior</Link>
          <Link href={`${base}/calendario`} className="btn-secondary text-sm">Hoy</Link>
          <Link href={`${base}/calendario?semana=${next.toISOString()}`} className="btn-secondary text-sm">Siguiente →</Link>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-bold text-fma-white mb-3">Nuevo turno</h2>
        <form action={createTurno} className="grid grid-cols-4 gap-3">
          <input name="titulo" required placeholder="Título *" className="bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white col-span-2" />
          <input name="fechaInicio" type="datetime-local" required className="bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white" />
          <input name="fechaFin" type="datetime-local" className="bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white" />
          <select name="clienteId" className="bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white">
            <option value="">Cliente —</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select name="vehiculoId" className="bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white">
            <option value="">Vehículo —</option>
            {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.dominio}</option>)}
          </select>
          <select name="tecnicoId" className="bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white">
            <option value="">Técnico —</option>
            {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <button type="submit" className="btn-primary">Agendar</button>
        </form>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dias.map(({ fecha, turnos }, i) => {
          const esHoy = fecha.toDateString() === new Date().toDateString();
          return (
            <div key={i} className={`card p-3 min-h-[200px] ${esHoy ? 'ring-2 ring-fma-cyan' : ''}`}>
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-xs uppercase text-fma-white-soft/50">{DIAS[i]}</div>
                <div className="text-2xl font-bold text-fma-white">{fecha.getDate()}</div>
              </div>
              <div className="space-y-1.5">
                {turnos.map((t) => (
                  <div key={t.id} className="bg-fma-black-3 rounded p-2 text-xs">
                    <div className="font-semibold text-fma-white">{new Date(t.fechaInicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-fma-white-soft/80 truncate">{t.titulo}</div>
                    {t.cliente && <div className="text-fma-white-soft/50 truncate">{t.cliente.nombre}</div>}
                    {t.vehiculo && <div className="text-fma-cyan font-mono text-[10px]">{t.vehiculo.dominio}</div>}
                    <form action={deleteTurno.bind(null, t.id)} className="mt-1">
                      <button className="text-red-400 hover:text-red-300"><Trash2 className="h-3 w-3" /></button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
