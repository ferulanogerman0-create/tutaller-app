import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FMA Mecatrónica',
  description: 'Sistema de gestión integral del taller — FMA Mecánica de Avanzada',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-fma-black text-fma-white-soft antialiased">
        {children}
      </body>
    </html>
  );
}
