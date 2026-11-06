import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins:[react()],
  build:{rollupOptions:{input:{main:'index.html',graph:'graph.html'},output:{manualChunks:{
    charts:['recharts'],tables:['@tanstack/react-table'],dialogs:['@radix-ui/react-dialog']
  }}}}
});
