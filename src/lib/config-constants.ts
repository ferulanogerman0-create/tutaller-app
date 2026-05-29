export const CONFIG_DEFAULTS = {
  taller_nombre: 'Tu Taller',
  taller_subtitulo: 'Mecánica · Diagnóstico',
  taller_direccion: '',
  taller_telefono: '',
  taller_email: '',
  taller_cuit: '',
  taller_horario: 'Lunes a viernes 8:00 a 17:00',

  iva_default: '21',
  punto_venta: '0001',

  pdf_footer: 'Gracias por confiar en nosotros.',

  wa_msg_orden: 'Hola {nombre}, tu comprobante {comprobante}.\n\nVehículo: {vehiculo}\nTotal: ${total}\n\nAdjuntamos el PDF. Cualquier consulta respondé este mensaje. ¡Gracias!',
  wa_msg_presupuesto: 'Hola {nombre}, te paso el presupuesto {comprobante} para tu {vehiculo}.\n\nTotal: ${total}\n\n¿Avanzamos? Cualquier duda respondé este mensaje.',
  wa_msg_recordatorio: 'Hola {nombre}, te recordamos que tu {vehiculo} tiene programado: {servicio}.\n\nCoordinemos turno respondiendo este mensaje. ¡Gracias!',

  cuotas_sin_interes_msg: '',

  telegram_alertas_enabled: 'false',
  telegram_chat_id: '',
  telegram_alerta_nueva_orden: 'true',
  telegram_alerta_pago_recibido: 'true',
  telegram_alerta_pago_min: '50000',
  telegram_alerta_stock_bajo: 'true',

  // WhatsApp grupos alerts — OFF por defecto. Cada tenant configura los suyos.
  wa_alertas_enabled: 'false',
  wa_grupo_taller: '',
  wa_grupo_turnos: '',
  wa_grupo_repuestos: '',
  wa_grupo_comunidad: '',
  wa_grupo_cierres: '',
  wa_alerta_nueva_orden_grupo: 'off',
  wa_alerta_pago_recibido_grupo: 'off',
  wa_alerta_stock_bajo_grupo: 'off',
  wa_alerta_completado_grupo: 'off',
  wa_alerta_referido_grupo: 'off',
  wa_alerta_cierre_grupo: 'off',

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
