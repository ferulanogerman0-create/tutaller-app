import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { listTrabajadores, createTrabajador, toggleTrabajadorActivo } from '@/lib/actions/trabajadores';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', mecanico: 'Mecánico', recepcion: 'Recepción', contable: 'Contable',
};
const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-fma-cyan text-fma-black',
  mecanico: 'bg-orange-500/30 text-orange-300',
  recepcion: 'bg-blue-500/30 text-blue-300',
  contable: 'bg-purple-500/30 text-purple-300',
};

export default async function TrabajadoresPage() {
  const me = await getSessionUser();
  if (!me) redirect('/login');
  if (me.role !== 'admin') redirect('/dashboard');

  const trabajadores = await listTrabajadores();

  return (
    <div className="p-6 max-w-[1200px]">
      <h1 className="text-3xl font-bold text-fma-white mb-6">Trabajadores</h1>

      <div className="card mb-6">
        <h2 className="text-xl font-bold text-fma-white mb-4">Nuevo trabajador</h2>
        <form action={createTrabajador} className="grid grid-cols-2 gap-4">
          <Input name="nombre" label="Nombre completo" required />
          <Input name="username" label="Usuario (login)" required />
          <Input name="email" label="Email" type="email" />
          <Input name="password" label="Contraseña" type="password" required />
          <div>
            <label className="block text-sm mb-1 text-fma-white-soft/80">Rol</label>
            <select name="role" defaultValue="mecanico" className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white">
              <option value="mecanico">Mecánico</option>
              <option value="recepcion">Recepción</option>
              <option value="contable">Contable</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="col-span-2">
            <button type="submit" className="btn-primary">Crear trabajador</button>
          </div>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-[1fr_180px_140px_180px_120px] gap-0 px-4 py-3 text-xs uppercase tracking-wide text-fma-white-soft/50 border-b border-fma-gray bg-fma-black-3">
          <div>Nombre</div>
          <div>Usuario</div>
          <div>Rol</div>
          <div>Email</div>
          <div>Estado</div>
        </div>
        {trabajadores.map((t) => (
          <div key={t.id} className="grid grid-cols-[1fr_180px_140px_180px_120px] gap-0 px-4 py-3 items-center border-b border-fma-gray hover:bg-fma-black-3">
            <div className="text-fma-white font-medium">{t.nombre}</div>
            <div className="text-fma-white-soft/80 font-mono text-sm">{t.username}</div>
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${ROLE_COLOR[t.role]}`}>
                {ROLE_LABEL[t.role]}
              </span>
            </div>
            <div className="text-fma-white-soft/60 text-sm truncate">{t.email || '—'}</div>
            <div>
              <form action={toggleTrabajadorActivo.bind(null, t.id)}>
                <button type="submit" className={`px-2 py-1 rounded text-xs font-semibold ${
                  t.activo ? 'bg-green-600/30 text-green-300 hover:bg-green-600/50' : 'bg-red-600/30 text-red-300 hover:bg-red-600/50'
                }`}>
                  {t.activo ? 'Activo' : 'Inactivo'}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({ name, label, type = 'text', required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm mb-1 text-fma-white-soft/80">{label}{required && ' *'}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full bg-fma-black-3 border border-fma-gray-light rounded-md px-3 py-2 text-fma-white"
      />
    </div>
  );
}
