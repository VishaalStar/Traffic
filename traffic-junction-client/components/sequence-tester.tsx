"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Initial signal sequence data structure based on the chart
const initialSignalSequences = {
  1: {
    P1A: { red: "", yellow: "", greenLeft: "1", greenStraight: "", greenRight: "" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P2A: { red: "", yellow: "", greenLeft: "A", greenStraight: "A", greenRight: "A" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
  },
  2: {
    P1A: { red: "", yellow: "", greenLeft: "", greenStraight: "1", greenRight: "" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P2A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
  },
  3: {
    P1A: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "1" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P2A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
  },
  4: {
    P1A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P2A: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "1" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
  },
  5: {
    P1A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P2A: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "1" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
  },
  6: {
    P1A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P2A: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "1" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
  },
  7: {
    P1A: { red: "1", yellow: "", greenLeft: "", greenStraight: "0", greenRight: "0" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P2A: { red: "", yellow: "", greenLeft: "", greenStraight: "1", greenRight: "" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P3A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "0" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
    P4A: { red: "1", yellow: "", greenLeft: "", greenStraight: "0", greenRight: "0" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "" },
  },
  8: {
    P1A: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "A" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P2A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P3A: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "1", greenAll: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P4A: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "A" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
  },
  9: {
    P1A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P2A: { red: "", yellow: "", greenLeft: "", greenStraight: "A", greenRight: "0", greenAll: "" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P3A: { red: "", yellow: "", greenLeft: "", greenStraight: "1", greenRight: "", greenAll: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P4A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
  },
  10: {
    P1A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P2A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P3A: { red: "", yellow: "", greenLeft: "", greenStraight: "1", greenRight: "", greenAll: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P4A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
  },
  11: {
    P1A: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "A" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P2A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P3A: { red: "", yellow: "", greenLeft: "1", greenStraight: "", greenRight: "", greenAll: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P4A: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "A" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
  },
  12: {
    P1A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P2A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P3A: { red: "1", yellow: "", greenLeft: "", greenStraight: "1", greenRight: "", greenAll: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P4A: { red: "", yellow: "", greenLeft: "", greenStraight: "1", greenRight: "1", greenAll: "" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
  },
  13: {
    P1A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P2A: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "A" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P3A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P4A: { red: "", yellow: "", greenLeft: "1", greenStraight: "0", greenRight: "", greenAll: "" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
  },
  14: {
    P1A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P1B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P2A: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "A" },
    P2B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P3A: { red: "1", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P3B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
    P4A: { red: "", yellow: "", greenLeft: "1", greenStraight: "", greenRight: "", greenAll: "" },
    P4B: { red: "", yellow: "", greenLeft: "", greenStraight: "", greenRight: "", greenAll: "" },
  },
}

// Function to send sequence data to the server
async function sendSequenceToServer(sequenceData: any, route: number) {
  try {
    const response = await fetch("/api/update-sequence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route,
        sequenceData,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update sequence on server")
    }

    return await response.json()
  } catch (error) {
    console.error("Error updating sequence:", error)
    throw error
  }
}

// Function to fetch sequence data from the server
async function fetchSequenceFromServer() {
  try {
    const response = await fetch("/api/get-sequences")

    if (!response.ok) {
      throw new Error("Failed to fetch sequences from server")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching sequences:", error)
    throw error
  }
}

// Function to send command to hardware
async function sendCommandToHardware(pole: string, command: string) {
  try {
    // In a real implementation, you would use the actual IP address
    const ipAddresses: Record<string, string> = {
      P1A: "192.168.1.6",
      P1B: "192.168.1.7",
      P2A: "192.168.1.8",
      P2B: "192.168.1.9",
      P3A: "192.168.1.10",
      P3B: "192.168.1.11",
      P4A: "192.168.1.12",
      P4B: "192.168.1.13",
    }

    const ip = ipAddresses[pole]
    const url = `http://${ip}/${command}\n`

    // In a real implementation, you would use fetch to send the command
    console.log(`Sending command to ${pole} (${ip}): ${command}`)

    // Simulate a successful response
    return { success: true, response: "HTTP/1.1 200 OK" }
  } catch (error) {
    console.error(`Error sending command to ${pole}:`, error)
    return { success: false, error }
  }
}

export default function SequenceTester() {
  const [signalSequences, setSignalSequences] = useState(initialSignalSequences)
  const [activeRoute, setActiveRoute] = useState<number | null>(null)
  const [poleStates, setPoleStates] = useState({
    P1A: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false, greenAll: false },
    P1B: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false, greenAll: false },
    P2A: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false, greenAll: false },
    P2B: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false, greenAll: false },
    P3A: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false, greenAll: false },
    P3B: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false, greenAll: false },
    P4A: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false, greenAll: false },
    P4B: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false, greenAll: false },
  })

  const [isSimulating, setIsSimulating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [simulationSequence, setSimulationSequence] = useState<number[]>([])
  const [simulationSpeed, setSimulationSpeed] = useState(3000) // Default 3 seconds
  const [simulateOnHardware, setSimulateOnHardware] = useState(false)
  const [controlMode, setControlMode] = useState<"auto" | "manual" | "semi">("auto")

  // For editing sequence values
  const [editingCell, setEditingCell] = useState<{
    route: number
    pole: string
    signal: string
  } | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // For confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingChange, setPendingChange] = useState<{
    route: number
    pole: string
    signal: string
    value: string
  } | null>(null)

  // For server status
  const [isLoading, setIsLoading] = useState(false)
  const [serverStatus, setServerStatus] = useState<"connected" | "disconnected" | "error">("disconnected")

  // Fetch sequence data from server on component mount
  useEffect(() => {
    const loadSequences = async () => {
      setIsLoading(true)
      try {
        const data = await fetchSequenceFromServer()
        if (data && Object.keys(data).length > 0) {
          setSignalSequences(data)
        }
        setServerStatus("connected")
      } catch (error) {
        console.error("Failed to load sequences:", error)
        setServerStatus("error")
        toast({
          title: "Connection Error",
          description: "Could not load sequence data from the server. Using default values.",
          variant: "destructive",
        })
        // Continue with default values, no need to throw error
      } finally {
        setIsLoading(false)
      }
    }

    loadSequences()
  }, [])

  // Update pole states when a route is selected
  useEffect(() => {
    if (activeRoute) {
      const sequence = signalSequences[activeRoute as keyof typeof signalSequences]

      // Reset all states
      const newStates = {
        P1A: {
          red: false,
          yellow: false,
          greenLeft: false,
          greenStraight: false,
          greenRight: false,
          greenAll: false,
        },
        P1B: {
          red: false,
          yellow: false,
          greenLeft: false,
          greenStraight: false,
          greenRight: false,
          greenAll: false,
        },
        P2A: {
          red: false,
          yellow: false,
          greenLeft: false,
          greenStraight: false,
          greenRight: false,
          greenAll: false,
        },
        P2B: {
          red: false,
          yellow: false,
          greenLeft: false,
          greenStraight: false,
          greenRight: false,
          greenAll: false,
        },
        P3A: {
          red: false,
          yellow: false,
          greenLeft: false,
          greenStraight: false,
          greenRight: false,
          greenAll: false,
        },
        P3B: {
          red: false,
          yellow: false,
          greenLeft: false,
          greenStraight: false,
          greenRight: false,
          greenAll: false,
        },
        P4A: {
          red: false,
          yellow: false,
          greenLeft: false,
          greenStraight: false,
          greenRight: false,
          greenAll: false,
        },
        P4B: {
          red: false,
          yellow: false,
          greenLeft: false,
          greenStraight: false,
          greenRight: false,
          greenAll: false,
        },
      }

      // Set states based on the sequence
      Object.keys(sequence).forEach((pole) => {
        const poleKey = pole as keyof typeof sequence
        const signals = sequence[poleKey]

        Object.keys(signals).forEach((signal) => {
          const signalKey = signal as keyof typeof signals
          const value = signals[signalKey]

          if (value === "1" || value === "D") {
            newStates[poleKey][signalKey] = true
          } else if (value === "A") {
            newStates[poleKey].greenAll = true
            // When All Green is on, turn on all green signals
            newStates[poleKey].greenLeft = true
            newStates[poleKey].greenStraight = true
            newStates[poleKey].greenRight = true
          } else if (value === "0" || value === "C") {
            // Explicitly set to false
            newStates[poleKey][signalKey] = false
          }
        })
      })

      setPoleStates(newStates)

      toast({
        title: `Route ${activeRoute} Activated`,
        description: `Signal sequence for route ${activeRoute} has been applied.`,
      })
    }
  }, [activeRoute, signalSequences])

  // Handle simulation steps with yellow light behavior
  useEffect(() => {
    if (isSimulating && simulationSequence.length > 0) {
      const timer = setTimeout(() => {
        const nextRoute = simulationSequence[currentStep]
        const prevRoute =
          currentStep === 0 ? simulationSequence[simulationSequence.length - 1] : simulationSequence[currentStep - 1]

        // Check if we need to show yellow lights based on the transition
        if (prevRoute !== nextRoute) {
          // Create a copy of the current pole states
          const yellowStates = { ...poleStates }

          // Determine which poles are transitioning from green to red or between different green signals
          Object.keys(yellowStates).forEach((pole) => {
            const poleKey = pole as keyof typeof yellowStates
            const prevSequence = signalSequences[prevRoute][poleKey]
            const nextSequence = signalSequences[nextRoute][poleKey]

            // Case 1: Transitioning from any green to red
            const wasGreen =
              prevSequence.greenLeft === "1" ||
              prevSequence.greenStraight === "1" ||
              prevSequence.greenRight === "1" ||
              prevSequence.greenAll === "A"

            const willBeRed = nextSequence.red === "1"

            // Case 2: Transitioning from second green to third green
            const isTransitioningToThirdGreen =
              (prevSequence.greenStraight === "1" && nextSequence.greenRight === "1") ||
              (prevSequence.greenLeft === "1" && prevSequence.greenStraight !== "1" && nextSequence.greenRight === "1")

            if ((wasGreen && willBeRed) || isTransitioningToThirdGreen) {
              yellowStates[poleKey].yellow = true
              yellowStates[poleKey].greenLeft = false
              yellowStates[poleKey].greenStraight = false
              yellowStates[poleKey].greenRight = false
              yellowStates[poleKey].greenAll = false

              // If simulating on hardware, send the yellow light command
              if (simulateOnHardware) {
                sendCommandToHardware(pole as string, "yel_on")
                // Turn off all green lights
                sendCommandToHardware(pole as string, "grnL_off")
                sendCommandToHardware(pole as string, "grnS_off")
                sendCommandToHardware(pole as string, "grnR_off")
              }
            }
          })

          // Apply yellow states briefly
          setPoleStates(yellowStates)

          // After a short delay, apply the next route
          setTimeout(() => {
            setActiveRoute(nextRoute)

            // If simulating on hardware, send commands for the new route
            if (simulateOnHardware) {
              const sequence = signalSequences[nextRoute]
              Object.keys(sequence).forEach((pole) => {
                const signals = sequence[pole]
                Object.keys(signals).forEach((signal) => {
                  const value = signals[signal]
                  let command = ""

                  if (value === "1" || value === "A") {
                    switch (signal) {
                      case "red":
                        command = "red_on"
                        break
                      case "yellow":
                        command = "yel_on"
                        break
                      case "greenLeft":
                        command = "grnL_on"
                        break
                      case "greenStraight":
                        command = "grnS_on"
                        break
                      case "greenRight":
                        command = "grnR_on"
                        break
                      case "greenAll":
                        sendCommandToHardware(pole, "grnL_on")
                        sendCommandToHardware(pole, "grnS_on")
                        sendCommandToHardware(pole, "grnR_on")
                        break
                    }

                    if (command) {
                      sendCommandToHardware(pole, command)
                    }
                  } else if (value === "0" || value === "C") {
                    switch (signal) {
                      case "red":
                        command = "red_off"
                        break
                      case "yellow":
                        command = "yel_off"
                        break
                      case "greenLeft":
                        command = "grnL_off"
                        break
                      case "greenStraight":
                        command = "grnS_off"
                        break
                      case "greenRight":
                        command = "grnR_off"
                        break
                    }

                    if (command) {
                      sendCommandToHardware(pole, command)
                    }
                  }
                })
              })
            }

            const nextStep = (currentStep + 1) % simulationSequence.length
            setCurrentStep(nextStep)
          }, 1000) // Yellow light duration
        } else {
          // If it's the same route, just move to the next step
          setActiveRoute(nextRoute)
          const nextStep = (currentStep + 1) % simulationSequence.length
          setCurrentStep(nextStep)
        }
      }, simulationSpeed)

      return () => clearTimeout(timer)
    }
  }, [isSimulating, currentStep, simulationSequence, simulationSpeed, poleStates, signalSequences, simulateOnHardware])

  const handleRouteSelect = (route: number) => {
    setActiveRoute(route)
  }

  const startSimulation = () => {
    // Example sequence: routes 1 through 14 in order
    setSimulationSequence([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
    setCurrentStep(0)
    setIsSimulating(true)

    toast({
      title: "Simulation Started",
      description: "The traffic light sequence simulation has started.",
    })
  }

  const stopSimulation = () => {
    setIsSimulating(false)

    toast({
      title: "Simulation Stopped",
      description: "The traffic light sequence simulation has been stopped.",
    })
  }

  const changeSimulationSpeed = (speed: number) => {
    setSimulationSpeed(speed)
    toast({
      title: "Simulation Speed Changed",
      description: `Speed set to ${speed / 1000} seconds per step.`,
    })
  }

  const handleCellClick = (route: number, pole: string, signal: string) => {
    if (isSimulating) return // Don't allow editing during simulation

    setEditingCell({ route, pole, signal })
    setEditDialogOpen(true)
  }

  const handleCellValueChange = (value: string) => {
    if (!editingCell) return

    const { route, pole, signal } = editingCell

    // Store the pending change and show confirmation dialog
    setPendingChange({ route, pole, signal, value })
    setEditDialogOpen(false)
    setConfirmDialogOpen(true)
  }

  const confirmChange = async () => {
    if (!pendingChange) return

    const { route, pole, signal, value } = pendingChange

    // Create a deep copy of the signalSequences
    const newSequences = JSON.parse(JSON.stringify(signalSequences))

    // Update the value
    newSequences[route][pole][signal] = value

    setIsLoading(true)

    try {
      // Send the updated sequence to the server
      await sendSequenceToServer(newSequences[route], route)

      // Update state after successful server update
      setSignalSequences(newSequences)
      setConfirmDialogOpen(false)
      setPendingChange(null)
      setEditingCell(null)

      toast({
        title: "Sequence Updated",
        description: `Updated ${signal} for ${pole} in Route ${route} to ${value || "empty"} and sent to traffic controller.`,
      })

      // If the active route was modified, update the display
      if (activeRoute === route) {
        setActiveRoute(null)
        setTimeout(() => setActiveRoute(route), 10)
      }

      setServerStatus("connected")
    } catch (error) {
      console.error("Failed to update sequence on server:", error)
      setServerStatus("error")

      toast({
        title: "Update Failed",
        description: "Failed to send the updated sequence to the traffic controller. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const cancelChange = () => {
    setConfirmDialogOpen(false)
    setPendingChange(null)
    setEditingCell(null)
  }

  const handleControlModeChange = (mode: "auto" | "manual" | "semi") => {
    setControlMode(mode)
    toast({
      title: `Control Mode Changed`,
      description: `Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} Control mode.`,
    })
  }

  const routes = Array.from({ length: 14 }, (_, i) => i + 1)
  const poles = ["P1A", "P1B", "P2A", "P2B", "P3A", "P3B", "P4A", "P4B"]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Traffic Light Sequence Tester</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal">Server Status:</span>
              <span
                className={`inline-block w-3 h-3 rounded-full ${
                  serverStatus === "connected"
                    ? "bg-green-500"
                    : serverStatus === "error"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`}
              ></span>
              <span className="text-sm font-normal">
                {serverStatus === "connected" ? "Connected" : serverStatus === "error" ? "Error" : "Disconnected"}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Button
              variant={controlMode === "manual" ? "default" : "outline"}
              onClick={() => handleControlModeChange("manual")}
              className="w-full text-xs sm:text-sm"
              size="sm"
            >
              Manual Control
            </Button>
            <Button
              variant={controlMode === "auto" ? "default" : "outline"}
              onClick={() => handleControlModeChange("auto")}
              className="w-full text-xs sm:text-sm"
              size="sm"
            >
              Auto Control
            </Button>
            <Button
              variant={controlMode === "semi" ? "default" : "outline"}
              onClick={() => handleControlModeChange("semi")}
              className="w-full text-xs sm:text-sm"
              size="sm"
            >
              Semi Control
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Display poles in a grid */}
            {poles.map((pole) => (
              <div key={pole} className="border rounded-lg p-4">
                <h3 className="font-bold text-center mb-2">{pole}</h3>
                <div className="flex flex-col items-center space-y-2">
                  <div
                    className={`w-8 h-8 rounded-full ${poleStates[pole as keyof typeof poleStates].red ? "bg-red-500" : "bg-red-200"}`}
                  ></div>
                  <div
                    className={`w-8 h-8 rounded-full ${poleStates[pole as keyof typeof poleStates].yellow ? "bg-yellow-500" : "bg-yellow-200"}`}
                  ></div>
                  <div
                    className={`w-8 h-8 rounded-full ${poleStates[pole as keyof typeof poleStates].greenLeft ? "bg-green-500" : "bg-green-200"}`}
                  >
                    {poleStates[pole as keyof typeof poleStates].greenLeft && (
                      <span className="flex justify-center">←</span>
                    )}
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full ${poleStates[pole as keyof typeof poleStates].greenStraight ? "bg-green-500" : "bg-green-200"}`}
                  >
                    {poleStates[pole as keyof typeof poleStates].greenStraight && (
                      <span className="flex justify-center">↑</span>
                    )}
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full ${poleStates[pole as keyof typeof poleStates].greenRight ? "bg-green-500" : "bg-green-200"}`}
                  >
                    {poleStates[pole as keyof typeof poleStates].greenRight && (
                      <span className="flex justify-center">→</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">Route Selection</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1">
                {routes.map((route) => (
                  <Button
                    key={route}
                    variant={activeRoute === route ? "default" : "outline"}
                    onClick={() => handleRouteSelect(route)}
                    disabled={isSimulating}
                    size="sm"
                    className="text-xs"
                  >
                    Route {route}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Simulation Controls</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <div>
                  {!isSimulating ? (
                    <Button onClick={startSimulation} className="w-full">
                      Start Simulation
                    </Button>
                  ) : (
                    <Button onClick={stopSimulation} variant="destructive" className="w-full">
                      Stop Simulation
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeSimulationSpeed(1000)}
                    disabled={isSimulating}
                    className="text-xs"
                  >
                    1s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeSimulationSpeed(2000)}
                    disabled={isSimulating}
                    className="text-xs"
                  >
                    2s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeSimulationSpeed(3000)}
                    disabled={isSimulating}
                    className="text-xs"
                  >
                    3s
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeSimulationSpeed(5000)}
                    disabled={isSimulating}
                    className="text-xs"
                  >
                    5s
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="simulate-hardware" className="cursor-pointer">
                  Simulate on Hardware
                </Label>
                <input
                  type="checkbox"
                  id="simulate-hardware"
                  checked={simulateOnHardware}
                  onChange={() => setSimulateOnHardware(!simulateOnHardware)}
                  className="h-4 w-4"
                />
              </div>
              {isSimulating && (
                <p className="text-sm mt-2">
                  Currently simulating Route {simulationSequence[currentStep]}. Step {currentStep + 1} of{" "}
                  {simulationSequence.length}. Speed: {simulationSpeed / 1000}s per step.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Signal Sequence Chart</span>
            <span className="text-sm font-normal text-muted-foreground">
              Click on any cell to edit and apply to traffic controller
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                {poles.map((pole) => (
                  <TableHead key={pole} colSpan={6}>
                    {pole}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                <TableHead></TableHead>
                {poles.map((pole, index) => (
                  <React.Fragment key={index}>
                    <TableHead>R</TableHead>
                    <TableHead>Y</TableHead>
                    <TableHead>G&lt;</TableHead>
                    <TableHead>GS</TableHead>
                    <TableHead>G&gt;</TableHead>
                    <TableHead>GA</TableHead>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => {
                const sequence = signalSequences[route as keyof typeof signalSequences]
                return (
                  <TableRow key={route} className={activeRoute === route ? "bg-muted" : ""}>
                    <TableCell className="font-medium">{route}</TableCell>

                    {poles.map((pole) => (
                      <React.Fragment key={`${route}-${pole}`}>
                        <TableCell
                          className={`${
                            sequence[pole]?.red === "1"
                              ? "bg-red-100"
                              : sequence[pole]?.red === "C" || sequence[pole]?.red === "D"
                                ? "bg-orange-100"
                                : ""
                          } cursor-pointer hover:bg-gray-100`}
                          onClick={() => handleCellClick(route, pole, "red")}
                        >
                          {sequence[pole]?.red}
                        </TableCell>
                        <TableCell
                          className={`${
                            sequence[pole]?.yellow === "1"
                              ? "bg-yellow-100"
                              : sequence[pole]?.yellow === "C" || sequence[pole]?.yellow === "D"
                                ? "bg-orange-100"
                                : ""
                          } cursor-pointer hover:bg-gray-100`}
                          onClick={() => handleCellClick(route, pole, "yellow")}
                        >
                          {sequence[pole]?.yellow}
                        </TableCell>
                        <TableCell
                          className={`${
                            sequence[pole]?.greenLeft === "1"
                              ? "bg-green-100"
                              : sequence[pole]?.greenLeft === "C" || sequence[pole]?.greenLeft === "D"
                                ? "bg-orange-100"
                                : ""
                          } cursor-pointer hover:bg-gray-100`}
                          onClick={() => handleCellClick(route, pole, "greenLeft")}
                        >
                          {sequence[pole]?.greenLeft}
                        </TableCell>
                        <TableCell
                          className={`${
                            sequence[pole]?.greenStraight === "1"
                              ? "bg-green-100"
                              : sequence[pole]?.greenStraight === "C" || sequence[pole]?.greenStraight === "D"
                                ? "bg-orange-100"
                                : ""
                          } cursor-pointer hover:bg-gray-100`}
                          onClick={() => handleCellClick(route, pole, "greenStraight")}
                        >
                          {sequence[pole]?.greenStraight}
                        </TableCell>
                        <TableCell
                          className={`${
                            sequence[pole]?.greenRight === "1"
                              ? "bg-green-100"
                              : sequence[pole]?.greenRight === "C" || sequence[pole]?.greenRight === "D"
                                ? "bg-orange-100"
                                : ""
                          } cursor-pointer hover:bg-gray-100`}
                          onClick={() => handleCellClick(route, pole, "greenRight")}
                        >
                          {sequence[pole]?.greenRight}
                        </TableCell>
                        <TableCell
                          className={`${
                            sequence[pole]?.greenAll === "A"
                              ? "bg-green-100"
                              : sequence[pole]?.greenAll === "C" || sequence[pole]?.greenAll === "D"
                                ? "bg-orange-100"
                                : ""
                          } cursor-pointer hover:bg-gray-100`}
                          onClick={() => handleCellClick(route, pole, "greenAll")}
                        >
                          {sequence[pole]?.greenAll}
                        </TableCell>
                      </React.Fragment>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Edit Signal Value
              {editingCell && (
                <span className="font-normal text-sm text-muted-foreground ml-2">
                  (Route {editingCell.route}, {editingCell.pole}, {editingCell.signal})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup defaultValue="" className="space-y-2" onValueChange={handleCellValueChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="empty" />
                <Label htmlFor="empty">Empty (No value)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="on" />
                <Label htmlFor="on" className="text-green-600 font-medium">
                  ON (1)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id="off" />
                <Label htmlFor="off">OFF (0)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A" id="all-green" />
                <Label htmlFor="all-green" className="text-green-600 font-medium">
                  ALL GREEN ON (A)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="X" id="not-used" />
                <Label htmlFor="not-used" className="text-orange-600">
                  Light Not Used (X)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="C" id="compulsory-off" />
                <Label htmlFor="compulsory-off" className="text-orange-600 font-medium">
                  COMPULSORY OFF (C)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="D" id="compulsory-on" />
                <Label htmlFor="compulsory-on" className="text-orange-600 font-medium">
                  COMPULSORY ON (D)
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Signal Change</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingChange && (
                <>
                  You are about to change {pendingChange.signal} for {pendingChange.pole}
                  in Route {pendingChange.route} to {pendingChange.value || "empty"}.
                  <br />
                  <br />
                  <strong className="text-red-600">
                    This change will be applied to the actual traffic controller.
                  </strong>
                  <br />
                  <br />
                  Are you sure you want to proceed?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelChange} disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange} disabled={isLoading}>
              {isLoading ? "Updating..." : "Yes, Update Traffic Controller"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

