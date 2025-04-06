"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type CommunicationConfig,
  type CommunicationProtocol,
  defaultConfig,
  getCommunicationService,
} from "@/lib/communication-service"
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Save } from "lucide-react"

export default function CommunicationSettings() {
  const [config, setConfig] = useState<CommunicationConfig>(defaultConfig)
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected")
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize with stored config if available
  useEffect(() => {
    const storedConfig = localStorage.getItem("communicationConfig")
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig)
        setConfig(parsedConfig)
      } catch (error) {
        console.error("Error parsing stored config:", error)
      }
    }

    // Subscribe to connection status changes
    const communicationService = getCommunicationService()
    const unsubscribe = communicationService.onStatusChange((status) => {
      setConnectionStatus(status)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleProtocolChange = (protocol: CommunicationProtocol) => {
    setConfig((prev) => ({ ...prev, protocol }))
  }

  const handleInputChange = (field: keyof CommunicationConfig, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const saveConfig = () => {
    setIsSaving(true)

    try {
      // Save to local storage
      localStorage.setItem("communicationConfig", JSON.stringify(config))

      // Update the communication service
      const communicationService = getCommunicationService(config)

      toast({
        title: "Configuration Saved",
        description: "Communication settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving config:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save communication settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const testConnection = async () => {
    setIsTesting(true)

    try {
      const communicationService = getCommunicationService(config)

      // Send a test command
      const result = await communicationService.sendCommand({
        target: "system",
        action: "ping",
        timestamp: Date.now(),
      })

      toast({
        title: "Connection Test Successful",
        description: "Successfully connected to the Raspberry Pi.",
      })
    } catch (error) {
      console.error("Connection test failed:", error)
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Failed to connect to the Raspberry Pi.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Communication Settings</span>
            <Badge
              className={
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "error"
                    ? "bg-red-500"
                    : "bg-yellow-500"
              }
            >
              <div className="flex items-center gap-1">
                {connectionStatus === "connected" ? (
                  <CheckCircle className="h-3 w-3" />
                ) : connectionStatus === "error" ? (
                  <AlertCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                <span className="capitalize">{connectionStatus}</span>
              </div>
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure how the web application communicates with the Raspberry Pi devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="protocol" className="space-y-4">
            <TabsList>
              <TabsTrigger value="protocol">Protocol</TabsTrigger>
              <TabsTrigger value="connection">Connection</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
            </TabsList>

            <TabsContent value="protocol" className="space-y-4">
              <div className="space-y-2">
                <Label>Communication Protocol</Label>
                <RadioGroup
                  value={config.protocol}
                  onValueChange={(value) => handleProtocolChange(value as CommunicationProtocol)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="http" id="http" />
                    <Label htmlFor="http" className="font-normal">
                      HTTP (REST API)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="websocket" id="websocket" />
                    <Label htmlFor="websocket" className="font-normal">
                      WebSocket (Real-time)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mqtt" id="mqtt" />
                    <Label htmlFor="mqtt" className="font-normal">
                      MQTT (Pub/Sub)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>Protocol Description</Label>
                <div className="text-sm text-muted-foreground">
                  {config.protocol === "http" && (
                    <p>
                      HTTP uses standard REST API calls to send commands to the Raspberry Pi. It's simple but doesn't
                      support real-time communication.
                    </p>
                  )}
                  {config.protocol === "websocket" && (
                    <p>
                      WebSocket maintains a persistent connection for real-time communication. Ideal for immediate
                      control and feedback.
                    </p>
                  )}
                  {config.protocol === "mqtt" && (
                    <p>
                      MQTT is a lightweight publish/subscribe messaging protocol. Great for IoT applications with
                      multiple devices.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="connection" className="space-y-4">
              {config.protocol === "http" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="baseUrl">Base URL</Label>
                    <Input
                      id="baseUrl"
                      value={config.baseUrl}
                      onChange={(e) => handleInputChange("baseUrl", e.target.value)}
                      placeholder="http://192.168.1.100"
                    />
                    <p className="text-xs text-muted-foreground">The base URL of the Raspberry Pi's HTTP server</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiEndpoint">API Endpoint</Label>
                    <Input
                      id="apiEndpoint"
                      value={config.apiEndpoint}
                      onChange={(e) => handleInputChange("apiEndpoint", e.target.value)}
                      placeholder="/api/command"
                    />
                    <p className="text-xs text-muted-foreground">
                      The endpoint for sending commands (e.g., /api/command)
                    </p>
                  </div>
                </>
              )}

              {config.protocol === "websocket" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="baseUrl">Base URL</Label>
                    <Input
                      id="baseUrl"
                      value={config.baseUrl}
                      onChange={(e) => handleInputChange("baseUrl", e.target.value)}
                      placeholder="http://192.168.1.100"
                    />
                    <p className="text-xs text-muted-foreground">
                      The base URL will be converted to WebSocket URL (ws:// or wss://)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websocketPath">WebSocket Path</Label>
                    <Input
                      id="websocketPath"
                      value={config.websocketPath}
                      onChange={(e) => handleInputChange("websocketPath", e.target.value)}
                      placeholder="/ws"
                    />
                    <p className="text-xs text-muted-foreground">The path for the WebSocket connection (e.g., /ws)</p>
                  </div>
                </>
              )}

              {config.protocol === "mqtt" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="mqttBroker">MQTT Broker URL</Label>
                    <Input
                      id="mqttBroker"
                      value={config.mqttBroker}
                      onChange={(e) => handleInputChange("mqttBroker", e.target.value)}
                      placeholder="mqtt://192.168.1.100:1883"
                    />
                    <p className="text-xs text-muted-foreground">
                      The URL of the MQTT broker (e.g., mqtt://192.168.1.100:1883)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mqttTopic">MQTT Topic</Label>
                    <Input
                      id="mqttTopic"
                      value={config.mqttTopic}
                      onChange={(e) => handleInputChange("mqttTopic", e.target.value)}
                      placeholder="traffic/commands"
                    />
                    <p className="text-xs text-muted-foreground">
                      The topic to publish commands to (e.g., traffic/commands)
                    </p>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="authentication" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="useAuth"
                  checked={config.useAuth}
                  onCheckedChange={(checked) => handleInputChange("useAuth", checked)}
                />
                <Label htmlFor="useAuth">Use Authentication</Label>
              </div>

              {config.useAuth && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={config.username || ""}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={config.password || ""}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                    />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={isTesting || isSaving}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>

          <Button onClick={saveConfig} disabled={isTesting || isSaving} className="flex items-center gap-2">
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Command Testing</CardTitle>
          <CardDescription>Test sending commands to the Raspberry Pi using the configured protocol.</CardDescription>
        </CardHeader>
        <CardContent>
          <CommandTester />
        </CardContent>
      </Card>
    </div>
  )
}

// Command tester component
function CommandTester() {
  const [target, setTarget] = useState("P1A")
  const [action, setAction] = useState("red_on")
  const [value, setValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [commandHistory, setCommandHistory] = useState<any[]>([])

  const targets = ["P1A", "P1B", "P2A", "P2B", "P3A", "P3B", "P4A", "P4B", "system"]
  const actions = [
    "red_on",
    "red_off",
    "yel_on",
    "yel_off",
    "grnL_on",
    "grnL_off",
    "grnS_on",
    "grnS_off",
    "grnR_on",
    "grnR_off",
    "all_on",
    "all_off",
    "ping",
    "status",
    "reset",
  ]

  const sendCommand = async () => {
    setIsSending(true)

    try {
      const communicationService = getCommunicationService()

      const command = {
        target,
        action,
        value: value || undefined,
        timestamp: Date.now(),
      }

      const result = await communicationService.sendCommand(command)

      // Add to history
      setCommandHistory((prev) => [
        {
          command,
          result,
          success: true,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 9), // Keep only the last 10 commands
      ])

      toast({
        title: "Command Sent",
        description: `Successfully sent ${action} command to ${target}`,
      })
    } catch (error) {
      console.error("Error sending command:", error)

      // Add to history
      setCommandHistory((prev) => [
        {
          command: { target, action, value: value || undefined },
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 9),
      ])

      toast({
        title: "Command Failed",
        description: error instanceof Error ? error.message : "Failed to send command",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target">Target Device</Label>
          <select
            id="target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {targets.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="action">Command</Label>
          <select
            id="action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Value (Optional)</Label>
          <Input id="value" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Optional value" />
        </div>
      </div>

      <Button onClick={sendCommand} disabled={isSending} className="w-full">
        {isSending ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Sending Command...
          </>
        ) : (
          "Send Command"
        )}
      </Button>

      {commandHistory.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Command History</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Command
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commandHistory.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-500">{item.timestamp}</td>
                    <td className="px-4 py-2 text-sm">{item.command.target}</td>
                    <td className="px-4 py-2 text-sm">{item.command.action}</td>
                    <td className="px-4 py-2 text-sm">
                      <Badge className={item.success ? "bg-green-500" : "bg-red-500"}>
                        {item.success ? "Success" : "Failed"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

