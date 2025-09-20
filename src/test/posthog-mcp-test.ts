/**
 * PostHog MCP Server Test Utility
 * 
 * This utility can be used to test integration with PostHog's MCP server
 * and validate real API responses against our expected data structures.
 */

import { fetchAvailableTables, fetchSavedWarehouseQueries, fetchInsights, TableInfo } from '../services/posthog'

interface TestResult {
  success: boolean
  message: string
  data?: unknown
  error?: Error
}

interface MCPTestConfig {
  projectId: string
  apiKey: string
  baseUrl: string
}

export class PostHogMCPTester {
  private config: MCPTestConfig

  constructor(config: MCPTestConfig) {
    this.config = config
  }

  async testTableCollection(): Promise<TestResult> {
    try {
      console.log('🧪 Testing table collection with PostHog MCP server...')
      
      const tables = await fetchAvailableTables(this.config)
      
      // Validate structure
      const validationResult = this.validateTableStructure(tables)
      if (!validationResult.success) {
        return validationResult
      }

      // Check for expected core tables
      const coreTableIds = ['events', 'persons', 'cohort_people', 'groups']
      const foundCoreIds = tables.map(t => t.id)
      const missingCore = coreTableIds.filter(id => !foundCoreIds.includes(id))
      
      if (missingCore.length > 0) {
        return {
          success: false,
          message: `Missing core system tables: ${missingCore.join(', ')}`,
          data: { foundTables: foundCoreIds, missingCore }
        }
      }

      return {
        success: true,
        message: `✅ Successfully fetched ${tables.length} tables (${foundCoreIds.length} total)`,
        data: {
          tableCount: tables.length,
          coreTableCount: coreTableIds.length,
          warehouseTableCount: tables.length - coreTableIds.length,
          tableIds: foundCoreIds.slice(0, 10), // First 10 for brevity
          allTablesPresent: true
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Table collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  async testWarehouseQueries(): Promise<TestResult> {
    try {
      console.log('🧪 Testing warehouse queries with PostHog MCP server...')
      
      const queries = await fetchSavedWarehouseQueries(this.config)
      
      // Validate structure
      for (const query of queries) {
        if (!query.id || !query.name || !query.query || typeof query.query.query !== 'string') {
          return {
            success: false,
            message: 'Invalid warehouse query structure detected',
            data: { invalidQuery: query }
          }
        }
      }

      return {
        success: true,
        message: `✅ Successfully fetched ${queries.length} warehouse queries`,
        data: {
          queryCount: queries.length,
          queries: queries.map(q => ({ id: q.id, name: q.name }))
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Warehouse queries test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  async testInsights(): Promise<TestResult> {
    try {
      console.log('🧪 Testing insights with PostHog MCP server...')
      
      const insights = await fetchInsights(this.config)
      
      // Validate structure
      for (const insight of insights) {
        if (typeof insight.id !== 'number' || !insight.name || !insight.short_id || !insight.query) {
          return {
            success: false,
            message: 'Invalid insight structure detected',
            data: { invalidInsight: insight }
          }
        }
      }

      return {
        success: true,
        message: `✅ Successfully fetched ${insights.length} insights`,
        data: {
          insightCount: insights.length,
          insights: insights.slice(0, 5).map(i => ({ id: i.id, name: i.name, short_id: i.short_id }))
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Insights test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  async runFullTestSuite(): Promise<{ overall: boolean, results: Record<string, TestResult> }> {
    console.log('🚀 Running full PostHog MCP integration test suite...\n')
    
    const results: Record<string, TestResult> = {}
    
    // Test table collection
    results.tables = await this.testTableCollection()
    console.log(results.tables.message)
    if (results.tables.data) {
      console.log('  📊 Data:', JSON.stringify(results.tables.data, null, 2))
    }
    console.log()

    // Test warehouse queries
    results.queries = await this.testWarehouseQueries()
    console.log(results.queries.message)
    if (results.queries.data) {
      console.log('  📊 Data:', JSON.stringify(results.queries.data, null, 2))
    }
    console.log()

    // Test insights
    results.insights = await this.testInsights()
    console.log(results.insights.message)
    if (results.insights.data) {
      console.log('  📊 Data:', JSON.stringify(results.insights.data, null, 2))
    }
    console.log()

    const overall = Object.values(results).every(result => result.success)
    
    console.log(`🏁 Test Suite Complete: ${overall ? '✅ ALL PASSED' : '❌ SOME FAILED'}`)
    
    return { overall, results }
  }

  private validateTableStructure(tables: TableInfo[]): TestResult {
    if (!Array.isArray(tables)) {
      return {
        success: false,
        message: 'Tables result is not an array',
        data: { actualType: typeof tables }
      }
    }

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]
      if (!table.name || !table.id) {
        return {
          success: false,
          message: `Table at index ${i} missing required fields`,
          data: { table, index: i }
        }
      }
      
      if (typeof table.name !== 'string' || typeof table.id !== 'string') {
        return {
          success: false,
          message: `Table at index ${i} has invalid field types`,
          data: { 
            table, 
            index: i,
            nameType: typeof table.name,
            idType: typeof table.id
          }
        }
      }
    }

    return { success: true, message: 'All tables have valid structure' }
  }
}

// Convenience function for quick testing
export async function quickMCPTest(config?: Partial<MCPTestConfig>) {
  const testConfig: MCPTestConfig = {
    projectId: config?.projectId || process.env.POSTHOG_PROJECT_ID || '',
    apiKey: config?.apiKey || process.env.POSTHOG_PERSONAL_API_KEY || '',
    baseUrl: config?.baseUrl || process.env.POSTHOG_BASE_URL || 'https://app.posthog.com'
  }

  if (!testConfig.projectId || !testConfig.apiKey) {
    console.error('❌ Missing PostHog credentials')
    console.log('Required environment variables:')
    console.log('- POSTHOG_PROJECT_ID')
    console.log('- POSTHOG_PERSONAL_API_KEY')
    console.log('- POSTHOG_BASE_URL (optional, defaults to https://app.posthog.com)')
    return
  }

  const tester = new PostHogMCPTester(testConfig)
  return await tester.runFullTestSuite()
}

// Export for use in other test files
export default PostHogMCPTester