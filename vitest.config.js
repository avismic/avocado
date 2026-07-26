import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      name: 'css-test-mock',
      transform(code, id) {
        if (id.endsWith('.css')) {
          return { code: 'export default {};', map: null };
        }
      }
    }
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    globals: true
  }
});
