module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'middleware/**/*.js',
        'queue/**/*.js',
        '!queue/worker.js',          // воркер — отдельный процесс, тестируется e2e
        '!**/node_modules/**'
    ],
    coverageReporters: ['text', 'text-summary', 'html'],
    coverageDirectory: 'coverage',
    clearMocks: true,
    verbose: true
};
