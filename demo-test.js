/**
 * Demo script to test PostHog table collection with real API
 * 
 * To run this demo:
 * 1. Set environment variables:
 *    export POSTHOG_PROJECT_ID="your-project-id"
 *    export POSTHOG_PERSONAL_API_KEY="your-api-key" 
 *    export POSTHOG_BASE_URL="https://app.posthog.com"  # or https://eu.posthog.com
 * 2. Run: node demo-test.js
 */

const { quickMCPTest } = require('./src/test/posthog-mcp-test.ts')

async function runDemo() {
  console.log('🚀 PostHog Table Collection Demo\n')
  
  if (!process.env.POSTHOG_PROJECT_ID || !process.env.POSTHOG_PERSONAL_API_KEY) {
    console.log('⚠️  To run this demo with real PostHog data, set these environment variables:')
    console.log('   export POSTHOG_PROJECT_ID="your-project-id"')
    console.log('   export POSTHOG_PERSONAL_API_KEY="your-api-key"')
    console.log('   export POSTHOG_BASE_URL="https://app.posthog.com"  # optional')
    console.log('')
    console.log('🧪 Running unit tests instead...\n')
    
    // Run unit tests as fallback
    const { execSync } = require('child_process')
    try {
      execSync('npm run test:run', { stdio: 'inherit' })
      console.log('\n✅ All unit tests passed! The table collection logic is working correctly.')
    } catch (error) {
      console.error('\n❌ Some tests failed:', error.message)
    }
    return
  }

  try {
    const result = await quickMCPTest()
    
    if (result.overall) {
      console.log('\n🎉 SUCCESS: All PostHog integrations working correctly!')
      console.log('\nThe table collection logic successfully:')
      console.log('  ✅ Fetched core system tables (events, persons, etc.)')
      console.log('  ✅ Retrieved warehouse tables from external sources')
      console.log('  ✅ Merged tables with proper precedence rules')
      console.log('  ✅ Handled API responses correctly')
    } else {
      console.log('\n⚠️  Some tests had issues - check the output above for details')
    }
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message)
    console.log('\nThis might be due to:')
    console.log('  - Invalid credentials')
    console.log('  - Network connectivity issues')
    console.log('  - PostHog API changes')
    console.log('  - Insufficient permissions')
  }
}

// Handle both direct execution and module import
if (require.main === module) {
  runDemo()
}

module.exports = { runDemo }