#!/usr/bin/env node

// OAuth Configuration Checker
console.log('🔍 Checking OAuth Configuration...\n')

const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'GOOGLE_REDIRECT_URI'
]

let allGood = true

console.log('📋 Environment Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${varName}: MISSING`)
    allGood = false
  }
})

console.log('\n🔗 Redirect URI Check:')
const redirectUri = process.env.GOOGLE_REDIRECT_URI
if (redirectUri) {
  if (redirectUri.includes('localhost:3333')) {
    console.log('✅ Redirect URI points to localhost:3333')
  } else {
    console.log('❌ Redirect URI should point to localhost:3333 for development')
    allGood = false
  }
}

console.log('\n🆔 Client ID Format Check:')
const clientId = process.env.GOOGLE_CLIENT_ID
if (clientId) {
  if (clientId.includes('.apps.googleusercontent.com')) {
    console.log('✅ Client ID format looks correct')
  } else {
    console.log('❌ Client ID should end with .apps.googleusercontent.com')
    allGood = false
  }
}

console.log('\n📝 Recommendations:')
if (allGood) {
  console.log('✅ OAuth configuration looks good!')
  console.log('🔍 The issue might be:')
  console.log('   - Network connectivity to Google APIs')
  console.log('   - Authorization code expired')
  console.log('   - Google Console redirect URI mismatch')
} else {
  console.log('❌ OAuth configuration has issues:')
  console.log('   1. Check your .env file')
  console.log('   2. Verify Google Cloud Console settings')
  console.log('   3. Ensure redirect URI matches exactly')
}

console.log('\n🌐 Test URLs:')
console.log('   - Health Check: http://localhost:3333/oauth/health')
console.log('   - OAuth Test: http://localhost:3333/oauth/test')
console.log('   - Network Test: http://localhost:3333/oauth/network')
