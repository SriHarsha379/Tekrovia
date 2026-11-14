import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: [
        'src/components/__tests__/admin-assignment-editor.test.tsx',
        'src/components/__tests__/admin-lesson-editor.test.tsx',
        'src/components/__tests__/admin-project-editor.test.tsx',
        'src/components/__tests__/assessment-callbacks.test.tsx',
        'src/components/__tests__/assignments-panel.test.tsx',
        'src/components/__tests__/learning-hub-lessons.test.tsx',
        'src/components/__tests__/project-review-queue.test.tsx',
        'src/components/__tests__/projects-panel.test.tsx',
        'src/components/__tests__/readiness-checklist.test.tsx',
        'src/components/__tests__/review-page.test.tsx',
        'src/components/__tests__/review-queue.test.tsx',
        'src/components/__tests__/reviewer-link.test.tsx',
        'src/components/__tests__/review-page.test.tsx',
      ],
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
