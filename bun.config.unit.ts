// Bun test configuration for unit tests
// Unit tests only count coverage for src/lib/ (pure code, target 100%)
// Test fixtures are excluded from coverage calculation

export default {
  test: {
    coverage: {
      // Only count src/lib/ for unit tests
      include: ['src/lib/**/*'],
      // Exclude test fixtures from coverage
      exclude: ['test/**/*', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
};
