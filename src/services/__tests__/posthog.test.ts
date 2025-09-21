import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest'
import { 
  fetchAvailableTables, 
  fetchSavedWarehouseQueries, 
  fetchInsights, 
  runPostHogQuery,
  TableInfo,
  SavedWarehouseQuery,
  Insight,
  HogQLQueryBody
} from '../posthog'
import { createMockResponse } from '../../test/setup'

// Mock fetch globally
const mockFetch = fetch as MockedFunction<typeof fetch>

describe('PostHog Service - Table Collection Logic', () => {
  const mockConfig = {
    projectId: 'test-project-123',
    apiKey: 'test-api-key',
    baseUrl: 'https://app.posthog.com'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchAvailableTables', () => {
    it('should combine system tables and warehouse tables successfully', async () => {
      const mockWarehouseResponse = {
        results: [
          { name: 'Custom Table 1', id: 'custom_table_1' },
          { name: 'External Source', id: 'external_source' }
        ]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))

      const result = await fetchAvailableTables(mockConfig)

      expect(result).toHaveLength(6) // 4 system + 2 warehouse
      
      // Check that system tables are present
      expect(result).toEqual(
        expect.arrayContaining([
          { name: 'Events', id: 'events' },
          { name: 'Persons', id: 'persons' },
          { name: 'Cohort People', id: 'cohort_people' },
          { name: 'Groups', id: 'groups' }
        ])
      )

      // Check that warehouse tables are present
      expect(result).toEqual(
        expect.arrayContaining([
          { name: 'Custom Table 1', id: 'custom_table_1' },
          { name: 'External Source', id: 'external_source' }
        ])
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.posthog.com/api/projects/test-project-123/warehouse_tables/',
        {
          headers: {
            'Authorization': 'Bearer test-api-key'
          }
        }
      )
    })

    it('should handle warehouse tables taking precedence over system tables', async () => {
      const mockWarehouseResponse = {
        results: [
          { name: 'Custom Events', id: 'events' }, // Override system events table
          { name: 'Custom Persons', id: 'persons' } // Override system persons table
        ]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))

      const result = await fetchAvailableTables(mockConfig)

      expect(result).toHaveLength(4) // 2 overridden + 2 remaining system tables
      
      // Warehouse tables should override system tables
      const eventsTable = result.find(table => table.id === 'events')
      const personsTable = result.find(table => table.id === 'persons')
      
      expect(eventsTable).toEqual({ name: 'Custom Events', id: 'events' })
      expect(personsTable).toEqual({ name: 'Custom Persons', id: 'persons' })
      
      // Other system tables should remain
      expect(result).toEqual(
        expect.arrayContaining([
          { name: 'Cohort People', id: 'cohort_people' },
          { name: 'Groups', id: 'groups' }
        ])
      )
    })

    it('should handle empty warehouse tables response', async () => {
      const mockWarehouseResponse = {
        results: []
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))

      const result = await fetchAvailableTables(mockConfig)

      expect(result).toHaveLength(4) // Only system tables
      expect(result).toEqual([
        { name: 'Events', id: 'events' },
        { name: 'Persons', id: 'persons' },
        { name: 'Cohort People', id: 'cohort_people' },
        { name: 'Groups', id: 'groups' }
      ])
    })

    it('should handle API errors from warehouse tables endpoint', async () => {
      const mockErrorResponse = {
        detail: 'Authentication failed'
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockErrorResponse, false, 401))

      await expect(fetchAvailableTables(mockConfig)).rejects.toThrow(
        'Authentication failed'
      )
    })

    it('should handle generic API errors from warehouse tables endpoint', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, false, 500))

      await expect(fetchAvailableTables(mockConfig)).rejects.toThrow(
        'Failed to fetch warehouse tables. Check your credentials and permissions.'
      )
    })

    it('should handle malformed warehouse table responses', async () => {
      const mockMalformedResponse = {
        results: [
          { name: 'Valid Table', id: 'valid_table' },
          { name: null, id: 'invalid_name' }, // Invalid name
          { id: 'missing_name' }, // Missing name
          { name: 'Missing ID' } // Missing id
        ]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockMalformedResponse))

      const result = await fetchAvailableTables(mockConfig)

      // Should handle the malformed data gracefully
      // 4 system tables + 4 warehouse tables (including malformed ones which still get mapped)
      expect(result).toHaveLength(8)
      
      const validTable = result.find(table => table.id === 'valid_table')
      expect(validTable).toEqual({ name: 'Valid Table', id: 'valid_table' })
    })

    it('should handle different base URL formats correctly', async () => {
      const configs = [
        { ...mockConfig, baseUrl: 'https://eu.posthog.com' },
        { ...mockConfig, baseUrl: 'https://app.posthog.com/' }, // With trailing slash
        { ...mockConfig, baseUrl: 'https://custom.posthog.instance.com' }
      ]

      const mockWarehouseResponse = { results: [] }

      for (const config of configs) {
        mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))
        
        await fetchAvailableTables(config)
        
        const expectedUrl = config.baseUrl.endsWith('/') 
          ? `${config.baseUrl}api/projects/${config.projectId}/warehouse_tables/`
          : `${config.baseUrl}/api/projects/${config.projectId}/warehouse_tables/`
        
        expect(mockFetch).toHaveBeenCalledWith(
          expectedUrl,
          expect.any(Object)
        )
      }
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(fetchAvailableTables(mockConfig)).rejects.toThrow('Network error')
    })
  })

  describe('fetchSavedWarehouseQueries', () => {
    it('should fetch saved warehouse queries successfully', async () => {
      const mockResponse = {
        results: [
          {
            id: 'query-1',
            name: 'Test Query 1',
            query: { query: 'SELECT * FROM events' }
          },
          {
            id: 'query-2', 
            name: 'Test Query 2',
            query: { query: 'SELECT * FROM persons' }
          }
        ]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await fetchSavedWarehouseQueries(mockConfig)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'query-1',
        name: 'Test Query 1',
        query: { query: 'SELECT * FROM events' }
      })
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.posthog.com/api/projects/test-project-123/warehouse_saved_queries/',
        {
          headers: {
            'Authorization': 'Bearer test-api-key'
          }
        }
      )
    })

    it('should handle API errors', async () => {
      const mockErrorResponse = {
        detail: 'Project not found'
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockErrorResponse, false, 404))

      await expect(fetchSavedWarehouseQueries(mockConfig)).rejects.toThrow('Project not found')
    })
  })

  describe('fetchInsights', () => {
    it('should fetch insights successfully', async () => {
      const mockResponse = {
        results: [
          {
            id: 1,
            name: 'Test Insight 1',
            short_id: 'insight1',
            query: { some: 'query data' }
          }
        ]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse))

      const result = await fetchInsights(mockConfig)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 1,
        name: 'Test Insight 1', 
        short_id: 'insight1',
        query: { some: 'query data' }
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.posthog.com/api/projects/test-project-123/insights/?limit=100',
        {
          headers: {
            'Authorization': 'Bearer test-api-key'
          }
        }
      )
    })
  })

  describe('runPostHogQuery', () => {
    it('should run HogQL queries successfully', async () => {
      const mockQueryResult = {
        columns: ['event', 'count'],
        results: [['pageview', 100], ['click', 50]]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockQueryResult))

      const query: HogQLQueryBody = {
        kind: 'HogQLQuery',
        query: 'SELECT event, count() FROM events GROUP BY event'
      }

      const result = await runPostHogQuery({
        ...mockConfig,
        query
      })

      expect(result).toEqual(mockQueryResult)
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.posthog.com/api/projects/test-project-123/query',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        }
      )
    })

    it('should handle query execution errors', async () => {
      const mockErrorResponse = {
        detail: 'Invalid query syntax'
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockErrorResponse, false, 400))

      const query: HogQLQueryBody = {
        kind: 'HogQLQuery',
        query: 'INVALID SQL'
      }

      await expect(runPostHogQuery({
        ...mockConfig,
        query
      })).rejects.toThrow('Invalid query syntax')
    })
  })

  describe('Edge Cases and Integration', () => {
    it('should handle concurrent table fetching requests', async () => {
      const mockWarehouseResponse = {
        results: [{ name: 'Test Table', id: 'test_table' }]
      }

      // Mock multiple responses for concurrent requests
      mockFetch
        .mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))
        .mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))

      const promises = [
        fetchAvailableTables(mockConfig),
        fetchAvailableTables(mockConfig)
      ]

      const results = await Promise.all(promises)

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual(results[1]) // Both should return same data
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle very large warehouse table responses', async () => {
      // Create a large number of mock tables
      const largeMockResponse = {
        results: Array.from({ length: 1000 }, (_, i) => ({
          name: `Table ${i}`,
          id: `table_${i}`
        }))
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(largeMockResponse))

      const result = await fetchAvailableTables(mockConfig)

      expect(result).toHaveLength(1004) // 1000 warehouse + 4 system tables
      
      // Check first few and last few tables
      expect(result[0]).toEqual({ name: 'Events', id: 'events' }) // System table should be first
      expect(result).toContainEqual({ name: 'Table 0', id: 'table_0' })
      expect(result).toContainEqual({ name: 'Table 999', id: 'table_999' })
    })

    it('should handle empty string base URLs', async () => {
      const configWithEmptyUrl = {
        ...mockConfig,
        baseUrl: ''
      }

      const mockWarehouseResponse = { results: [] }
      mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))

      await fetchAvailableTables(configWithEmptyUrl)

      expect(mockFetch).toHaveBeenCalledWith(
        'projects/test-project-123/warehouse_tables/',
        expect.any(Object)
      )
    })
  })
})