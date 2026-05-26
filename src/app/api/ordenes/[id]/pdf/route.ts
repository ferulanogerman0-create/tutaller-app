import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { generarPdfOrden } from '@/lib/pdf/orden-pdf';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const oid = Number(id);
  if (!oid) return NextResponse.json({ error: 'bad id' }, { status: 400 });

  try {
    const buf = await generarPdfOrden(oid, user.tenantId);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="orden-${oid}.pdf"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
