import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ClienteForm } from '@/components/cliente-form';
import { createCliente } from '@/lib/actions/clientes';

export default async function NuevoClientePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const base = `/${slug}/dashboard`;
  return (
    <div className="p-8 max-w-4xl">
      <Link href={`${base}/clientes`} className="text-fma-white-soft/60 hover:text-fma-cyan inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="text-3xl font-bold text-fma-white mb-6">Nuevo cliente</h1>
      <ClienteForm action={createCliente} />
    </div>
  );
}
