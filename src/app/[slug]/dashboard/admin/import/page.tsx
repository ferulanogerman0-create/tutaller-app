import { getSessionUser } from '@/lib/auth';
import { getSlug } from '@/lib/actions/_ctx';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ fixed?: string; total?: string; missing?: string; notion?: string; updated?: string; skipped?: string; vehasoc?: string; vehsin?: string }> }) {
  const slug = await getSlug();
  const user = await getSessionUser();
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) redirect(`/${slug}/dashboard`);
  const { fixed, total, missing, notion, updated, skipped, vehasoc, vehsin } = await searchParams;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-fma-white mb-2">Importar datos DIRUP</h1>
      <p className="text-fma-white-soft/60 mb-6">Subí los .xls exportados de DIRUP (Herramientas → Exportar). Detecta tipo automáticamente y inserta/actualiza.</p>

      <form action="/api/import" method="POST" encType="multipart/form-data" className="card space-y-4">
        <div>
          <label className="block text-sm mb-2 text-fma-white-soft/80">Archivos DIRUP (.xls, múltiple)</label>
          <input
            type="file"
            name="files"
            multiple
            accept=".xls,.html,.htm"
            required
            className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white file:bg-fma-cyan file:text-fma-black file:border-0 file:rounded file:px-3 file:py-1 file:mr-3"
          />
        </div>
        <div className="text-xs text-fma-white-soft/60 space-y-1">
          <div>El sistema detecta automáticamente:</div>
          <ul className="list-disc pl-5 space-y-0.5">
            <li><strong>Clientes</strong> (id, dni, nombre, telefono...) → tabla clientes</li>
            <li><strong>Vehículos</strong> (dominio, marca, modelo) → tabla vehiculos</li>
            <li><strong>Inventario</strong> (precio_venta_bruto) → tabla inventario_items</li>
            <li><strong>Órdenes</strong> (comprobante, dni_cliente, dominio_vehiculo) → tabla ordenes</li>
            <li><strong>Movimientos caja</strong> (efectivo, fecha) → tabla caja_movimientos</li>
          </ul>
          <div className="pt-2">⚠️ Importá clientes y vehículos PRIMERO, después órdenes (necesitan FK).</div>
        </div>
        <button type="submit" className="btn-primary w-full">Importar archivos</button>
      </form>

      <div className="card mt-6">
        <h2 className="text-xl font-bold text-fma-white mb-2">Fijar estados según captura DIRUP</h2>
        <p className="text-fma-white-soft/60 text-sm mb-4">
          Aplica los estados exactos de las 11 órdenes visibles en la captura DIRUP (REPARADO / INGRESADO / EN REPARACION).
          Las demás órdenes no se tocan.
        </p>
        {fixed && (
          <div className="mb-3 p-3 rounded-md bg-green-600/20 border border-green-600/40 text-green-300 text-sm">
            OK — {fixed}/{total} órdenes actualizadas.
            {missing && missing.length > 0 && (
              <div className="mt-1 text-xs text-yellow-300">No encontradas: {missing}</div>
            )}
          </div>
        )}
        <FixEstadosButton />
      </div>

      <div className="card mt-6">
        <h2 className="text-xl font-bold text-fma-white mb-2">Asociar vehículos a clientes</h2>
        <p className="text-fma-white-soft/60 text-sm mb-4">
          DIRUP no exportó la relación vehículo→cliente. Deriva la asociación analizando órdenes existentes (cliente que más usó cada vehículo).
        </p>
        {vehasoc && (
          <div className="mb-3 p-3 rounded-md bg-green-600/20 border border-green-600/40 text-green-300 text-sm">
            OK — {vehasoc} vehículos asociados. {vehsin} aún sin cliente.
          </div>
        )}
        <form action="/api/admin/fix-vehiculo-cliente" method="POST">
          <button type="submit" className="btn-primary">Asociar vehículos a clientes</button>
        </form>
      </div>

      <div className="card mt-6 border border-red-500/40">
        <h2 className="text-xl font-bold text-fma-white mb-2">⚠ Nuke IVA — Resetear TODO a 0%</h2>
        <p className="text-fma-white-soft/60 text-sm mb-4">
          SQL directo: setea iva_pct=0 en TODOS los orden_items + inventario_items + recalcula totales de todas las órdenes. Irreversible.
        </p>
        <form action="/api/admin/nuke-iva" method="POST">
          <button type="submit" className="btn-primary">Nuke IVA → 0% (TODO)</button>
        </form>
      </div>

      <div className="card mt-6">
        <h2 className="text-xl font-bold text-fma-white mb-2">Aumentar precios inventario</h2>
        <p className="text-fma-white-soft/60 text-sm mb-4">
          Aumenta precios de items del inventario por un %. Sin deshacer — usar con cuidado.
        </p>
        <div className="flex flex-wrap gap-2">
          <form action="/api/admin/bump-precios?pct=5&tipo=servicio" method="POST">
            <button type="submit" className="btn-primary text-sm">+5% Servicios</button>
          </form>
          <form action="/api/admin/bump-precios?pct=5&tipo=repuesto" method="POST">
            <button type="submit" className="btn-primary text-sm">+5% Repuestos</button>
          </form>
          <form action="/api/admin/bump-precios?pct=5&tipo=todos" method="POST">
            <button type="submit" className="btn-secondary text-sm">+5% Todo</button>
          </form>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-xl font-bold text-fma-white mb-2">Importar Finanzas desde Notion</h2>
        <p className="text-fma-white-soft/60 text-sm mb-4">
          Importa movimientos de la DB &quot;Finanzas FMA&quot; (registrados vía Telegram bot) a caja.
          Necesita que la DB tenga compartida la integración &quot;contenido&quot;.
        </p>
        {notion && (
          <div className="mb-3 p-3 rounded-md bg-green-600/20 border border-green-600/40 text-green-300 text-sm">
            OK — {notion} insertados, {updated} actualizados, {skipped} saltados.
          </div>
        )}
        <form action="/api/admin/import-notion-finanzas" method="POST">
          <button type="submit" className="btn-primary">Importar Notion Finanzas</button>
        </form>
      </div>
    </div>
  );
}

function FixEstadosButton() {
  return (
    <form action="/api/admin/fix-ordenes-estado" method="POST">
      <button type="submit" className="btn-primary">Recalcular estados ahora</button>
    </form>
  );
}
