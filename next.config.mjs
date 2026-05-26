/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
  // pdfkit needs its afm fonts at runtime; mark as external server pkg
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/ordenes/**': ['./node_modules/pdfkit/js/data/**'],
  },
};

export default nextConfig;
