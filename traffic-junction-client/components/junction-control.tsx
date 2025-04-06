"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCommunicationService } from "@/lib/communication-service"

export default function JunctionControl() {
  const [selectedPole, setSelectedPole] = useState<string | null>(null)

  // Change the poles array to use simplified naming
  const poles = ["P1", "P2", "P3", "P4"]

  // Update the Time Zones state to use simplified pole names
  const [timeZones, setTimeZones] = useState([
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
  ])

  // Update the priorities state to use simplified pole names
  const [priorities, setPriorities] = useState({
    P1: { greenLeft: 1, greenStraight: 2, greenRight: 3 },
    P2: { greenLeft: 3, greenStraight: 1, greenRight: 2 },
    P3: { greenLeft: 3, greenStraight: 2, greenRight: 1 },
    P4: { greenLeft: 2, greenStraight: 3, greenRight: 1 },
  })

  // Update the signalStatus state to use simplified pole names
  const [signalStatus, setSignalStatus] = useState<Record<string, string>>({
    P1: "red",
    P2: "red",
    P3: "red",
    P4: "red",
  })

  const [showSignalDialog, setShowSignalDialog] = useState(false)
  const [currentSignalType, setCurrentSignalType] = useState("")
  const [selectedTimeZone, setSelectedTimeZone] = useState<number>(1)
  const [isSimulating, setIsSimulating] = useState(false)
  const [userConfiguredTimings, setUserConfiguredTimings] = useState(false)
  const [controlMode, setControlMode] = useState<"auto" | "manual" | "semi">("auto")
  const [communicationStatus, setCommunicationStatus] = useState<string>("disconnected")

  // Subscribe to communication service status
  useEffect(() => {
    const communicationService = getCommunicationService()
    const unsubscribe = communicationService.onStatusChange((status) => {
      setCommunicationStatus(status)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handlePoleSelect = (poleName: string) => {
    setSelectedPole(poleName)
    toast({
      title: `${poleName} selected`,
      description: "You can now update the signals for this pole.",
    })
  }

  const handleTimeUpdate = async (timeZoneId: number) => {
    try {
      // Get the time zone data
      const timeZone = timeZones.find((tz) => tz.id === timeZoneId)
      if (!timeZone) return

      // Send the time zone data to the Raspberry Pi
      const communicationService = getCommunicationService()
      await communicationService.sendCommand({
        target: "system",
        action: "update_time_zone",
        value: timeZone,
      })

      toast({
        title: "Time values updated",
        description: `Updated timing values for ${selectedTimeZone ? `Time Zone ${timeZoneId}` : "all time zones"}.`,
      })
    } catch (error) {
      console.error("Error updating time zone:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update time zone values. Check the connection to the Raspberry Pi.",
        variant: "destructive",
      })
    }
  }

  const handleSequenceUpdate = async () => {
    try {
      // Send the current signal status to the Raspberry Pi
      const communicationService = getCommunicationService()
      await communicationService.sendCommand({
        target: "system",
        action: "update_sequence",
        value: signalStatus,
      })

      toast({
        title: "Sequence updated",
        description: "The signal sequence has been updated and sent to the junction controller.",
      })
    } catch (error) {
      console.error("Error updating sequence:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update sequence. Check the connection to the Raspberry Pi.",
        variant: "destructive",
      })
    }
  }

  const openSignalDialog = (signalType: string) => {
    if (!selectedPole) {
      toast({
        title: "No pole selected",
        description: "Please select a pole first.",
        variant: "destructive",
      })
      return
    }

    setCurrentSignalType(signalType)
    setShowSignalDialog(true)
  }

  const handleSignalStatusChange = async (value: string) => {
    setShowSignalDialog(false)

    let newStatus = "red"
    switch (value) {
      case "1":
        newStatus = "green"
        break
      case "0":
        newStatus = "red"
        break
      case "A":
        newStatus = "green"
        break
      case "Y":
        newStatus = "yellow"
        break
      default:
        newStatus = "red"
    }

    setSignalStatus((prev) => ({
      ...prev,
      [selectedPole!]: newStatus,
    }))

    try {
      // Send the command to the Raspberry Pi
      const communicationService = getCommunicationService()

      // Map the signal type to the appropriate action
      let action = ""
      switch (currentSignalType) {
        case "Red":
          action = value === "1" ? "red_on" : "red_off"
          break
        case "Yellow":
          action = value === "1" ? "yel_on" : "yel_off"
          break
        case "Green Left":
          action = value === "1" ? "grnL_on" : "grnL_off"
          break
        case "Green Straight":
          action = value === "1" ? "grnS_on" : "grnS_off"
          break
        case "Green Right":
          action = value === "1" ? "grnR_on" : "grnR_off"
          break
        case "All Green":
          action = "all_green"
          break
      }

      if (action && selectedPole) {
        // Send to both A and B poles
        await communicationService.sendCommand({
          target: `${selectedPole}A`,
          action,
        })

        await communicationService.sendCommand({
          target: `${selectedPole}B`,
          action,
        })
      }

      toast({
        title: `Signal updated`,
        description: `${currentSignalType} signal has been set to ${value} for ${selectedPole}.`,
      })
    } catch (error) {
      console.error("Error updating signal:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update signal. Check the connection to the Raspberry Pi.",
        variant: "destructive",
      })
    }
  }

  const handleAllLights = async (status: string) => {
    const newStatus = { ...signalStatus }
    poles.forEach((pole) => {
      newStatus[pole] = status
    })
    setSignalStatus(newStatus)

    try {
      // Send the command to all poles
      const communicationService = getCommunicationService()

      // Create an array of commands for all poles
      const commands = []

      for (const pole of poles) {
        const poleA = `${pole}A`
        const poleB = `${pole}B`

        const action = ""
        switch (status) {
          case "red":
            commands.push({ target: poleA, action: "red_on" })
            commands.push({ target: poleB, action: "red_on" })
            commands.push({ target: poleA, action: "yel_off" })
            commands.push({ target: poleB, action: "yel_off" })
            commands.push({ target: poleA, action: "grnL_off" })
            commands.push({ target: poleB, action: "grnL_off" })
            commands.push({ target: poleA, action: "grnS_off" })
            commands.push({ target: poleB, action: "grnS_off" })
            commands.push({ target: poleA, action: "grnR_off" })
            commands.push({ target: poleB, action: "grnR_off" })
            break
          case "yellow":
            commands.push({ target: poleA, action: "red_off" })
            commands.push({ target: poleB, action: "red_off" })
            commands.push({ target: poleA, action: "yel_on" })
            commands.push({ target: poleB, action: "yel_on" })
            commands.push({ target: poleA, action: "grnL_off" })
            commands.push({ target: poleB, action: "grnL_off" })
            commands.push({ target: poleA, action: "grnS_off" })
            commands.push({ target: poleB, action: "grnS_off" })
            commands.push({ target: poleA, action: "grnR_off" })
            commands.push({ target: poleB, action: "grnR_off" })
            break
          case "green":
            commands.push({ target: poleA, action: "red_off" })
            commands.push({ target: poleB, action: "red_off" })
            commands.push({ target: poleA, action: "yel_off" })
            commands.push({ target: poleB, action: "yel_off" })
            commands.push({ target: poleA, action: "grnL_on" })
            commands.push({ target: poleB, action: "grnL_on" })
            commands.push({ target: poleA, action: "grnS_on" })
            commands.push({ target: poleB, action: "grnS_on" })
            commands.push({ target: poleA, action: "grnR_on" })
            commands.push({ target: poleB, action: "grnR_on" })
            break
        }
      }

      // Send all commands in batch
      await communicationService.sendBatchCommands(commands)

      toast({
        title: `All signals updated`,
        description: `All signals have been set to ${status.toUpperCase()}`,
      })
    } catch (error) {
      console.error("Error updating all signals:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update all signals. Check the connection to the Raspberry Pi.",
        variant: "destructive",
      })
    }
  }

  const handlePriorityChange = async (pole: string, signal: string, priority: number) => {
    const newPriorities = { ...priorities }
    newPriorities[pole as keyof typeof priorities][signal as keyof (typeof priorities)[keyof typeof priorities]] =
      priority
    setPriorities(newPriorities)

    try {
      // Send the priority update to the Raspberry Pi
      const communicationService = getCommunicationService()
      await communicationService.sendCommand({
        target: "system",
        action: "update_priority",
        value: {
          pole,
          signal,
          priority,
        },
      })

      toast({
        title: "Priority updated",
        description: `Updated priority for ${signal} on ${pole} to ${priority}.`,
      })
    } catch (error) {
      console.error("Error updating priority:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update priority. Check the connection to the Raspberry Pi.",
        variant: "destructive",
      })
    }
  }

  const handleTimeZoneNameChange = (index: number, name: string) => {
    const newTimeZones = [...timeZones]
    newTimeZones[index].name = name
    setTimeZones(newTimeZones)
  }

  const handleTimePeriodChange = (timeZoneId: number, pole: string, signal: string, value: number) => {
    const timeZoneIndex = timeZones.findIndex((tz) => tz.id === timeZoneId)
    if (timeZoneIndex === -1) return

    const newTimeZones = [...timeZones]
    newTimeZones[timeZoneIndex].timePeriods[pole][signal] = value
    setTimeZones(newTimeZones)
  }

  const handleControlModeChange = async (mode: "auto" | "manual" | "semi") => {
    setControlMode(mode)

    try {
      // Send the control mode change to the Raspberry Pi
      const communicationService = getCommunicationService()
      await communicationService.sendCommand({
        target: "system",
        action: "set_control_mode",
        value: mode,
      })

      toast({
        title: `Control Mode Changed`,
        description: `Switched to ${mode.charAt(0).toUpperCase() + mode.slice(1)} Control mode.`,
      })
    } catch (error) {
      console.error("Error changing control mode:", error)
      toast({
        title: "Update Failed",
        description: "Failed to change control mode. Check the connection to the Raspberry Pi.",
        variant: "destructive",
      })
    }
  }

  const handleSimulateOnHardware = async () => {
    toast({
      title: "Simulating on Hardware",
      description: "Sending commands to physical traffic control boards...",
    })

    try {
      // Send the current configuration to the Raspberry Pi
      const communicationService = getCommunicationService()

      // Send the current state as a simulation command
      await communicationService.sendCommand({
        target: "system",
        action: "simulate",
        value: {
          signalStatus,
          timeZones,
          priorities,
          controlMode,
        },
      })

      toast({
        title: "Simulation Complete",
        description: "Hardware has been updated with the current configuration.",
      })
    } catch (error) {
      console.error("Error simulating on hardware:", error)
      toast({
        title: "Simulation Failed",
        description: "Failed to simulate on hardware. Check the connection to the Raspberry Pi.",
        variant: "destructive",
      })
    }
  }

  // Replace the junction map display section with the new image
  // Update the pole markers to use the simplified naming
  return (
    <div className="flex flex-col lg:flex-row w-full gap-4">
      <div className="flex-1 flex justify-center items-center border rounded-lg p-4 bg-gray-100">
        <div className="relative">
          {/* Display the new image */}
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Signal_Layout_31_3_2025-ObbmyjWhgnTvmwMWjGgs8NxIqcxxOJ.png"
            alt="Traffic Junction Map"
            className="max-w-full h-auto"
          />

          {/* Communication status indicator */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-md">
            <div
              className={`w-3 h-3 rounded-full ${
                communicationStatus === "connected"
                  ? "bg-green-500"
                  : communicationStatus === "error"
                    ? "bg-red-500"
                    : "bg-yellow-500"
              }`}
            ></div>
            <span className="text-xs font-medium capitalize">{communicationStatus}</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 space-y-4">
        <Tabs defaultValue="poles">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="poles" className="text-xs sm:text-sm">
              Poles
            </TabsTrigger>
            <TabsTrigger value="timezones" className="text-xs sm:text-sm">
              Time Zones
            </TabsTrigger>
            <TabsTrigger value="priorities" className="text-xs sm:text-sm">
              Priorities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="poles" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-bold mb-2">Control Mode</h3>
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

              <h3 className="font-bold mb-2">Pole Selection</h3>
              <div className="grid grid-cols-2 gap-2">
                {poles.map((pole) => (
                  <Button
                    key={pole}
                    variant={selectedPole === pole ? "default" : "outline"}
                    onClick={() => handlePoleSelect(pole)}
                  >
                    {pole}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-bold mb-2">Direct Signal Control</h3>
              <p className="text-sm mb-2">
                {selectedPole ? `Controlling signals for ${selectedPole}` : "Select a pole first"}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => openSignalDialog("Green Left")}
                  variant="outline"
                  className="border-green-500 text-green-700 h-auto py-1 text-xs sm:text-sm"
                  disabled={!selectedPole}
                  size="sm"
                >
                  Green Left ON
                </Button>
                <Button
                  onClick={() => openSignalDialog("Green Straight")}
                  variant="outline"
                  className="border-green-500 text-green-700 h-auto py-1 text-xs sm:text-sm"
                  disabled={!selectedPole}
                  size="sm"
                >
                  Green Straight ON
                </Button>
                <Button
                  onClick={() => openSignalDialog("Green Right")}
                  variant="outline"
                  className="border-green-500 text-green-700 h-auto py-1 text-xs sm:text-sm"
                  disabled={!selectedPole}
                  size="sm"
                >
                  Green Right ON
                </Button>
                <Button
                  onClick={() => openSignalDialog("All Green")}
                  variant="outline"
                  className="border-green-500 text-green-700 h-auto py-1 text-xs sm:text-sm"
                  disabled={!selectedPole}
                  size="sm"
                >
                  All Green ON
                </Button>
                <Button
                  onClick={() => openSignalDialog("Red")}
                  variant="outline"
                  className="border-red-500 text-red-700 h-auto py-1 text-xs sm:text-sm"
                  disabled={!selectedPole}
                  size="sm"
                >
                  Red ON
                </Button>
                <Button
                  onClick={() => openSignalDialog("Yellow")}
                  variant="outline"
                  className="border-yellow-500 text-yellow-700 h-auto py-1 text-xs sm:text-sm"
                  disabled={!selectedPole}
                  size="sm"
                >
                  Yellow ON
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-2 mt-4">
                <Button
                  className="w-full text-xs sm:text-sm"
                  onClick={handleSequenceUpdate}
                  disabled={!selectedPole}
                  size="sm"
                >
                  Apply Direct Controls to Junction Controller
                </Button>
                <Button className="w-full text-xs sm:text-sm" variant="outline" disabled={!selectedPole} size="sm">
                  Overlap Route Control
                </Button>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    className="w-full text-xs sm:text-sm"
                    variant={userConfiguredTimings ? "default" : "outline"}
                    onClick={() => setUserConfiguredTimings(!userConfiguredTimings)}
                    size="sm"
                  >
                    Set User Configured Timings
                  </Button>
                  <Button className="w-full text-xs sm:text-sm" onClick={handleSimulateOnHardware} size="sm">
                    Simulate on Hardware
                  </Button>
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium mb-2">Control All Signals</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => handleAllLights("green")}
                    className="w-full bg-green-500 hover:bg-green-600 text-xs sm:text-sm"
                    size="sm"
                  >
                    All Green
                  </Button>
                  <Button
                    onClick={() => handleAllLights("yellow")}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black text-xs sm:text-sm"
                    size="sm"
                  >
                    All Yellow
                  </Button>
                  <Button
                    onClick={() => handleAllLights("red")}
                    className="w-full bg-red-500 hover:bg-red-600 text-xs sm:text-sm"
                    size="sm"
                  >
                    All Red
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="timezones" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-bold mb-2">Time Zone Configuration</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Set time zones and pole sequence for each time period.
              </p>

              {timeZones.map((zone, index) => (
                <div key={zone.id} className="border p-2 rounded mb-4">
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <Label htmlFor={`zoneName-${zone.id}`}>Zone Name:</Label>
                      <Input
                        id={`zoneName-${zone.id}`}
                        value={zone.name}
                        onChange={(e) => handleTimeZoneNameChange(index, e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <div>
                      <Label htmlFor={`startTime-${zone.id}`}>Start Time:</Label>
                      <Input
                        id={`startTime-${zone.id}`}
                        type="time"
                        value={zone.startTime}
                        onChange={(e) => {
                          const newZones = [...timeZones]
                          newZones[index].startTime = e.target.value
                          setTimeZones(newZones)
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`endTime-${zone.id}`}>End Time:</Label>
                      <Input
                        id={`endTime-${zone.id}`}
                        type="time"
                        value={zone.endTime}
                        onChange={(e) => {
                          const newZones = [...timeZones]
                          newZones[index].endTime = e.target.value
                          setTimeZones(newZones)
                        }}
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <Label htmlFor={`sequence-${zone.id}`}>Route Sequence:</Label>
                    <Input
                      id={`sequence-${zone.id}`}
                      value={zone.sequence}
                      onChange={(e) => {
                        const newZones = [...timeZones]
                        newZones[index].sequence = e.target.value
                        setTimeZones(newZones)
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Enter route numbers 1-14 separated by commas</p>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Time Periods</h4>
                    <Select value={selectedPole || "P1"} onValueChange={(value) => setSelectedPole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Pole" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P1">P1</SelectItem>
                        <SelectItem value="P2">P2</SelectItem>
                        <SelectItem value="P3">P3</SelectItem>
                        <SelectItem value="P4">P4</SelectItem>
                      </SelectContent>
                    </Select>

                    {selectedPole && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`red-${zone.id}-${selectedPole}`} className="w-24">
                            Red Time:
                          </Label>
                          <Input
                            id={`red-${zone.id}-${selectedPole}`}
                            type="number"
                            value={zone.timePeriods[selectedPole].red}
                            onChange={(e) =>
                              handleTimePeriodChange(zone.id, selectedPole, "red", Number.parseInt(e.target.value))
                            }
                            className="flex-1"
                          />
                          <span className="text-sm">sec</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`yellow-${zone.id}-${selectedPole}`} className="w-24">
                            Yellow Time:
                          </Label>
                          <Input
                            id={`yellow-${zone.id}-${selectedPole}`}
                            type="number"
                            value={zone.timePeriods[selectedPole].yellow}
                            onChange={(e) =>
                              handleTimePeriodChange(zone.id, selectedPole, "yellow", Number.parseInt(e.target.value))
                            }
                            className="flex-1"
                          />
                          <span className="text-sm">sec</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`greenLeft-${zone.id}-${selectedPole}`} className="w-24">
                            Green Left:
                          </Label>
                          <Input
                            id={`greenLeft-${zone.id}-${selectedPole}`}
                            type="number"
                            value={zone.timePeriods[selectedPole].greenLeft}
                            onChange={(e) =>
                              handleTimePeriodChange(
                                zone.id,
                                selectedPole,
                                "greenLeft",
                                Number.parseInt(e.target.value),
                              )
                            }
                            className="flex-1"
                          />
                          <span className="text-sm">sec</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`greenStraight-${zone.id}-${selectedPole}`} className="w-24">
                            Green Straight:
                          </Label>
                          <Input
                            id={`greenStraight-${zone.id}-${selectedPole}`}
                            type="number"
                            value={zone.timePeriods[selectedPole].greenStraight}
                            onChange={(e) =>
                              handleTimePeriodChange(
                                zone.id,
                                selectedPole,
                                "greenStraight",
                                Number.parseInt(e.target.value),
                              )
                            }
                            className="flex-1"
                          />
                          <span className="text-sm">sec</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`greenRight-${zone.id}-${selectedPole}`} className="w-24">
                            Green Right:
                          </Label>
                          <Input
                            id={`greenRight-${zone.id}-${selectedPole}`}
                            type="number"
                            value={zone.timePeriods[selectedPole].greenRight}
                            onChange={(e) =>
                              handleTimePeriodChange(
                                zone.id,
                                selectedPole,
                                "greenRight",
                                Number.parseInt(e.target.value),
                              )
                            }
                            className="flex-1"
                          />
                          <span className="text-sm">sec</span>
                        </div>
                      </div>
                    )}

                    <Button className="w-full mt-2" onClick={() => handleTimeUpdate(zone.id)}>
                      Update Time Periods
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="mb-2"
                onClick={() => {
                  const newId = timeZones.length + 1
                  setTimeZones([
                    ...timeZones,
                    {
                      id: newId,
                      name: `Time Zone ${newId}`,
                      startTime: "00:00",
                      endTime: "00:00",
                      sequence: "1,2,3,4,5,6,7,8,9,10,11,12,13,14",
                      timePeriods: {
                        P1: { red: 60, yellow: 5, greenLeft: 30, greenStraight: 25, greenRight: 20 },
                        P2: { red: 60, yellow: 5, greenLeft: 20, greenStraight: 30, greenRight: 25 },
                        P3: { red: 60, yellow: 5, greenLeft: 20, greenStraight: 25, greenRight: 30 },
                        P4: { red: 60, yellow: 5, greenLeft: 25, greenStraight: 20, greenRight: 30 },
                      },
                    },
                  ])
                }}
              >
                Add Time Zone
              </Button>

              <Button
                className="w-full"
                onClick={async () => {
                  try {
                    // Send all time zones to the Raspberry Pi
                    const communicationService = getCommunicationService()
                    await communicationService.sendCommand({
                      target: "system",
                      action: "update_all_time_zones",
                      value: timeZones,
                    })

                    toast({
                      title: "Time Zones Updated",
                      description: "Time zone configurations have been sent to the junction controller.",
                    })
                  } catch (error) {
                    console.error("Error updating all time zones:", error)
                    toast({
                      title: "Update Failed",
                      description: "Failed to update time zones. Check the connection to the Raspberry Pi.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                Update Time Zones to Junction Controller
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="priorities" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-bold mb-2">Green Signal Priorities</h3>
              <p className="text-sm text-muted-foreground mb-2">Set priorities for green signals for each pole.</p>

              <div className="space-y-4">
                {Object.keys(priorities).map((pole) => (
                  <div key={pole} className="border p-3 rounded">
                    <h4 className="font-medium mb-2">{pole}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="w-32">GREEN LEFT:</Label>
                        <Select
                          value={priorities[pole as keyof typeof priorities].greenLeft.toString()}
                          onValueChange={(value) => handlePriorityChange(pole, "greenLeft", Number.parseInt(value))}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="w-32">GREEN STRAIGHT:</Label>
                        <Select
                          value={priorities[pole as keyof typeof priorities].greenStraight.toString()}
                          onValueChange={(value) => handlePriorityChange(pole, "greenStraight", Number.parseInt(value))}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="w-32">GREEN RIGHT:</Label>
                        <Select
                          value={priorities[pole as keyof typeof priorities].greenRight.toString()}
                          onValueChange={(value) => handlePriorityChange(pole, "greenRight", Number.parseInt(value))}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full mt-4"
                onClick={async () => {
                  try {
                    // Send all priorities to the Raspberry Pi
                    const communicationService = getCommunicationService()
                    await communicationService.sendCommand({
                      target: "system",
                      action: "update_all_priorities",
                      value: priorities,
                    })

                    toast({
                      title: "Priorities Updated",
                      description: "Green signal priorities have been updated and sent to the junction controller.",
                    })
                  } catch (error) {
                    console.error("Error updating all priorities:", error)
                    toast({
                      title: "Update Failed",
                      description: "Failed to update priorities. Check the connection to the Raspberry Pi.",
                      variant: "destructive",
                    })
                  }
                }}
              >
                Update Priorities to Junction Controller
              </Button>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Signal Status Dialog */}
        <Dialog open={showSignalDialog} onOpenChange={setShowSignalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Signal Status for {currentSignalType}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <RadioGroup defaultValue="1" className="space-y-2" onValueChange={handleSignalStatusChange}>
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
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

