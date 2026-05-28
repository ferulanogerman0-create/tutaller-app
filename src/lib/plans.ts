export const PLANS = {
  web: {
    name: 'Web',
    priceUSD: 50,
    priceARS: 50000,
    description: 'App completa — órdenes, caja, inventario, reportes PDF',
    features: ['App completa', '3 usuarios', 'Reportes PDF', 'Soporte email'],
  },
  bot: {
    name: 'Bot',
    priceUSD: 80,
    priceARS: 80000,
    description: 'Web + Bot WhatsApp con voz y texto',
    features: ['Todo Web', 'Bot WhatsApp', 'Voz + texto', '3 grupos WA', 'Soporte prioritario'],
  },
  enterprise: {
    name: 'Enterprise',
    priceUSD: 150,
    priceARS: 150000,
    description: 'Usuarios ilimitados, API, SLA garantizado',
    features: ['Todo Bot', 'Usuarios ilimitados', 'API acceso', 'SLA', 'Onboarding dedicado'],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
