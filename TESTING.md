# PostHog Stats Testing Guide

This document outlines the comprehensive testing strategy for PostHog table collection logic and related services.

## Test Structure

### 1. Unit Tests (`src/services/__tests__/posthog.test.ts`)

Core functionality tests that verify the table collection logic works correctly:

- **Table Collection Logic**: Tests `fetchAvailableTables()` function
  - System tables are always included
  - Warehouse tables are merged correctly
  - Warehouse tables take precedence over system tables with same ID
  - Empty responses are handled gracefully
  - API errors are properly propagated

- **API Integration**: Tests API endpoint functions
  - `fetchSavedWarehouseQueries()` 
  - `fetchInsights()`
  - `runPostHogQuery()`

- **Error Handling**: Comprehensive error scenarios
  - Network failures
  - Authentication errors  
  - Malformed responses
  - Missing data fields

### 2. Edge Cases Tests (`src/services/__tests__/posthog.edge-cases.test.ts`)

Real-world scenarios and stress tests:

- **Data Structure Edge Cases**:
  - Special characters in table names (Unicode, emojis, symbols)
  - Extremely long names and IDs
  - Duplicate table names with different IDs
  - Numeric table names and IDs

- **API Response Edge Cases**:
  - Missing or null data fields
  - Nested data structures
  - Extra metadata fields
  - Performance under load

- **Query Execution Edge Cases**:
  - Complex HogQL queries
  - Unicode and special characters in queries
  - Empty result sets

### 3. Integration Tests (`src/services/__tests__/posthog.integration.test.ts`)

Real PostHog API integration tests (require environment variables):

- **Real API Testing**: Tests against actual PostHog instance
- **Data Consistency**: Ensures multiple calls return consistent results
- **Error Scenarios**: Tests invalid credentials and project IDs
- **Performance**: Validates response times and concurrent requests

## Running Tests

### Prerequisites

```bash
npm install
```

### Run All Tests

```bash
npm run test:run
```

### Run Tests in Watch Mode

```bash
npm run test
```

### Run Tests with UI

```bash
npm run test:ui
```

### Run Integration Tests

Integration tests require PostHog credentials. Set these environment variables:

```bash
export POSTHOG_PROJECT_ID="your-project-id"
export POSTHOG_PERSONAL_API_KEY="your-api-key"  
export POSTHOG_BASE_URL="https://app.posthog.com"  # or https://eu.posthog.com

npm run test:run
```

**Note**: Integration tests are automatically skipped if credentials are not provided.

## Test Coverage

The test suite covers:

### ✅ Core Functionality
- [x] System table definition and retrieval
- [x] Warehouse table API calls
- [x] Table merging logic (warehouse precedence)
- [x] API error handling and propagation
- [x] URL construction for different base URLs

### ✅ Edge Cases
- [x] Empty API responses
- [x] Malformed data structures
- [x] Network timeouts and failures
- [x] Special characters and Unicode in table names
- [x] Large datasets (1000+ tables)
- [x] Concurrent API calls
- [x] Memory efficiency with large data

### ✅ Real-world Scenarios
- [x] Authentication failures
- [x] Invalid project IDs
- [x] Complex HogQL query execution
- [x] Data consistency across multiple calls
- [x] Performance under stress

### ✅ API Integration
- [x] All PostHog API endpoints used by the application
- [x] Request/response format validation
- [x] Error message parsing
- [x] HTTP status code handling

## Manual Integration Testing

For manual testing with real PostHog data:

```typescript
import { runManualIntegrationTest } from './src/services/__tests__/posthog.integration.test'

// Set environment variables first, then run:
await runManualIntegrationTest()
```

This will:
1. Fetch real warehouse tables from your PostHog instance
2. Retrieve saved warehouse queries
3. Get insights data
4. Display results and validate data structure

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

- Environment: jsdom (for DOM-related tests)
- Global test utilities
- Path aliases (@/ for src/)
- Setup file for common test utilities

### Test Setup (`src/test/setup.ts`)

- Mock fetch function
- Helper utilities for creating mock responses
- Global test configuration

## Debugging Tests

### View Test Output
```bash
npm run test:run -- --reporter=verbose
```

### Run Specific Test File
```bash
npm run test:run src/services/__tests__/posthog.test.ts
```

### Run Specific Test Case
```bash
npm run test:run -t "should combine system tables and warehouse tables"
```

### Debug Mode
```bash
npm run test:run -- --no-coverage --reporter=verbose
```

## Adding New Tests

When adding new table collection functionality:

1. **Add unit tests** to `posthog.test.ts` for core logic
2. **Add edge case tests** to `posthog.edge-cases.test.ts` for unusual scenarios  
3. **Add integration tests** to `posthog.integration.test.ts` for real API validation
4. **Update this documentation** with new test coverage

### Test Pattern Example

```typescript
describe('New Feature', () => {
  it('should handle normal case', async () => {
    // Arrange
    const mockResponse = { results: [...] }
    mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse))
    
    // Act
    const result = await newFeatureFunction(mockConfig)
    
    // Assert
    expect(result).toEqual(expectedResult)
    expect(mockFetch).toHaveBeenCalledWith(expectedUrl, expectedOptions)
  })

  it('should handle error case', async () => {
    // Test error scenarios
    mockFetch.mockResolvedValueOnce(createMockResponse({}, false, 500))
    await expect(newFeatureFunction(mockConfig)).rejects.toThrow()
  })
})
```

## Test Performance Benchmarks

Current test performance expectations:
- Unit tests: < 50ms total
- Edge case tests: < 200ms total  
- Integration tests: < 30s total (when run with real API)

The test suite ensures the PostHog table collection logic remains robust and reliable across all scenarios.