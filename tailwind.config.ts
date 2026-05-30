import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:       '#0A0A0A',
          card:     '#141414',
          elevated: '#1E1E1E',
          accent:   '#D4F700',
          purple:   '#818CF8',
          danger:   '#EF4444',
          muted:    '#6B7280',
          text:     '#F9FAFB',
        },
      },
    },
  },
  plugins: [],
}
export default config
