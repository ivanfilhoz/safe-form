import react from '@vitejs/plugin-react'
import path from 'path'
import rollupTs from 'rollup-plugin-typescript2'
import { PluginOption, defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    // Disable the following plugins if NODE_ENV is 'test'
    ...(process.env.NODE_ENV !== 'test'
      ? ([
          dts({ insertTypesEntry: true, include: ['./src'] }),
          {
            ...rollupTs({
              check: true,
              tsconfig: './tsconfig.json',
              tsconfigOverride: {
                noEmits: true
              },
              include: ['./src']
            }),
            enforce: 'pre'
          }
        ] satisfies PluginOption[])
      : [])
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      name: 'safe-form',
      fileName: (format) => `safe-form.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        format: 'es'
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts'
  }
})
