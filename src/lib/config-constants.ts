export const CONFIG_DEFAULTS = {
  taller_nombre: 'FMA Mecatrónica',
  taller_subtitulo: 'Mecánica · Mecatrónica · Diagnóstico',
  taller_direccion: 'Campana, Buenos Aires',
  taller_telefono: '+54 9 3489 681980',
  taller_email: '',
  taller_cuit: '',
  taller_horario: 'Lunes a viernes 7:00 a 16:00',

  iva_default: '21',
  punto_venta: '0001',

  pdf_footer: 'Gracias por confiar en FMA Mecatrónica.',

  wa_msg_orden: 'Hola {nombre}, tu comprobante {comprobante} de FMA Mecatrónica.\n\nVehículo: {vehiculo}\nTotal: ${total}\n\n💵 Pagando en efectivo te queda: ${neto}\n💳 Tenemos 6 cuotas sin interés con tarjetas Banco Provincia\n\nAdjuntamos el PDF. Cualquier consulta respondé este mensaje. ¡Gracias!',
  wa_msg_presupuesto: 'Hola {nombre}, te paso el presupuesto {comprobante} para tu {vehiculo}.\n\nTotal: ${total}\n\n💵 Pagando en efectivo: ${neto}\n💳 6 cuotas sin interés con tarjetas Banco Provincia\n\n¿Avanzamos? Cualquier duda respondé este mensaje.',
  wa_msg_recordatorio: 'Hola {nombre}, te recordamos que tu {vehiculo} tiene programado: {servicio}.\n\nCoordinemos turno respondiendo este mensaje. ¡Gracias!',

  cuotas_sin_interes_msg: '6 cuotas sin interés con tarjetas Banco Provincia',

  telegram_alertas_enabled: 'false',
  telegram_chat_id: '1147573365',
  telegram_alerta_nueva_orden: 'true',
  telegram_alerta_pago_recibido: 'true',
  telegram_alerta_pago_min: '50000',
  telegram_alerta_stock_bajo: 'true',

  // WhatsApp grupos alerts
  wa_alertas_enabled: 'true',
  wa_grupo_taller: '120363316797397699@g.us',
  wa_grupo_turnos: '120363418819807185@g.us',
  wa_grupo_repuestos: '120363402261653044@g.us',
  wa_grupo_comunidad: '120363421479631097@g.us',
  wa_grupo_cierres: '120363422742731242@g.us',
  wa_alerta_nueva_orden_grupo: 'turnos',
  wa_alerta_pago_recibido_grupo: 'off',
  wa_alerta_stock_bajo_grupo: 'repuestos',
  wa_alerta_completado_grupo: 'taller',
  wa_alerta_referido_grupo: 'taller',
  wa_alerta_cierre_grupo: 'cierres',

  // Cierres automáticos
  cierre_dia_corte: '5',

  // Auto-recordatorios
  recordatorio_auto_service_dias: '180',
  recordatorio_auto_service_km: '10000',
  recordatorio_auto_enabled: 'true',

  // Re-engagement clientes inactivos
  reengagement_meses_inactivo: '6',
  reengagement_enabled: 'true',
} as const;

export type ConfigKey = keyof typeof CONFIG_DEFAULTS;
