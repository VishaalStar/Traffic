// Simplified API route for state management
// Use this if you're having issues with the more complex route

import { NextResponse } from "next/server"
import type { SyncedState } from "@/lib/sync-service"

// In-memory state storage (for simple deployments)
let currentState: SyncedState | null = null

// GET handler to retrieve the current state
export async function GET(request: Request) {
  try {
    return NextResponse.json(currentState || {})
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

    // Only update if the new state is newer than the current state
    if (!currentState || newState.lastUpdated > currentState.lastUpdated) {
      // Ensure the timestamp is from the server
      newState.lastUpdated = Date.now()

      // Save the state
      currentState = newState
    }

    return NextResponse.json({ success: true, state: currentState })
  } catch (error) {
    console.error("Error updating state:", error)
    return NextResponse.json({ error: "Failed to update state" }, { status: 500 })
  }
}

