import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // FMA brand
        fma: {
          cyan: '#00B4D8',
          'cyan-light': '#48CAE4',
          'cyan-dark': '#0077B6',
          black: '#0A0A0A',
          'black-2': '#141414',
          'black-3': '#1F1F1F',
          gray: '#2A2A2A',
          'gray-light': '#3A3A3A',
          white: '#FFFFFF',
          'white-soft': '#F5F5F5',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono'],
      },
    },
  },
  plugins: [],
};

export default config;
