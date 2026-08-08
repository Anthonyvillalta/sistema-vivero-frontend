/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vivero: {
          dark: '#1b4332',     // Verde Oscuro Bosque
          primary: '#2d6a4f',  // Verde Esmeralda Vivero
          emerald: '#40916c',  // Verde Hoja
          mint: '#52b788',     // Verde Menta
          light: '#74c69d',    // Verde Claro
          soft: '#d8f3dc',     // Menta Suave Fondo
          accent: '#ebf7ed',   // Blanco Menta
          earth: '#8d5b4c',    // Tono Tierra
          amber: '#e9c46a',    // Alertas Stock Bajo
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(27, 67, 50, 0.08)',
        'card': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'floating': '0 10px 25px -5px rgba(27, 67, 50, 0.2)',
      }
    },
  },
  plugins: [],
}
