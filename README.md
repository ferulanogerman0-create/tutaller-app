# FMA Mecatrónica — Sistema de gestión

Aplicación web (PWA) para gestión integral del taller FMA. Reemplaza DIRUP.

## Stack

- Next.js 15 (App Router, Server Actions)
- React 19
- Tailwind CSS + Radix UI (componentes)
- Drizzle ORM + Postgres
- Auth: sesiones server-side con bcrypt + JWT (jose)
- TypeScript strict

## Brand

- Cyan FMA: `#00B4D8`
- Black: `#0A0A0A`
- White soft: `#F5F5F5`

## Módulos (orden implementación)

### MVP (semana 1-2)
- [x] Schema DB (clientes, vehículos, órdenes, items, caja, users)
- [ ] Auth + roles
- [ ] Layout app + sidebar
- [ ] CRUD Clientes
- [ ] CRUD Vehículos
- [ ] CRUD Órdenes + items + totales
- [ ] Caja movimientos básicos

### Iteración 2 (semana 3-4)
- [ ] Presupuestos → conversión a orden
- [ ] Calendario órdenes
- [ ] Cuentas corrientes
- [ ] Adjuntos imágenes
- [ ] PDF comprobante
- [ ] Notificación WA (Evolution API)

### Iteración 3 (semana 5+)
- [ ] Recordatorios
- [ ] Inventario completo
- [ ] Trabajadores + pagos + score
- [ ] Proveedores
- [ ] Gráficas + informes
- [ ] Importar / exportar
- [ ] Configuraciones avanzadas

## Setup

```bash
npm install
cp .env.example .env  # editar
npm run db:generate
npm run db:migrate
npm run dev
```

## Deploy

EasyPanel App en wolfdma:
- Source: GitHub `ferulanogerman0-create/fma-app`
- Build: Dockerfile
- Domain: `fma.wolfdma.website`
- Postgres: `fma-app-db` (instancia separada)
