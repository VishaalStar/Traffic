/**
 * Deployment Verification Script
 *
 * This script verifies that all functionality is working correctly after deployment.
 * Run this script after deploying to production to ensure everything is working as expected.
 *
 * Usage:
 * 1. Deploy the application
 * 2. Run this script: npx ts-node scripts/verify-deployment.ts --url https://your-deployed-app.com
 */

import fetch from "node-fetch"
import { program } from "commander"
import chalk from "chalk"
import WebSocket from "ws"

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

// Test API endpoints
async function testApiEndpoints() {
  log.info("Testing API endpoints...")

  try {
    // Test state API
    const stateResponse = await fetch(`${baseUrl}/api/state`)
    if (!stateResponse.ok) {
      throw new Error(`State API returned ${stateResponse.status}`)
    }

    const state = await stateResponse.json()
    log.verbose(`State API response: ${JSON.stringify(state, null, 2)}`)

    if (!state || typeof state !== "object") {
      throw new Error("State API did not return a valid state object")
    }

    log.success("State API is working correctly")

    // Test SSE endpoint
    const sseResponse = await fetch(`${baseUrl}/api/sse?clientId=test`)
    if (!sseResponse.ok) {
      throw new Error(`SSE API returned ${sseResponse.status}`)
    }

    log.success("SSE API is working correctly")

    return true
  } catch (error) {
    log.error(`API endpoint test failed: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

// Test WebSocket connection
async function testWebSocket() {
  log.info("Testing WebSocket connection...")

  return new Promise<boolean>((resolve) => {
    try {
      const wsUrl = baseUrl.replace(/^http/, "ws") + "/api/ws"
      const ws = new WebSocket(wsUrl)

      ws.on("open", () => {
        log.success("WebSocket connection established")
        ws.close()
        resolve(true)
      })

      ws.on("error", (error) => {
        log.error(`WebSocket connection failed: ${error.message}`)
        resolve(false)
      })

      // Set a timeout in case the connection hangs
      setTimeout(() => {
        log.error("WebSocket connection timed out")
        ws.close()
        resolve(false)
      }, 5000)
    } catch (error) {
      log.error(`WebSocket test failed: ${error instanceof Error ? error.message : String(error)}`)
      resolve(false)
    }
  })
}

// Test state persistence
async function testStatePersistence() {
  log.info("Testing state persistence...")

  try {
    // Get current state
    const stateResponse = await fetch(`${baseUrl}/api/state`)
    if (!stateResponse.ok) {
      throw new Error(`State API returned ${stateResponse.status}`)
    }

    const originalState = await stateResponse.json()
    log.verbose(`Original state: ${JSON.stringify(originalState, null, 2)}`)

    // Update state
    const newState = {
      ...originalState,
      controlMode: originalState.controlMode === "auto" ? "manual" : "auto",
      lastUpdated: Date.now(),
      lastUpdatedBy: "verification-script",
    }

    const updateResponse = await fetch(`${baseUrl}/api/state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newState),
    })

    if (!updateResponse.ok) {
      throw new Error(`State update API returned ${updateResponse.status}`)
    }

    // Get updated state
    const updatedStateResponse = await fetch(`${baseUrl}/api/state`)
    if (!updatedStateResponse.ok) {
      throw new Error(`State API returned ${updatedStateResponse.status}`)
    }

    const updatedState = await updatedStateResponse.json()
    log.verbose(`Updated state: ${JSON.stringify(updatedState, null, 2)}`)

    // Verify state was updated
    if (updatedState.controlMode !== newState.controlMode) {
      throw new Error(
        `State was not updated correctly. Expected controlMode to be ${newState.controlMode}, but got ${updatedState.controlMode}`,
      )
    }

    log.success("State persistence is working correctly")

    // Restore original state
    await fetch(`${baseUrl}/api/state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...originalState,
        lastUpdated: Date.now(),
        lastUpdatedBy: "verification-script",
      }),
    })

    return true
  } catch (error) {
    log.error(`State persistence test failed: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

// Run all tests
async function runTests() {
  log.info(`Verifying deployment at ${baseUrl}...`)

  const apiEndpointsWorking = await testApiEndpoints()
  const webSocketWorking = await testWebSocket()
  const statePersistenceWorking = await testStatePersistence()

  // Print summary
  console.log("\n" + chalk.bold("Deployment Verification Summary:"))
  console.log(chalk.bold("-----------------------------------"))
  console.log(`API Endpoints: ${apiEndpointsWorking ? chalk.green("PASS") : chalk.red("FAIL")}`)
  console.log(`WebSocket: ${webSocketWorking ? chalk.green("PASS") : chalk.red("FAIL")}`)
  console.log(`State Persistence: ${statePersistenceWorking ? chalk.green("PASS") : chalk.red("FAIL")}`)

  const allTestsPassed = apiEndpointsWorking && webSocketWorking && statePersistenceWorking

  if (allTestsPassed) {
    console.log("\n" + chalk.green.bold("✓ All tests passed! The deployment is working correctly."))
    process.exit(0)
  } else {
    console.log("\n" + chalk.red.bold("✗ Some tests failed. Please check the logs for details."))
    process.exit(1)
  }
}

// Run the tests
runTests()

