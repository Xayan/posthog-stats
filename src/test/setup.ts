import '@testing-library/jest-dom'

// Mock fetch for testing
global.fetch = vi.fn()

// Helper to create a mocked fetch response
export const createMockResponse = (data: unknown, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response)
}