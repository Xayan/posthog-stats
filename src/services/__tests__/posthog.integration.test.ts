import { describe, it, expect, beforeAll } from 'vitest'
import { fetchAvailableTables, fetchSavedWarehouseQueries, fetchInsights } from '../posthog'

// Integration tests that use real PostHog API (if environment variables are available)
// These tests are only run if proper configuration is available
describe('PostHog Service Integration Tests', () => {
  const hasRealConfig = () => {
    return process.env.POSTHOG_PROJECT_ID && 
           process.env.POSTHOG_PERSONAL_API_KEY && 
           process.env.POSTHOG_BASE_URL
  }

  const getRealConfig = () => ({
    projectId: process.env.POSTHOG_PROJECT_ID!,
    apiKey: process.env.POSTHOG_PERSONAL_API_KEY!,
    baseUrl: process.env.POSTHOG_BASE_URL!
  })

  beforeAll(() => {
    if (!hasRealConfig()) {
      console.warn('Integration tests skipped - PostHog credentials not available')
    }
  })

  describe('Real PostHog API Integration', () => {
    it.skipIf(!hasRealConfig())('should fetch real warehouse tables from PostHog', async () => {
      const config = getRealConfig()
      
      const tables = await fetchAvailableTables(config)
      
      // Basic structure validation
      expect(Array.isArray(tables)).toBe(true)
      
      // Should always have at least the core system tables
      expect(tables.length).toBeGreaterThanOrEqual(4)
      
      // Core system tables should be present
      const tableIds = tables.map(t => t.id)
      expect(tableIds).toContain('events')
      expect(tableIds).toContain('persons')
      expect(tableIds).toContain('cohort_people')
      expect(tableIds).toContain('groups')
      
      // All tables should have required structure
      tables.forEach(table => {
        expect(table).toHaveProperty('name')
        expect(table).toHaveProperty('id')
        expect(typeof table.name).toBe('string')
        expect(typeof table.id).toBe('string')
        expect(table.name.length).toBeGreaterThan(0)
        expect(table.id.length).toBeGreaterThan(0)
      })
      
      console.log(`Integration test: Found ${tables.length} tables`)
      console.log('Table IDs:', tableIds.join(', '))
    }, 10000) // 10 second timeout for real API calls

    it.skipIf(!hasRealConfig())('should fetch real saved warehouse queries from PostHog', async () => {
      const config = getRealConfig()
      
      try {
        const queries = await fetchSavedWarehouseQueries(config)
        
        // Basic structure validation
        expect(Array.isArray(queries)).toBe(true)
        
        // All queries should have required structure
        queries.forEach(query => {
          expect(query).toHaveProperty('id')
          expect(query).toHaveProperty('name')
          expect(query).toHaveProperty('query')
          expect(typeof query.id).toBe('string')
          expect(typeof query.name).toBe('string')
          expect(typeof query.query).toBe('object')
          expect(query.query).toHaveProperty('query')
          expect(typeof query.query.query).toBe('string')
        })
        
        console.log(`Integration test: Found ${queries.length} saved warehouse queries`)
      } catch (error: unknown) {
        // It's okay if there are no saved queries or permission issues
        if (error instanceof Error && (error.message?.includes('not found') || error.message?.includes('permission'))) {
          console.log('Integration test: No saved queries found or permission issue (this is expected)')
        } else {
          throw error
        }
      }
    }, 10000)

    it.skipIf(!hasRealConfig())('should fetch real insights from PostHog', async () => {
      const config = getRealConfig()
      
      try {
        const insights = await fetchInsights(config)
        
        // Basic structure validation
        expect(Array.isArray(insights)).toBe(true)
        
        // All insights should have required structure
        insights.forEach(insight => {
          expect(insight).toHaveProperty('id')
          expect(insight).toHaveProperty('name')
          expect(insight).toHaveProperty('short_id')
          expect(insight).toHaveProperty('query')
          expect(typeof insight.id).toBe('number')
          expect(typeof insight.name).toBe('string')
          expect(typeof insight.short_id).toBe('string')
        })
        
        console.log(`Integration test: Found ${insights.length} insights`)
      } catch (error: unknown) {
        // It's okay if there are no insights or permission issues
        if (error instanceof Error && (error.message?.includes('not found') || error.message?.includes('permission'))) {
          console.log('Integration test: No insights found or permission issue (this is expected)')
        } else {
          throw error
        }
      }
    }, 10000)
  })

  describe('API Error Handling with Real PostHog', () => {
    it.skipIf(!hasRealConfig())('should handle invalid project ID gracefully', async () => {
      const config = {
        ...getRealConfig(),
        projectId: 'invalid-project-id-12345'
      }
      
      await expect(fetchAvailableTables(config)).rejects.toThrow()
    }, 10000)

    it.skipIf(!hasRealConfig())('should handle invalid API key gracefully', async () => {
      const config = {
        ...getRealConfig(),
        apiKey: 'invalid-api-key-12345'
      }
      
      await expect(fetchAvailableTables(config)).rejects.toThrow()
    }, 10000)

    it.skipIf(!hasRealConfig())('should handle invalid base URL gracefully', async () => {
      const config = {
        ...getRealConfig(),
        baseUrl: 'https://invalid-posthog-instance.com'
      }
      
      await expect(fetchAvailableTables(config)).rejects.toThrow()
    }, 10000)
  })

  describe('Data Consistency Tests', () => {
    it.skipIf(!hasRealConfig())('should return consistent results across multiple calls', async () => {
      const config = getRealConfig()
      
      const [result1, result2, result3] = await Promise.all([
        fetchAvailableTables(config),
        fetchAvailableTables(config),
        fetchAvailableTables(config)
      ])
      
      // Results should be identical
      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
      
      // Should contain the same number of tables
      expect(result1.length).toBe(result2.length)
      expect(result2.length).toBe(result3.length)
    }, 15000)

    it.skipIf(!hasRealConfig())('should maintain table ID uniqueness', async () => {
      const config = getRealConfig()
      
      const tables = await fetchAvailableTables(config)
      const tableIds = tables.map(t => t.id)
      const uniqueIds = new Set(tableIds)
      
      // All table IDs should be unique
      expect(uniqueIds.size).toBe(tableIds.length)
    }, 10000)
  })
})

// Export helper for manual testing
export const runManualIntegrationTest = async () => {
  if (!process.env.POSTHOG_PROJECT_ID || !process.env.POSTHOG_PERSONAL_API_KEY || !process.env.POSTHOG_BASE_URL) {
    console.error('Missing environment variables for manual integration test')
    console.log('Required: POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY, POSTHOG_BASE_URL')
    return
  }

  const config = {
    projectId: process.env.POSTHOG_PROJECT_ID,
    apiKey: process.env.POSTHOG_PERSONAL_API_KEY,
    baseUrl: process.env.POSTHOG_BASE_URL
  }

  console.log('Running manual integration test...')
  
  try {
    const tables = await fetchAvailableTables(config)
    console.log('✅ Tables fetched successfully:', tables.length)
    console.log('📋 Available tables:', tables.map(t => `${t.name} (${t.id})`).join(', '))
    
    const queries = await fetchSavedWarehouseQueries(config)
    console.log('✅ Queries fetched successfully:', queries.length)
    
    const insights = await fetchInsights(config)
    console.log('✅ Insights fetched successfully:', insights.length)
    
    return { tables, queries, insights }
  } catch (error) {
    console.error('❌ Integration test failed:', error)
    throw error
  }
}