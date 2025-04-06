"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useSyncedState } from "@/lib/sync-service"

export default function DiagnosticsPanel() {
  const [syncedState] = useSyncedState()
  const [ipAddresses, setIpAddresses] = useState<Record<string, string>>({
    P1A: "192.168.1.6",
    P1B: "192.168.1.7",
    P2A: "192.168.1.8",
    P2B: "192.168.1.9",
    P3A: "192.168.1.10",
    P3B: "192.168.1.11",
    P4A: "192.168.1.12",
    P4B: "192.168.1.13",
  })

  const [poleStatus, setPoleStatus] = useState({
    P1A: "offline",
    P1B: "offline",
    P2A: "offline",
    P2B: "offline",
    P3A: "offline",
    P3B: "offline",
    P4A: "offline",
    P4B: "offline",
  })

  const [pingResults, setPingResults] = useState<Record<string, { latency: number; lastResponse: string }>>({
    P1A: { latency: 0, lastResponse: "" },
    P1B: { latency: 0, lastResponse: "" },
    P2A: { latency: 0, lastResponse: "" },
    P2B: { latency: 0, lastResponse: "" },
    P3A: { latency: 0, lastResponse: "" },
    P3B: { latency: 0, lastResponse: "" },
    P4A: { latency: 0, lastResponse: "" },
    P4B: { latency: 0, lastResponse: "" },
  })

  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false)
  const [diagnosticProgress, setDiagnosticProgress] = useState(0)
  const [lastDiagnosticTime, setLastDiagnosticTime] = useState<string | null>(null)

  // Load IP addresses from synced state
  useEffect(() => {
    if (syncedState.ipAddresses) {
      setIpAddresses(syncedState.ipAddresses)
    }
  }, [syncedState.ipAddresses])

  // Function to ping a pole and update its status
  const pingPole = async (pole: string) => {
    try {
      const ip = ipAddresses[pole as keyof typeof ipAddresses]
      // In a real implementation, you would use fetch to ping the device
      // For demo purposes, we'll simulate a random response
      const isOnline = Math.random() > 0.3 // 70% chance of being online
      const latency = isOnline ? Math.floor(Math.random() * 100) + 5 : 0 // Random latency between 5-105ms
      const response = isOnline ? "HTTP/1.1 200 OK" : "Connection timeout"

      setPoleStatus((prev) => ({
        ...prev,
        [pole]: isOnline ? "online" : "offline",
      }))

      setPingResults((prev) => ({
        ...prev,
        [pole]: { latency, lastResponse: response },
      }))

      return { success: isOnline, latency, response }
    } catch (error) {
      console.error(`Error pinging ${pole}:`, error)
      setPoleStatus((prev) => ({
        ...prev,
        [pole]: "error",
      }))
      setPingResults((prev) => ({
        ...prev,
        [pole]: { latency: 0, lastResponse: "Error: " + (error as Error).message },
      }))
      return { success: false, latency: 0, response: "Error: " + (error as Error).message }
    }
  }

  // Function to ping all poles
  const pingAllPoles = async () => {
    setIsRunningDiagnostics(true)
    setDiagnosticProgress(0)

    const poles = Object.keys(ipAddresses)
    let progress = 0

    for (const pole of poles) {
      await pingPole(pole)
      progress += 100 / poles.length
      setDiagnosticProgress(Math.min(progress, 100))
    }

    setIsRunningDiagnostics(false)
    setDiagnosticProgress(100)
    setLastDiagnosticTime(new Date().toLocaleTimeString())

    toast({
      title: "Diagnostic Complete",
      description: "All poles have been pinged and their status updated.",
    })
  }

  // Function to send a test command to a pole
  const sendTestCommand = async (pole: string) => {
    try {
      const ip = ipAddresses[pole as keyof typeof ipAddresses]
      // In a real implementation, you would use fetch to send a test command
      // For demo purposes, we'll simulate a random response
      const isSuccess = Math.random() > 0.2 // 80% chance of success

      if (isSuccess) {
        toast({
          title: "Test Command Successful",
          description: `Successfully sent test command to ${pole} (${ip})`,
        })
      } else {
        toast({
          title: "Test Command Failed",
          description: `Failed to send test command to ${pole} (${ip})`,
          variant: "destructive",
        })
      }

      return isSuccess
    } catch (error) {
      console.error(`Error sending test command to ${pole}:`, error)
      toast({
        title: "Test Command Error",
        description: `Error sending test command to ${pole}: ${(error as Error).message}`,
        variant: "destructive",
      })
      return false
    }
  }

  useEffect(() => {
    // Run initial diagnostics when the component mounts
    pingAllPoles()

    // Set up a timer to ping all poles every 60 seconds
    const timer = setInterval(pingAllPoles, 60000)

    return () => clearInterval(timer)
  }, [ipAddresses]) // Re-run when IP addresses change

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Traffic Control Board Diagnostics</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal">Last Updated:</span>
              <span className="text-sm font-medium">{lastDiagnosticTime || "Never"}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Button onClick={pingAllPoles} disabled={isRunningDiagnostics} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isRunningDiagnostics ? "animate-spin" : ""}`} />
              {isRunningDiagnostics ? "Running Diagnostics..." : "Run Diagnostics"}
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm">Status:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs">{Object.values(poleStatus).filter((s) => s === "online").length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs">{Object.values(poleStatus).filter((s) => s === "offline").length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs">{Object.values(poleStatus).filter((s) => s === "error").length}</span>
              </div>
            </div>
          </div>

          {isRunningDiagnostics && (
            <div className="mb-4">
              <Progress value={diagnosticProgress} className="h-2" />
              <p className="text-xs text-center mt-1">Testing connections to all traffic control boards...</p>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pole</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Last Response</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(ipAddresses).map(([pole, ip]) => (
                <TableRow key={pole}>
                  <TableCell className="font-medium">{pole}</TableCell>
                  <TableCell>{ip}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${
                        poleStatus[pole as keyof typeof poleStatus] === "online"
                          ? "bg-green-500"
                          : poleStatus[pole as keyof typeof poleStatus] === "error"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {poleStatus[pole as keyof typeof poleStatus] === "online" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : poleStatus[pole as keyof typeof poleStatus] === "error" ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        <span>
                          {poleStatus[pole as keyof typeof poleStatus] === "online"
                            ? "Online"
                            : poleStatus[pole as keyof typeof poleStatus] === "error"
                              ? "Error"
                              : "Offline"}
                        </span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>{pingResults[pole]?.latency > 0 ? `${pingResults[pole].latency}ms` : "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">{pingResults[pole]?.lastResponse || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pingPole(pole)}
                        disabled={isRunningDiagnostics}
                      >
                        Ping
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendTestCommand(pole)}
                        disabled={isRunningDiagnostics || poleStatus[pole as keyof typeof poleStatus] !== "online"}
                      >
                        Test
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-2">Network Status</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm">Connection Quality:</span>
                <Badge className="bg-green-500">Good</Badge>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs">Poor</span>
                  <span className="text-xs">Excellent</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-2">Device Availability</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm">Online Devices:</span>
                <span className="font-medium">
                  {Object.values(poleStatus).filter((s) => s === "online").length} / {Object.keys(poleStatus).length}
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(Object.values(poleStatus).filter((s) => s === "online").length / Object.keys(poleStatus).length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium mb-2">System Uptime</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Restart:</span>
                <span className="font-medium">3 days ago</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                System has been running without issues for 3 days, 7 hours, 22 minutes.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

