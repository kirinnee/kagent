// Bun test configuration for integration tests
// Integration tests count coverage for all src/ (target 80%+)
// Test fixtures are excluded from coverage calculation

export default {
  test: {
    coverage: {
      // Count all src/ for integration tests
      include: ['src/**/*'],
      // Exclude test fixtures from coverage
      exclude: ['test/**/*', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
};
