"use client"

// Real-time synchronization service for keeping all clients in sync
import { useEffect, useState } from "react"
import { getDbAdapter, type DbAdapter } from "./db-adapter"

// Types for the synchronized state
export interface SyncedState {
  signalStatus: Record<string, string>
  timeZones: any[]
  priorities: any
  controlMode: "auto" | "manual" | "semi"
  ipAddresses: Record<string, string>
  lastUpdated: number
  lastUpdatedBy: string
}

// Default state
const defaultState: SyncedState = {
  signalStatus: {
    P1: "red",
    P2: "red",
    P3: "red",
    P4: "red",
  },
  timeZones: [
    {
      id: 1,
      name: "Time Zone 1",
      startTime: "08:00",
      endTime: "10:00",
      sequence: "1,2,3,4,5,6,7",
      timePeriods: {
        P1: { red: 60, yellow: 5, greenLeft: 30, greenStraight: 25, greenRight: 20 },
        P2: { red: 60, yellow: 5, greenLeft: 20, greenStraight: 30, greenRight: 25 },
        P3: { red: 60, yellow: 5, greenLeft: 20, greenStraight: 25, greenRight: 30 },
        P4: { red: 60, yellow: 5, greenLeft: 25, greenStraight: 20, greenRight: 30 },
      },
    },
    {
      id: 2,
      name: "Time Zone 2",
      startTime: "16:00",
      endTime: "19:00",
      sequence: "8,9,10,11,12,13,14",
      timePeriods: {
        P1: { red: 60, yellow: 5, greenLeft: 30, greenStraight: 25, greenRight: 20 },
        P2: { red: 60, yellow: 5, greenLeft: 20, greenStraight: 30, greenRight: 25 },
        P3: { red: 60, yellow: 5, greenLeft: 20, greenStraight: 25, greenRight: 30 },
        P4: { red: 60, yellow: 5, greenLeft: 25, greenStraight: 20, greenRight: 30 },
      },
    },
  ],
  priorities: {
    P1: { greenLeft: 1, greenStraight: 2, greenRight: 3 },
    P2: { greenLeft: 3, greenStraight: 1, greenRight: 2 },
    P3: { greenLeft: 3, greenStraight: 2, greenRight: 1 },
    P4: { greenLeft: 2, greenStraight: 3, greenRight: 1 },
  },
  ipAddresses: {
    P1A: "192.168.1.6",
    P1B: "192.168.1.7",
    P2A: "192.168.1.8",
    P2B: "192.168.1.9",
    P3A: "192.168.1.10",
    P3B: "192.168.1.11",
    P4A: "192.168.1.12",
    P4B: "192.168.1.13",
  },
  controlMode: "auto",
  lastUpdated: Date.now(),
  lastUpdatedBy: "system",
}

// Sync methods
type SyncMethod = "polling" | "websocket" | "sse"

// Configuration for the sync service
export interface SyncConfig {
  method: SyncMethod
  pollingInterval?: number
  apiEndpoint?: string
  websocketUrl?: string
  sseUrl?: string
  clientId: string
  dbAdapter?: DbAdapter
}

// Default configuration
const defaultConfig: SyncConfig = {
  method: "polling",
  pollingInterval: 5000, // 5 seconds
  apiEndpoint: "/api/state",
  clientId: `client_${Math.random().toString(36).substring(2, 9)}`,
}

// Class for handling state synchronization
export class SyncService {
  private config: SyncConfig
  private state: SyncedState = defaultState
  private eventSource: EventSource | null = null
  private websocket: WebSocket | null = null
  private pollingInterval: NodeJS.Timeout | null = null
  private onStateChangeCallbacks: ((state: SyncedState) => void)[] = []
  private isInitialized = false
  private dbAdapter: DbAdapter

  constructor(config: SyncConfig = defaultConfig) {
    this.config = config
    this.dbAdapter = config.dbAdapter || getDbAdapter("server")
    this.initialize()
  }

  // Initialize the sync method
  private async initialize() {
    if (this.isInitialized) return

    this.isInitialized = true

    // Try to load state from database first
    try {
      const savedState = await this.dbAdapter.getState()
      if (savedState) {
        this.state = savedState
        this.notifyStateChange()
      }
    } catch (error) {
      console.error("Error loading initial state:", error)
    }

    switch (this.config.method) {
      case "polling":
        this.initPolling()
        break
      case "websocket":
        this.initWebSocket()
        break
      case "sse":
        this.initSSE()
        break
    }
  }

  // Initialize polling
  private initPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }

    // Fetch initial state
    this.fetchState()

    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.fetchState()
    }, this.config.pollingInterval || 5000)
  }

  // Initialize WebSocket
  private initWebSocket() {
    if (!this.config.websocketUrl) {
      console.error("WebSocket URL not provided")
      return
    }

    if (this.websocket) {
      this.websocket.close()
    }

    try {
      this.websocket = new WebSocket(this.config.websocketUrl)

      this.websocket.onopen = () => {
        console.log("WebSocket connection established for state sync")
        // Send client ID to identify this connection
        this.websocket?.send(JSON.stringify({ type: "identify", clientId: this.config.clientId }))
      }

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "state_update") {
            this.updateState(data.state)
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      this.websocket.onclose = () => {
        console.log("WebSocket connection closed for state sync")
        // Try to reconnect after 5 seconds
        setTimeout(() => this.initWebSocket(), 5000)
      }

      this.websocket.onerror = (error) => {
        console.error("WebSocket error for state sync:", error)
      }
    } catch (error) {
      console.error("Failed to initialize WebSocket for state sync:", error)
    }
  }

  // Initialize Server-Sent Events
  private initSSE() {
    if (!this.config.sseUrl) {
      console.error("SSE URL not provided")
      return
    }

    if (this.eventSource) {
      this.eventSource.close()
    }

    try {
      this.eventSource = new EventSource(`${this.config.sseUrl}?clientId=${this.config.clientId}`)

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.updateState(data)
        } catch (error) {
          console.error("Error parsing SSE message:", error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error("SSE error:", error)
        // Close and try to reconnect after 5 seconds
        this.eventSource?.close()
        setTimeout(() => this.initSSE(), 5000)
      }
    } catch (error) {
      console.error("Failed to initialize SSE:", error)
    }
  }

  // Fetch state from the server (for polling)
  private async fetchState() {
    try {
      const state = await this.dbAdapter.getState()
      if (state) {
        this.updateState(state)
      }
    } catch (error) {
      console.error("Error fetching state:", error)
    }
  }

  // Update the state and notify listeners
  private updateState(newState: SyncedState) {
    // Only update if the new state is newer than the current state
    if (newState.lastUpdated > this.state.lastUpdated) {
      this.state = newState
      this.notifyStateChange()
    }
  }

  // Notify all listeners of state change
  private notifyStateChange() {
    this.onStateChangeCallbacks.forEach((callback) => callback(this.state))
  }

  // Get the current state
  public getState(): SyncedState {
    return this.state
  }

  // Update the state and publish the change
  public async updateStateAndPublish(partialState: Partial<SyncedState>): Promise<boolean> {
    try {
      // Create the new state with updated timestamp and client ID
      const newState: SyncedState = {
        ...this.state,
        ...partialState,
        lastUpdated: Date.now(),
        lastUpdatedBy: this.config.clientId,
      }

      // Save to database
      const saveSuccess = await this.dbAdapter.saveState(newState)
      if (!saveSuccess) {
        throw new Error("Failed to save state to database")
      }

      // If using WebSocket, also send the update directly
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(
          JSON.stringify({
            type: "state_update",
            state: newState,
            clientId: this.config.clientId,
          }),
        )
      }

      // Update local state
      this.state = newState
      this.notifyStateChange()

      return true
    } catch (error) {
      console.error("Error updating state:", error)
      return false
    }
  }

  // Register a callback for state changes
  public onStateChange(callback: (state: SyncedState) => void) {
    this.onStateChangeCallbacks.push(callback)
    // Immediately call with current state
    callback(this.state)

    // Return unsubscribe function
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((cb) => cb !== callback)
    }
  }

  // Update configuration and reinitialize
  public updateConfig(config: Partial<SyncConfig>) {
    this.config = { ...this.config, ...config }
    if (config.dbAdapter) {
      this.dbAdapter = config.dbAdapter
    }
    this.cleanup()
    this.isInitialized = false
    this.initialize()
  }

  // Clean up resources
  public cleanup() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }

    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
}

// Create a singleton instance
let syncServiceInstance: SyncService | null = null

export function getSyncService(config?: SyncConfig): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService(config)
  } else if (config) {
    syncServiceInstance.updateConfig(config)
  }

  return syncServiceInstance
}

// React hook for using the synced state
export function useSyncedState(): [SyncedState, (partialState: Partial<SyncedState>) => Promise<boolean>] {
  const [state, setState] = useState<SyncedState>(defaultState)

  useEffect(() => {
    const syncService = getSyncService()
    const unsubscribe = syncService.onStateChange(setState)

    return () => {
      unsubscribe()
    }
  }, [])

  const updateState = async (partialState: Partial<SyncedState>): Promise<boolean> => {
    const syncService = getSyncService()
    return await syncService.updateStateAndPublish(partialState)
  }

  return [state, updateState]
}

