// Database adapter for persistent storage
import type { SyncedState } from "./sync-service"

// Interface for database operations
export interface DbAdapter {
  getState(): Promise<SyncedState | null>
  saveState(state: SyncedState): Promise<boolean>
}

// Local storage adapter (for development)
export class LocalStorageAdapter implements DbAdapter {
  private readonly storageKey = "traffic_junction_state"

  async getState(): Promise<SyncedState | null> {
    if (typeof window === "undefined") return null

    try {
      const storedState = localStorage.getItem(this.storageKey)
      if (!storedState) return null

      return JSON.parse(storedState)
    } catch (error) {
      console.error("Error retrieving state from localStorage:", error)
      return null
    }
  }

  async saveState(state: SyncedState): Promise<boolean> {
    if (typeof window === "undefined") return false

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state))
      return true
    } catch (error) {
      console.error("Error saving state to localStorage:", error)
      return false
    }
  }
}

// Server storage adapter (for production)
export class ServerStorageAdapter implements DbAdapter {
  private readonly apiEndpoint: string

  constructor(apiEndpoint = "/api/state") {
    this.apiEndpoint = apiEndpoint
  }

  async getState(): Promise<SyncedState | null> {
    try {
      const response = await fetch(this.apiEndpoint)

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error retrieving state from server:", error)
      return null
    }
  }

  async saveState(state: SyncedState): Promise<boolean> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(state),
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error("Error saving state to server:", error)
      return false
    }
  }
}

// Factory function to get the appropriate adapter
export function getDbAdapter(type: "local" | "server" = "server"): DbAdapter {
  if (type === "local") {
    return new LocalStorageAdapter()
  } else {
    return new ServerStorageAdapter()
  }
}

