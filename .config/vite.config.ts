import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

// Plugin to resolve absolute paths starting with /
function resolveAbsolutePaths(): Plugin {
  const projectRoot = resolve(__dirname, '../');
  const resolvedPaths = new Map<string, string>(); // Map original ID to resolved path

  return {
    name: 'resolve-absolute-paths',
    enforce: 'pre', // Run before other plugins
    resolveId(id) {
      if (id.startsWith('/lego/') || id.startsWith('/apps/') || id.startsWith('/api/')) {
        // Resolve to actual file path
        const basePath = id.replace(/^\//, projectRoot);
        // Try .ts first, then .js
        if (basePath.endsWith('.js')) {
          const tsPath = basePath.replace(/\.js$/, '.ts');
          // Check if .ts file exists, otherwise use .js
          if (existsSync(tsPath)) {
            // Store the mapping from original to .ts path
            resolvedPaths.set(id, tsPath);
            resolvedPaths.set(basePath, tsPath);
            // Return the .ts path with a virtual ID that ends in .ts
            // This ensures Vite processes it as TypeScript
            return tsPath;
          }
          // If .ts doesn't exist, check if .js exists
          if (existsSync(basePath)) {
            resolvedPaths.set(id, basePath);
            return basePath;
          }
        } else if (basePath.endsWith('.ts')) {
          // Already a .ts path, check if it exists
          if (existsSync(basePath)) {
            resolvedPaths.set(id, basePath);
            return basePath;
          }
        } else {
          // No extension, try both
          if (existsSync(basePath + '.ts')) {
            const resolved = basePath + '.ts';
            resolvedPaths.set(id, resolved);
            return resolved;
          }
          if (existsSync(basePath + '.js')) {
            const resolved = basePath + '.js';
            resolvedPaths.set(id, resolved);
            return resolved;
          }
        }
      }
      // Also handle full Windows paths that end in .js
      if (id.startsWith(projectRoot) && id.endsWith('.js')) {
        const tsPath = id.replace(/\.js$/, '.ts');
        if (existsSync(tsPath)) {
          resolvedPaths.set(id, tsPath);
          return tsPath; // Return .ts path so Vite processes it correctly
        }
      }
      return null;
    },
    load(id) {
      // If this is a .ts file, let Vite handle it normally
      if (id.startsWith(projectRoot) && id.endsWith('.ts') && existsSync(id)) {
        return null; // Let Vite's TypeScript plugin handle it
      }

      // Intercept .js paths and return .ts content if it exists
      // This handles the case where Vite tries to load the .js path directly
      if (id.startsWith(projectRoot) && id.endsWith('.js')) {
        const tsPath = id.replace(/\.js$/, '.ts');
        if (existsSync(tsPath)) {
          // Return the .ts content - Vite will try to parse it as JS but should handle TS syntax
          // The key is that Vite's esbuild should detect and handle TypeScript syntax
          return readFileSync(tsPath, 'utf-8');
        }
        // If .ts doesn't exist, load the .js file
        if (existsSync(id)) {
          return readFileSync(id, 'utf-8');
        }
      }

      return null;
    },
  };
}

// Plugin to preserve /lego/ script tags in HTML
// Vite removes script tags it can't process, so we re-add them after build
function preserveLegoScripts(): Plugin {
  const legoScripts = new Map<string, string[]>(); // Map HTML file to script tags

  return {
    name: 'preserve-lego-scripts',
    enforce: 'pre', // Run before HTML processing
    transformIndexHtml(html: string, ctx) {
      // Extract /lego/ script tags before Vite removes them
      const legoScriptRegex = /<script[^>]*src=["'](\/lego\/[^"']+)["'][^>]*><\/script>/g;
      const scripts: string[] = [];
      let match;
      while ((match = legoScriptRegex.exec(html)) !== null) {
        scripts.push(match[0]);
      }

      if (scripts.length > 0 && ctx.filename) {
        legoScripts.set(ctx.filename, scripts);
      }

      return html;
    },
    writeBundle() {
      const distDir = resolve(__dirname, '../dist');

      // Lego directory is preserved by the build script (preserve-lego.ts)
      // which backs it up before vite build and restores it after

      // After bundle is written, re-add the script tags to HTML files
      const htmlFiles = [
        join(distDir, 'apps/main/index.html'),
        join(distDir, 'apps/mint/index.html'),
        join(distDir, 'apps/post/index.html'),
        join(distDir, 'apps/admin/index.html'),
      ];

      for (const htmlFile of htmlFiles) {
        if (existsSync(htmlFile)) {
          let html = readFileSync(htmlFile, 'utf-8');

          // Remove any existing /lego/ script tags that might be in wrong place
          html = html.replace(/<script[^>]*src=["']\/lego\/[^"']+["'][^>]*><\/script>\s*/g, '');

          // Find the closing </head> tag and insert scripts before it
          const headCloseIndex = html.indexOf('</head>');
          if (headCloseIndex !== -1) {
            // Get scripts for this file (match by checking if it's the right app)
            const appName = htmlFile.includes('/main/')
              ? 'main'
              : htmlFile.includes('/mint/')
                ? 'mint'
                : htmlFile.includes('/post/')
                  ? 'post'
                  : 'admin';

            // Find scripts from source HTML
            const sourceHtml = readFileSync(
              resolve(__dirname, `../apps/${appName}/index.html`),
              'utf-8'
            );
            const legoScriptRegex = /<script[^>]*src=["'](\/lego\/[^"']+)["'][^>]*><\/script>/g;
            const scripts: string[] = [];
            let match;
            while ((match = legoScriptRegex.exec(sourceHtml)) !== null) {
              scripts.push(match[0]);
            }

            if (scripts.length > 0) {
              const scriptsHtml = '\n  ' + scripts.join('\n  ') + '\n  ';
              html = html.slice(0, headCloseIndex) + scriptsHtml + html.slice(headCloseIndex);
              writeFileSync(htmlFile, html, 'utf-8');
            }
          }
        }
      }
    },
  };
}

export default defineConfig({
  // Image optimization
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp', '**/*.svg'],
  css: {
    postcss: {
      // PostCSS configuration (includes Autoprefixer, Nesting, Container Queries)
      // This is safe and non-breaking - only enhances CSS
    },
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
          // Default chunk
          return undefined;
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      plugins: [
        resolveAbsolutePaths(),
        preserveLegoScripts(),
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
      '/lego': resolve(__dirname, '../lego'),
      '/apps': resolve(__dirname, '../apps'),
      '/api': resolve(__dirname, '../api'),
    },
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 3000,
  },
});
