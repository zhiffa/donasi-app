import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pastel-yellow-light': '#FDFD96',
        'pastel-yellow-dark': '#FAFAD2',
        'pastel-pink-light': '#FADADD',
        'pastel-pink-dark': '#FFB6C1',
        'white': '#FFFFFF',
      },
      backgroundImage: {
        'hero-pattern': "url('/images/hero-background.jpg')", // Ganti dengan path gambar hero Anda
      },
    },
  },
  plugins: [],
}
export default config