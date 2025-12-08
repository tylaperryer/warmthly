import { defineConfig } from 'vite';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // Image optimization
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp', '**/*.svg'],
  css: {
    postcss: {
      // PostCSS configuration (includes Autoprefixer, Nesting, Container Queries)
      // This is safe and non-breaking - only enhances CSS
    },
    // CSS minification in production builds
    // Uses cssnano for optimal compression
    minify: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Entry points for each app
        main: resolve(__dirname, '../apps/main/index.html'),
        mint: resolve(__dirname, '../apps/mint/index.html'),
        post: resolve(__dirname, '../apps/post/index.html'),
        admin: resolve(__dirname, '../apps/admin/index.html'),
      },
      output: {
        // Code splitting configuration
        manualChunks: id => {
          // Split vendor chunks
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // Split lego components into separate chunks
          if (id.includes('/lego/components/')) {
            return 'components';
          }
          if (id.includes('/lego/utils/')) {
            return 'utils';
          }
          if (id.includes('/lego/config/')) {
            return 'config';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      plugins: [
        // Bundle size visualization (only in analyze mode)
        process.env.ANALYZE === 'true' &&
          visualizer({
            filename: './dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
      ].filter(Boolean),
    },
    // Tree shaking is enabled by default
    minify: 'terser',
    terserOptions: {
      compress: {
        // Keep console.error and console.warn for production debugging
        // Only remove console.log and console.debug
        drop_console: ['log', 'debug'],
        drop_debugger: true,
      },
    },
    // Source maps only in development (security: don't expose source in production)
    sourcemap: process.env.NODE_ENV === 'development',
    // Chunk size warning limit (in KB)
    // Performance budgets: warn if chunks exceed 1000KB
    chunkSizeWarningLimit: 1000,
    // Target modern browsers for smaller bundles
    target: 'es2022',
    // Optimize build performance
    reportCompressedSize: true,
    minifyInternalExports: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../'),
      '@lego': resolve(__dirname, '../lego'),
      '@components': resolve(__dirname, '../lego/components'),
      '@utils': resolve(__dirname, '../lego/utils'),
      '@config': resolve(__dirname, '../lego/config'),
      '@styles': resolve(__dirname, '../lego/styles'),
      '@core': resolve(__dirname, '../lego/core'),
      '@apps': resolve(__dirname, '../apps'),
      '@api': resolve(__dirname, '../api'),
      '@assets': resolve(__dirname, '../assets'),
      '@tests': resolve(__dirname, '../tests'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 3000,
  },
});
