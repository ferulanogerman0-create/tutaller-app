'use client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const FMA_CYAN = '#00B4D8';
const COLORS = ['#00B4D8', '#0077B6', '#90E0EF', '#CAF0F8', '#48CAE4', '#0096C7', '#023E8A'];

export function FacturacionChart({ data }: { data: { mes: string; total: number; cantidad: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="mes" stroke="#888" fontSize={11} />
        <YAxis stroke="#888" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ background: '#1a1a1a', border: '1px solid #444', borderRadius: 6, color: '#fff' }}
          formatter={(v) => `$${Number(v).toLocaleString('es-AR')}`}
        />
        <Line type="monotone" dataKey="total" stroke={FMA_CYAN} strokeWidth={2} dot={{ fill: FMA_CYAN, r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EstadoPieChart({ data }: { data: { estado: string; cantidad: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="cantidad" nameKey="estado" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #444', color: '#fff' }} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#fff' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MarcasChart({ data }: { data: { marca: string; ordenes: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis type="number" stroke="#888" fontSize={11} />
        <YAxis type="category" dataKey="marca" stroke="#888" fontSize={11} />
        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #444', color: '#fff' }} />
        <Bar dataKey="ordenes" fill={FMA_CYAN} />
      </BarChart>
    </ResponsiveContainer>
  );
}
