"use client"

// Simplified synchronization service
// Use this if you're having issues with the more complex sync service

import { useState, useEffect } from "react"

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

// API endpoint for state
const API_ENDPOINT = "/api/state"

// React hook for using the synced state with simplified polling
export function useSyncedState(): [SyncedState, (partialState: Partial<SyncedState>) => Promise<boolean>] {
  const [state, setState] = useState<SyncedState>(defaultState)

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const storedState = localStorage.getItem("traffic_junction_state")
      if (storedState) {
        setState(JSON.parse(storedState))
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error)
    }

    // Fetch initial state from API
    fetchState()

    // Set up polling interval
    const interval = setInterval(fetchState, 5000)

    return () => clearInterval(interval)
  }, [])

  // Fetch state from API
  const fetchState = async () => {
    try {
      const response = await fetch(API_ENDPOINT)

      if (response.ok) {
        const data = await response.json()

        // Only update if the new state is newer than the current state
        if (data && data.lastUpdated && data.lastUpdated > state.lastUpdated) {
          setState(data)

          // Also store in localStorage for offline access
          localStorage.setItem("traffic_junction_state", JSON.stringify(data))
        }
      }
    } catch (error) {
      console.error("Error fetching state:", error)
    }
  }

  // Update state
  const updateState = async (partialState: Partial<SyncedState>): Promise<boolean> => {
    try {
      // Create new state
      const newState: SyncedState = {
        ...state,
        ...partialState,
        lastUpdated: Date.now(),
        lastUpdatedBy: "user",
      }

      // Update local state immediately for responsive UI
      setState(newState)

      // Store in localStorage
      localStorage.setItem("traffic_junction_state", JSON.stringify(newState))

      // Send to API
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newState),
      })

      if (!response.ok) {
        console.error("Error updating state:", response.status, response.statusText)
        return false
      }

      return true
    } catch (error) {
      console.error("Error updating state:", error)
      return false
    }
  }

  return [state, updateState]
}

