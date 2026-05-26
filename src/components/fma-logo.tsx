import { cn } from '@/lib/cn';

export function FmaLogo({ className }: { className?: string }) {
  // FMA brand: cyan F + white MA on dark circle
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-fma-black to-fma-black-2 flex items-center justify-center shadow-lg',
        className
      )}
    >
      <span className="font-black text-2xl tracking-tighter italic">
        <span className="text-fma-cyan">F</span>
        <span className="text-fma-white">MA</span>
      </span>
    </div>
  );
}
