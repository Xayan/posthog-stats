import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest'
import { fetchAvailableTables, runPostHogQuery, HogQLQueryBody } from '../posthog'
import { createMockResponse } from '../../test/setup'

const mockFetch = fetch as MockedFunction<typeof fetch>

describe('PostHog Service - Edge Cases and Performance Tests', () => {
  const mockConfig = {
    projectId: 'test-project-123',
    apiKey: 'test-api-key',
    baseUrl: 'https://app.posthog.com'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Real-world Data Structure Edge Cases', () => {
    it('should handle warehouse tables with special characters in names', async () => {
      const mockWarehouseResponse = {
        results: [
          { name: 'My-Special_Table!', id: 'my_special_table' },
          { name: 'Table with spaces', id: 'table_with_spaces' },
          { name: 'Table@#$%^&*()', id: 'table_symbols' },
          { name: '数据库表', id: 'chinese_table' }, // Chinese characters
          { name: 'émoji-table 🚀', id: 'emoji_table' },
        ]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))

      const result = await fetchAvailableTables(mockConfig)

      expect(result).toHaveLength(9) // 4 system + 5 special character tables
      expect(result).toEqual(
        expect.arrayContaining([
          { name: 'My-Special_Table!', id: 'my_special_table' },
          { name: 'Table with spaces', id: 'table_with_spaces' },
          { name: 'Table@#$%^&*()', id: 'table_symbols' },
          { name: '数据库表', id: 'chinese_table' },
          { name: 'émoji-table 🚀', id: 'emoji_table' },
        ])
      )
    })

    it('should handle extremely long table names and IDs', async () => {
      const longName = 'A'.repeat(1000) // 1000 character name
      const longId = 'a'.repeat(500) // 500 character ID
      
      const mockWarehouseResponse = {
        results: [
          { name: longName, id: longId },
          { name: 'Normal Table', id: 'normal_table' }
        ]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))

      const result = await fetchAvailableTables(mockConfig)

      expect(result).toHaveLength(6) // 4 system + 2 warehouse
      
      const longTable = result.find(table => table.id === longId)
      expect(longTable).toEqual({ name: longName, id: longId })
    })

    it('should handle warehouse tables with identical names but different IDs', async () => {
      const mockWarehouseResponse = {
        results: [
          { name: 'Duplicate Name', id: 'duplicate_1' },
          { name: 'Duplicate Name', id: 'duplicate_2' },
          { name: 'Duplicate Name', id: 'duplicate_3' }
        ]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))

      const result = await fetchAvailableTables(mockConfig)

      expect(result).toHaveLength(7) // 4 system + 3 duplicates
      
      // All duplicate tables should be present with unique IDs
      expect(result).toEqual(
        expect.arrayContaining([
          { name: 'Duplicate Name', id: 'duplicate_1' },
          { name: 'Duplicate Name', id: 'duplicate_2' },
          { name: 'Duplicate Name', id: 'duplicate_3' }
        ])
      )
    })

    it('should handle tables with numeric IDs and names', async () => {
      const mockWarehouseResponse = {
        results: [
          { name: '12345', id: '12345' },
          { name: '99.5', id: '99_5' },
          { name: '0', id: '0' },
          { name: '-123', id: 'negative_123' }
        ]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))

      const result = await fetchAvailableTables(mockConfig)

      expect(result).toHaveLength(8) // 4 system + 4 numeric
      expect(result).toEqual(
        expect.arrayContaining([
          { name: '12345', id: '12345' },
          { name: '99.5', id: '99_5' },
          { name: '0', id: '0' },
          { name: '-123', id: 'negative_123' }
        ])
      )
    })
  })

  describe('API Response Edge Cases', () => {
    it('should handle responses with missing results array', async () => {
      const mockInvalidResponse = {
        // Missing 'results' array
        data: []
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockInvalidResponse))

      // Should throw an error when trying to access .results
      await expect(fetchAvailableTables(mockConfig)).rejects.toThrow()
    })

    it('should handle responses with null results', async () => {
      const mockNullResponse = {
        results: null
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockNullResponse))

      // Should throw an error when trying to map over null
      await expect(fetchAvailableTables(mockConfig)).rejects.toThrow()
    })

    it('should handle responses with nested data structures', async () => {
      const mockNestedResponse = {
        results: [
          {
            name: 'Complex Table',
            id: 'complex_table',
            metadata: {
              schema: { columns: ['col1', 'col2'] },
              lastUpdated: '2024-01-01'
            },
            permissions: {
              read: true,
              write: false
            }
          }
        ]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockNestedResponse))

      const result = await fetchAvailableTables(mockConfig)

      expect(result).toHaveLength(5) // 4 system + 1 complex
      
      // Should only extract name and id, ignoring nested data
      const complexTable = result.find(table => table.id === 'complex_table')
      expect(complexTable).toEqual({ name: 'Complex Table', id: 'complex_table' })
    })

    it('should handle very slow API responses', async () => {
      const mockWarehouseResponse = {
        results: [{ name: 'Slow Table', id: 'slow_table' }]
      }

      // Simulate slow response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => {
          setTimeout(() => resolve(createMockResponse(mockWarehouseResponse)), 150)
        })
      )

      const startTime = Date.now()
      const result = await fetchAvailableTables(mockConfig)
      const endTime = Date.now()

      // Allow for timing variance but ensure it took some time (at least 100ms)
      expect(endTime - startTime).toBeGreaterThanOrEqual(100)
      expect(result).toHaveLength(5) // 4 system + 1 slow table
    })

    it('should handle API responses with extra fields', async () => {
      const mockWarehouseResponse = {
        results: [
          {
            name: 'Extended Table',
            id: 'extended_table',
            type: 'external',
            source: 'postgresql',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            row_count: 1000000,
            size_bytes: 500000000
          }
        ],
        count: 1,
        next: null,
        previous: null
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))

      const result = await fetchAvailableTables(mockConfig)

      expect(result).toHaveLength(5) // 4 system + 1 extended
      
      // Should only use name and id fields
      const extendedTable = result.find(table => table.id === 'extended_table')
      expect(extendedTable).toEqual({ name: 'Extended Table', id: 'extended_table' })
      expect(extendedTable).not.toHaveProperty('type')
      expect(extendedTable).not.toHaveProperty('source')
    })
  })

  describe('Performance and Stress Tests', () => {
    it('should handle rapid consecutive calls efficiently', async () => {
      const mockWarehouseResponse = {
        results: [{ name: 'Test Table', id: 'test_table' }]
      }

      // Mock 10 rapid calls
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))
      }

      const startTime = Date.now()
      
      // Make 10 rapid consecutive calls
      const promises = Array.from({ length: 10 }, () => fetchAvailableTables(mockConfig))
      const results = await Promise.all(promises)
      
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(results[0])
        expect(result).toHaveLength(5) // 4 system + 1 test table
      })

      // Should complete all calls within reasonable time (less than 1 second in mock)
      expect(totalTime).toBeLessThan(1000)
      expect(mockFetch).toHaveBeenCalledTimes(10)
    })

    it('should handle memory efficiently with large table names', async () => {
      const largeTableData = Array.from({ length: 100 }, (_, i) => ({
        name: `Very Long Table Name That Contains Lots Of Characters ${i}`.repeat(10),
        id: `very_long_table_id_${i}`
      }))

      const mockWarehouseResponse = {
        results: largeTableData
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockWarehouseResponse))

      const result = await fetchAvailableTables(mockConfig)

      expect(result).toHaveLength(104) // 4 system + 100 large tables
      
      // Verify structure is maintained even with large data
      result.forEach(table => {
        expect(table).toHaveProperty('name')
        expect(table).toHaveProperty('id')
        expect(typeof table.name).toBe('string')
        expect(typeof table.id).toBe('string')
      })
    })
  })

  describe('Query Execution Edge Cases', () => {
    it('should handle HogQL queries with complex syntax', async () => {
      const complexQuery: HogQLQueryBody = {
        kind: 'HogQLQuery',
        query: `
          SELECT 
            event,
            count() as event_count,
            uniq(person_id) as unique_users,
            avg(toFloat64(properties.session_duration)) as avg_duration
          FROM events 
          WHERE 
            timestamp >= today() - INTERVAL 30 DAY
            AND event IN ('pageview', 'click', 'submit')
            AND properties.utm_source IS NOT NULL
          GROUP BY event
          HAVING event_count > 100
          ORDER BY event_count DESC
          LIMIT 50
        `
      }

      const mockQueryResult = {
        columns: ['event', 'event_count', 'unique_users', 'avg_duration'],
        results: [
          ['pageview', 5000, 1200, 45.2],
          ['click', 2000, 800, 12.1],
          ['submit', 150, 120, 8.5]
        ]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockQueryResult))

      const result = await runPostHogQuery({
        ...mockConfig,
        query: complexQuery
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
          body: JSON.stringify({ query: complexQuery })
        }
      )
    })

    it('should handle queries with special characters and Unicode', async () => {
      const unicodeQuery: HogQLQueryBody = {
        kind: 'HogQLQuery',
        query: `SELECT event FROM events WHERE properties.title LIKE '%测试%' OR properties.title LIKE '%🚀%'`
      }

      const mockQueryResult = {
        columns: ['event'],
        results: [['测试事件'], ['🚀 launch']]
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockQueryResult))

      const result = await runPostHogQuery({
        ...mockConfig,
        query: unicodeQuery
      })

      expect(result).toEqual(mockQueryResult)
    })

    it('should handle empty query results', async () => {
      const emptyQuery: HogQLQueryBody = {
        kind: 'HogQLQuery',
        query: 'SELECT * FROM events WHERE 1=0' // Query that returns no results
      }

      const mockEmptyResult = {
        columns: ['event', 'timestamp', 'person_id'],
        results: []
      }

      mockFetch.mockResolvedValueOnce(createMockResponse(mockEmptyResult))

      const result = await runPostHogQuery({
        ...mockConfig,
        query: emptyQuery
      })

      expect(result).toEqual(mockEmptyResult)
      expect(result.results).toHaveLength(0)
    })
  })
})