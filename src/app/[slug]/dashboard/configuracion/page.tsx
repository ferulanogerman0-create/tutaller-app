import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getAllConfig, setConfig } from '@/lib/actions/config';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  const me = await getSessionUser();
  if (!me) redirect(`/${slug}/login`);
  if (me.role !== 'owner' && me.role !== 'admin') redirect(base);

  const cfg = await getAllConfig();

  return (
    <div className="p-6 max-w-[1000px]">
      <h1 className="text-3xl font-bold text-fma-white mb-6">Configuración</h1>

      <form action={setConfig} className="space-y-6">
        <Section title="Datos del taller">
          <Field name="taller_nombre" label="Nombre del taller" value={cfg.taller_nombre} />
          <Field name="taller_subtitulo" label="Subtítulo / rubro" value={cfg.taller_subtitulo} />
          <Field name="taller_direccion" label="Dirección" value={cfg.taller_direccion} />
          <Field name="taller_telefono" label="Teléfono" value={cfg.taller_telefono} />
          <Field name="taller_email" label="Email" value={cfg.taller_email} />
          <Field name="taller_cuit" label="CUIT" value={cfg.taller_cuit} />
          <Field name="taller_horario" label="Horario" value={cfg.taller_horario} />
        </Section>

        <Section title="Comprobantes">
          <Field name="punto_venta" label="Punto de venta (4 dígitos)" value={cfg.punto_venta} />
          <Field name="iva_default" label="IVA default (%)" value={cfg.iva_default} type="number" />
          <Field name="pdf_footer" label="Footer del PDF" value={cfg.pdf_footer} textarea />
        </Section>

        <Section title="Mensajes WhatsApp">
          <p className="text-xs text-fma-white-soft/50 mb-2">
            Variables disponibles: {'{nombre}'}, {'{comprobante}'}, {'{vehiculo}'}, {'{total}'}, {'{neto}'}, {'{servicio}'}
          </p>
          <Field name="wa_msg_orden" label="Mensaje orden enviada" value={cfg.wa_msg_orden} textarea rows={6} />
          <Field name="wa_msg_presupuesto" label="Mensaje presupuesto enviado" value={cfg.wa_msg_presupuesto} textarea rows={5} />
          <Field name="wa_msg_recordatorio" label="Mensaje recordatorio service" value={cfg.wa_msg_recordatorio} textarea rows={4} />
          <Field name="cuotas_sin_interes_msg" label="Texto cuotas" value={cfg.cuotas_sin_interes_msg} />
        </Section>

        <Section title="Re-engagement clientes inactivos">
          <p className="text-xs text-fma-white-soft/50 mb-2">
            Detecta clientes sin órdenes hace N meses y crea recordatorio para re-contactar.
            Disparar via cron `/api/cron/reengagement` con `x-cron-secret`.
          </p>
          <Field name="reengagement_enabled" label="Habilitado (true/false)" value={cfg.reengagement_enabled} />
          <Field name="reengagement_meses_inactivo" label="Meses inactivo para alertar" value={cfg.reengagement_meses_inactivo} type="number" />
        </Section>

        <Section title="Auto-recordatorios service">
          <p className="text-xs text-fma-white-soft/50 mb-2">
            Cuando se entrega una orden con concepto SERVICE / MANTENIMIENTO / REVISION, se crea recordatorio automático para próximo service.
          </p>
          <Field name="recordatorio_auto_enabled" label="Habilitado (true/false)" value={cfg.recordatorio_auto_enabled} />
          <Field name="recordatorio_auto_service_dias" label="Días para próximo service" value={cfg.recordatorio_auto_service_dias} type="number" />
          <Field name="recordatorio_auto_service_km" label="KM adicionales para próximo service" value={cfg.recordatorio_auto_service_km} type="number" />
        </Section>

        <Section title="Alertas WhatsApp (grupos)">
          <p className="text-xs text-fma-white-soft/50 mb-2">
            Bot Evolution manda alerts a grupos WhatsApp. Cada tipo → un grupo. Tag valores: <code className="text-fma-cyan">taller / turnos / repuestos / comunidad</code>
          </p>
          <Field name="wa_alertas_enabled" label="Habilitado (true/false)" value={cfg.wa_alertas_enabled} />
          <Field name="wa_grupo_taller" label="Grupo Taller (JID)" value={cfg.wa_grupo_taller} />
          <Field name="wa_grupo_turnos" label="Grupo Turnos (JID)" value={cfg.wa_grupo_turnos} />
          <Field name="wa_grupo_repuestos" label="Grupo Repuestos (JID)" value={cfg.wa_grupo_repuestos} />
          <Field name="wa_grupo_comunidad" label="Grupo Comunidad (JID)" value={cfg.wa_grupo_comunidad} />
          <Field name="wa_grupo_cierres" label="Grupo Cierres (JID)" value={cfg.wa_grupo_cierres} />
          <Field name="wa_alerta_nueva_orden_grupo" label="Nueva orden → tag grupo" value={cfg.wa_alerta_nueva_orden_grupo} />
          <Field name="wa_alerta_pago_recibido_grupo" label="Pago recibido → tag grupo" value={cfg.wa_alerta_pago_recibido_grupo} />
          <Field name="wa_alerta_stock_bajo_grupo" label="Stock bajo → tag grupo" value={cfg.wa_alerta_stock_bajo_grupo} />
          <Field name="wa_alerta_completado_grupo" label="Premio completado → tag grupo" value={cfg.wa_alerta_completado_grupo} />
          <Field name="wa_alerta_referido_grupo" label="Nuevo referido → tag grupo" value={cfg.wa_alerta_referido_grupo} />
          <Field name="wa_alerta_cierre_grupo" label="Cierres diario/semanal/mensual → tag grupo" value={cfg.wa_alerta_cierre_grupo} />
          <Field name="cierre_dia_corte" label="Día de corte cierre mensual (5 al 5 = 5)" value={cfg.cierre_dia_corte} type="number" />
        </Section>

        <Section title="Alertas Telegram (legacy)">
          <Field name="telegram_alertas_enabled" label="Habilitado (true/false)" value={cfg.telegram_alertas_enabled} />
          <Field name="telegram_chat_id" label="Chat ID destino" value={cfg.telegram_chat_id} />
          <Field name="telegram_alerta_nueva_orden" label="Notificar nueva orden (true/false)" value={cfg.telegram_alerta_nueva_orden} />
          <Field name="telegram_alerta_pago_recibido" label="Notificar pago recibido (true/false)" value={cfg.telegram_alerta_pago_recibido} />
          <Field name="telegram_alerta_pago_min" label="Monto mínimo para notificar pago ($)" value={cfg.telegram_alerta_pago_min} type="number" />
          <Field name="telegram_alerta_stock_bajo" label="Notificar stock bajo (true/false)" value={cfg.telegram_alerta_stock_bajo} />
        </Section>

        <div className="flex justify-end sticky bottom-0 bg-fma-black/80 backdrop-blur p-3 border-t border-fma-gray -mx-6">
          <button type="submit" className="btn-primary">Guardar configuración</button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-fma-white mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ name, label, value, type = 'text', textarea, rows = 3 }: {
  name: string; label: string; value: string; type?: string; textarea?: boolean; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-fma-white-soft/60 mb-1">{label}</label>
      {textarea ? (
        <textarea name={name} rows={rows} defaultValue={value}
          className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white text-sm font-mono" />
      ) : (
        <input name={name} type={type} defaultValue={value}
          className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white" />
      )}
    </div>
  );
}
