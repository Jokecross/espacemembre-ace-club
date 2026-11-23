/** @type {import('tailwindcss').Config} */
// Charte ACE Club, la même que la page de vente (ace.css de la page) :
// fond #07090F, cartes #0E121C, un seul accent, le bleu du logo #7C9CFF.
// Archivo 800 élargie à 112 % pour les titres, Inter pour le reste.
// Les valeurs vivent dans les variables CSS de src/index.css (:root) ; ici,
// on ne fait que les nommer. Les noms sont ceux de l'espace d'origine
// (navy = titres, ink = texte…) : les écrans n'ont pas à changer.
const v = (nom) => `rgb(var(${nom}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: v('--rgb-text'),          // titres et texte fort  #F2F4F8
        ink: v('--rgb-text-2'),         // texte courant         #C9D1E3
        muted: v('--rgb-text-3'),       // texte secondaire      #98A2B6
        line: 'var(--color-line)',      // rgba(242,244,248,.09)
        'line-strong': 'var(--color-line-2)', // rgba(242,244,248,.16)
        accent: v('--rgb-accent'),      // le bleu du logo, seul accent
        'accent-light': v('--rgb-accent-hover'),
        'accent-pastel': 'var(--color-accent-soft)',
        'on-accent': v('--rgb-bg'),     // texte posé sur l'accent
        canvas: v('--rgb-bg'),          // fond de page
        surface: v('--rgb-surface'),    // cartes
        panel: v('--rgb-surface-2'),    // bloc dans une carte
        // Une seule couleur d'accent : ce qui est « fait » se dit en bleu.
        success: v('--rgb-accent'),
        'success-bg': 'var(--color-accent-soft)',
        // Les erreurs, et elles seules : #FFA3A3.
        red: {
          50: 'rgba(255,163,163,.08)',
          100: 'rgba(255,163,163,.14)',
          200: 'rgba(255,163,163,.32)',
          600: v('--rgb-error'),
          700: v('--rgb-error'),
        },
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        title: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: 'none',
        lift: '0 18px 40px rgba(0,0,0,.5)',
      },
    },
  },
  plugins: [],
}
