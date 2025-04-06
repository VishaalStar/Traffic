/**
 * Deployment Verification Script
 *
 * This script verifies that your deployment is working correctly and identifies specific issues.
 *
 * Usage:
 * npx ts-node scripts/deployment-verification.ts --url https://your-deployed-app.com
 */

import fetch from "node-fetch"
import { program } from "commander"
import chalk from "chalk"

// Parse command line arguments
program
  .option("-u, --url <url>", "URL of the deployed application")
  .option("-v, --verbose", "Enable verbose output")
  .parse(process.argv)

const options = program.opts()
const baseUrl = options.url || "http://localhost:3000"
const verbose = options.verbose || false

// Log function
const log = {
  info: (message: string) => console.log(chalk.blue(`[INFO] ${message}`)),
  success: (message: string) => console.log(chalk.green(`[SUCCESS] ${message}`)),
  warning: (message: string) => console.log(chalk.yellow(`[WARNING] ${message}`)),
  error: (message: string) => console.log(chalk.red(`[ERROR] ${message}`)),
  verbose: (message: string) => verbose && console.log(chalk.gray(`[VERBOSE] ${message}`)),
}

// Test if the application is accessible
async function testApplicationAccess() {
  log.info(`Testing application access at ${baseUrl}...`)

  try {
    const response = await fetch(baseUrl)

    if (response.ok) {
      log.success(`Application is accessible at ${baseUrl}`)
      return true
    } else {
      log.error(`Application returned status ${response.status} ${response.statusText}`)
      return false
    }
  } catch (error) {
    log.error(`Failed to access application: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

// Test API endpoints
async function testApiEndpoints() {
  const endpoints = ["/api/state", "/api/health"]

  let allEndpointsWorking = true

  for (const endpoint of endpoints) {
    log.info(`Testing API endpoint ${endpoint}...`)

    try {
      const response = await fetch(`${baseUrl}${endpoint}`)

      if (response.ok) {
        log.success(`API endpoint ${endpoint} is working`)
      } else {
        log.error(`API endpoint ${endpoint} returned status ${response.status} ${response.statusText}`)
        allEndpointsWorking = false
      }
    } catch (error) {
      log.error(`Failed to access API endpoint ${endpoint}: ${error instanceof Error ? error.message : String(error)}`)
      allEndpointsWorking = false
    }
  }

  return allEndpointsWorking
}

// Test state persistence
async function testStatePersistence() {
  log.info("Testing state persistence...")

  try {
    // Get current state
    const stateResponse = await fetch(`${baseUrl}/api/state`)

    if (!stateResponse.ok) {
      log.error(`Failed to get state: ${stateResponse.status} ${stateResponse.statusText}`)
      return false
    }

    const state = await stateResponse.json()
    log.verbose(`Current state: ${JSON.stringify(state, null, 2)}`)

    // Update state
    const testValue = `test_${Date.now()}`
    const updateResponse = await fetch(`${baseUrl}/api/state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...state,
        testValue,
        lastUpdated: Date.now(),
      }),
    })

    if (!updateResponse.ok) {
      log.error(`Failed to update state: ${updateResponse.status} ${updateResponse.statusText}`)
      return false
    }

    // Get updated state
    const updatedStateResponse = await fetch(`${baseUrl}/api/state`)

    if (!updatedStateResponse.ok) {
      log.error(`Failed to get updated state: ${updatedStateResponse.status} ${updatedStateResponse.statusText}`)
      return false
    }

    const updatedState = await updatedStateResponse.json()
    log.verbose(`Updated state: ${JSON.stringify(updatedState, null, 2)}`)

    // Check if state was updated
    if (updatedState.testValue === testValue) {
      log.success("State persistence is working")
      return true
    } else {
      log.error("State was not updated correctly")
      return false
    }
  } catch (error) {
    log.error(`Failed to test state persistence: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

// Run all tests
async function runTests() {
  log.info(`Starting deployment verification for ${baseUrl}...`)

  const applicationAccessible = await testApplicationAccess()

  if (!applicationAccessible) {
    log.error("Application is not accessible. Aborting further tests.")
    return
  }

  const apiEndpointsWorking = await testApiEndpoints()
  const statePersistenceWorking = await testStatePersistence()

  // Print summary
  console.log("\n" + chalk.bold("Deployment Verification Summary:"))
  console.log(chalk.bold("-----------------------------------"))
  console.log(`Application Access: ${applicationAccessible ? chalk.green("PASS") : chalk.red("FAIL")}`)
  console.log(`API Endpoints: ${apiEndpointsWorking ? chalk.green("PASS") : chalk.red("FAIL")}`)
  console.log(`State Persistence: ${statePersistenceWorking ? chalk.green("PASS") : chalk.red("FAIL")}`)

  const allTestsPassed = applicationAccessible && apiEndpointsWorking && statePersistenceWorking

  if (allTestsPassed) {
    console.log("\n" + chalk.green.bold("✓ All tests passed! The deployment is working correctly."))
  } else {
    console.log("\n" + chalk.red.bold("✗ Some tests failed. Please check the logs for details."))

    // Provide specific recommendations based on which tests failed
    if (!apiEndpointsWorking) {
      console.log(chalk.yellow("\nAPI Endpoint Recommendations:"))
      console.log("1. Check that your API routes are correctly implemented")
      console.log("2. Verify that your server is running and accessible")
      console.log("3. Check for CORS issues if accessing from a different domain")
      console.log("4. Look for errors in your server logs")
    }

    if (!statePersistenceWorking) {
      console.log(chalk.yellow("\nState Persistence Recommendations:"))
      console.log("1. Check that your database is correctly configured")
      console.log("2. Verify that your database adapter is working")
      console.log("3. Check for errors in your database logs")
      console.log("4. Make sure your API routes are correctly handling state updates")
    }
  }
}

// Run the tests
runTests()

