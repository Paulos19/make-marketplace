import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },

        // Novas Cores "Zaca"
        'zaca-magenta': 'hsl(var(--zaca-magenta-hsl))',
        'zaca-roxo': 'hsl(var(--zaca-roxo-hsl))',
        'zaca-lilas': 'hsl(var(--zaca-lilas-hsl))',
        'zaca-azul': 'hsl(var(--zaca-azul-hsl))',
        'zaca-vermelho': 'hsl(var(--zaca-vermelho-hsl))',

        // Cores para botões específicos "Zaca" (para usar com bg-, text-, border-)
        'btn-fale-vendedor': {
          DEFAULT: 'hsl(var(--btn-fale-vendedor-bg))',
          foreground: 'hsl(var(--btn-fale-vendedor-text))', // para text-btn-fale-vendedor-foreground
        },
        'btn-fale-vendedor-hover': 'hsl(var(--btn-fale-vendedor-bg-hover))', // para hover:bg-btn-fale-vendedor-hover

        'btn-ver-perfil': { // Para usar como text-btn-ver-perfil e border-btn-ver-perfil
          DEFAULT: 'hsl(var(--btn-ver-perfil-text))', // Cor do texto e da borda no estado normal
          hover_bg: 'hsl(var(--btn-ver-perfil-bg-hover))', // Cor de fundo no hover para variant outline
          hover_text: 'hsl(var(--btn-ver-perfil-text-hover))', // Cor do texto no hover
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'], // Fonte principal (Inter)
        bangers: ['var(--font-bangers)', 'cursive'], // Nova fonte divertida
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;