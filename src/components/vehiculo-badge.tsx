import { cn } from '@/lib/cn';

// Mapeo marca → color brand
const BRAND_COLORS: Record<string, string> = {
  Volkswagen: '#001A5E',
  Toyota: '#EB0A1E',
  Ford: '#003478',
  Chevrolet: '#FFC72C',
  Fiat: '#A02838',
  Peugeot: '#1B265E',
  Renault: '#FFC900',
  Citroen: '#8A1538',
  Citroën: '#8A1538',
  Honda: '#CC0000',
  Nissan: '#C3002F',
  Hyundai: '#002C5F',
  Kia: '#05141F',
  Mercedes: '#00ADEF',
  'Mercedes-Benz': '#00ADEF',
  BMW: '#1C69D4',
  Audi: '#BB0A30',
  Chery: '#E60012',
  Jeep: '#3A6E2A',
  Suzuki: '#1E4FAE',
  Subaru: '#0033A0',
  Mitsubishi: '#E60012',
  Mazda: '#101010',
  RAM: '#D9241F',
};

export function VehiculoBadge({ marca, size = 36 }: { marca: string | null; size?: number }) {
  const color = (marca && BRAND_COLORS[marca]) || '#3A3A3A';
  const initial = (marca || '?').charAt(0).toUpperCase();
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-fma-black')}
      style={{ background: color, width: size, height: size, fontSize: size * 0.42 }}
      title={marca || 'Sin marca'}
    >
      {initial}
    </div>
  );
}
