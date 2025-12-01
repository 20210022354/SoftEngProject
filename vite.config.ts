import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
build: {
    // 1. Keep the limit high just in case
    chunkSizeWarningLimit: 2000, 

    // 2. Configure the Split (The real fix)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split Firebase into its own file (usually the biggest chunk)
            if (id.includes('firebase')) {
              return 'firebase';
            }
            // Split React into its own file
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            // Split UI libraries (Radix/Lucide/Shadcn)
            if (id.includes('@radix-ui') || id.includes('lucide') || id.includes('class-variance-authority')) {
              return 'ui-vendor';
            }
            // Put everything else in a generic vendor file
            return 'vendor';
          }
        },
      },
    },
  },
}));
