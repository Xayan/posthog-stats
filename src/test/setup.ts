import '@testing-library/jest-dom'
import { vi } from 'vitest' // Import vi from vitest

// Mock fetch for testing
global.fetch = vi.fn()

// Helper to create a mocked fetch response
export const createMockResponse = (data: unknown, ok = true, status = 200): Response => {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    // Add other minimal required properties for a Response object for mocking purposes
    headers: new Headers(),
    redirected: false,
    url: 'mock-url',
    statusText: status.toString(),
    type: 'basic',
    clone: () => createMockResponse(data, ok, status), // Simple clone implementation
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}