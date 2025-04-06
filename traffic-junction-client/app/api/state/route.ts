import { NextResponse } from "next/server"
import type { SyncedState } from "@/lib/sync-service"
import { getDbAdapter } from "@/lib/db-adapter"

// Get the database adapter
const dbAdapter = getDbAdapter("server")

// Connected clients for SSE
const clients = new Map()

// GET handler to retrieve the current state
export async function GET(request: Request) {
  try {
    const state = await dbAdapter.getState()
    return NextResponse.json(state || {})
  } catch (error) {
    console.error("Error retrieving state:", error)
    return NextResponse.json({ error: "Failed to retrieve state" }, { status: 500 })
  }
}

// POST handler to update the state
export async function POST(request: Request) {
  try {
    const newState = (await request.json()) as SyncedState

    // Validate the new state (basic validation)
    if (!newState || typeof newState !== "object") {
      return NextResponse.json({ error: "Invalid state data" }, { status: 400 })
    }

    // Get the current state
    const currentState = await dbAdapter.getState()

    // Only update if the new state is newer than the current state
    if (!currentState || newState.lastUpdated > currentState.lastUpdated) {
      // Ensure the timestamp is from the server
      newState.lastUpdated = Date.now()

      // Save the state
      const success = await dbAdapter.saveState(newState)

      if (!success) {
        throw new Error("Failed to save state")
      }

      // Notify all connected SSE clients
      notifyClients(newState)
    }

    return NextResponse.json({ success: true, state: newState })
  } catch (error) {
    console.error("Error updating state:", error)
    return NextResponse.json({ error: "Failed to update state" }, { status: 500 })
  }
}

// Function to notify all SSE clients of state changes
function notifyClients(state: any) {
  clients.forEach((client, id) => {
    client.write(`data: ${JSON.stringify(state)}\n\n`)
  })
}

