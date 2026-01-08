import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Charge les variables .env si elles existent
  // Use casting to any to bypass the missing 'cwd' property error on the process type in this context
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Injection sécurisée de la clé API
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill pour éviter que 'process' ne soit undefined dans certains navigateurs
      'process.env': {} 
    }
  };
});
