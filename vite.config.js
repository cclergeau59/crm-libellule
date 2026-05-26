import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/crm-libellule/', // <-- AJOUTEZ CETTE LIGNE (le nom de votre dépôt entouré de slashes)
})