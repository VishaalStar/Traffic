/**
 * Deployment Troubleshooting Script
 *
 * This script helps identify and fix common deployment issues.
 *
 * Usage:
 * npx ts-node scripts/troubleshoot-deployment.ts
 */

import fs from "fs"
import chalk from "chalk"

// Log function
const log = {
  info: (message: string) => console.log(chalk.blue(`[INFO] ${message}`)),
  success: (message: string) => console.log(chalk.green(`[SUCCESS] ${message}`)),
  warning: (message: string) => console.log(chalk.yellow(`[WARNING] ${message}`)),
  error: (message: string) => console.log(chalk.red(`[ERROR] ${message}`)),
  fix: (message: string) => console.log(chalk.magenta(`[FIX] ${message}`)),
}

// Check for common issues
async function checkForCommonIssues() {
  log.info("Checking for common deployment issues...")

  // Check for environment variables
  checkEnvironmentVariables()

  // Check for API routes
  checkApiRoutes()

  // Check for database configuration
  checkDatabaseConfiguration()

  // Check for build issues
  checkBuildIssues()

  // Check for client-side errors
  checkClientSideErrors()

  log.info("Troubleshooting complete. Fix the issues above and try deploying again.")
}

// Check for missing environment variables
function checkEnvironmentVariables() {
  log.info("Checking environment variables...")

  const requiredVars = ["DATABASE_URL", "SYNC_METHOD", "NEXT_PUBLIC_API_BASE_URL"]

  const missingVars = []

  // Check .env.local file if it exists
  try {
    if (fs.existsSync(".env.local")) {
      const envContent = fs.readFileSync(".env.local", "utf8")

      for (const variable of requiredVars) {
        if (!envContent.includes(`${variable}=`)) {
          missingVars.push(variable)
        }
      }
    } else {
      log.warning("No .env.local file found. Creating a template...")

      const envTemplate = `# Database Configuration
DATABASE_URL=your_database_connection_string

# Real-time Sync Configuration
SYNC_METHOD=websocket  # Options: polling, websocket, sse
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com

# Client ID Prefix (for identifying clients)
CLIENT_ID_PREFIX=traffic_control_
`

      fs.writeFileSync(".env.local.template", envTemplate)
      log.fix("Created .env.local.template. Rename to .env.local and fill in your values.")

      missingVars.push(...requiredVars)
    }
  } catch (error) {
    log.error(`Error checking environment variables: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (missingVars.length > 0) {
    log.error(`Missing required environment variables: ${missingVars.join(", ")}`)
    log.fix("Add these variables to your .env.local file and to your deployment environment.")
  } else {
    log.success("All required environment variables are present.")
  }
}

// Check API routes
function checkApiRoutes() {
  log.info("Checking API routes...")

  const requiredApiRoutes = ["app/api/state/route.ts", "app/api/ws/route.ts", "app/api/sse/route.ts"]

  const missingRoutes = []

  for (const route of requiredApiRoutes) {
    if (!fs.existsSync(route)) {
      missingRoutes.push(route)
    }
  }

  if (missingRoutes.length > 0) {
    log.error(`Missing required API routes: ${missingRoutes.join(", ")}`)
    log.fix("Create these API routes or check if they are in a different location.")
  } else {
    log.success("All required API routes are present.")
  }
}

// Check database configuration
function checkDatabaseConfiguration() {
  log.info("Checking database configuration...")

  try {
    // Check if db-adapter.ts exists
    if (!fs.existsSync("lib/db-adapter.ts")) {
      log.error("Database adapter file not found: lib/db-adapter.ts")
      log.fix("Create the database adapter file with appropriate configuration.")
      return
    }

    // Check if sync-service.ts exists
    if (!fs.existsSync("lib/sync-service.ts")) {
      log.error("Sync service file not found: lib/sync-service.ts")
      log.fix("Create the sync service file with appropriate configuration.")
      return
    }

    log.success("Database configuration files are present.")
  } catch (error) {
    log.error(`Error checking database configuration: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Check for build issues
function checkBuildIssues() {
  log.info("Checking for build issues...")

  try {
    // Check if next.config.js exists
    if (!fs.existsSync("next.config.js") && !fs.existsSync("next.config.mjs")) {
      log.error("Next.js configuration file not found: next.config.js or next.config.mjs")
      log.fix("Create a Next.js configuration file with appropriate settings.")

      // Create a basic next.config.js file
      const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
`

      fs.writeFileSync("next.config.js", nextConfig)
      log.fix("Created a basic next.config.js file.")
    }

    // Check if package.json exists
    if (!fs.existsSync("package.json")) {
      log.error("Package.json file not found")
      log.fix("Create a package.json file with appropriate dependencies.")
      return
    }

    // Check for TypeScript errors
    if (fs.existsSync("tsconfig.json")) {
      log.success("TypeScript configuration file found.")
    } else {
      log.warning("TypeScript configuration file not found: tsconfig.json")
      log.fix("Create a tsconfig.json file with appropriate settings.")
    }

    log.success("Build configuration files are present.")
  } catch (error) {
    log.error(`Error checking build issues: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Check for client-side errors
function checkClientSideErrors() {
  log.info("Checking for client-side errors...")

  try {
    // Check if components exist
    const requiredComponents = [
      "components/junction-control.tsx",
      "components/sequence-tester.tsx",
      "components/diagnostics-panel.tsx",
      "components/ip-config-panel.tsx",
    ]

    const missingComponents = []

    for (const component of requiredComponents) {
      if (!fs.existsSync(component)) {
        missingComponents.push(component)
      }
    }

    if (missingComponents.length > 0) {
      log.error(`Missing required components: ${missingComponents.join(", ")}`)
      log.fix("Create these components or check if they are in a different location.")
    } else {
      log.success("All required components are present.")
    }

    // Check for client-side environment variables
    const clientSideEnvVars = ["NEXT_PUBLIC_API_BASE_URL"]

    if (fs.existsSync(".env.local")) {
      const envContent = fs.readFileSync(".env.local", "utf8")

      const missingClientVars = []

      for (const variable of clientSideEnvVars) {
        if (!envContent.includes(`${variable}=`)) {
          missingClientVars.push(variable)
        }
      }

      if (missingClientVars.length > 0) {
        log.error(`Missing required client-side environment variables: ${missingClientVars.join(", ")}`)
        log.fix("Add these variables to your .env.local file and to your deployment environment.")
      } else {
        log.success("All required client-side environment variables are present.")
      }
    }
  } catch (error) {
    log.error(`Error checking client-side errors: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Run the checks
checkForCommonIssues()

