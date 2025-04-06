// Communication service for sending commands to Raspberry Pi devices
// Supports HTTP, WebSockets, and MQTT protocols

import mqtt from "mqtt"

// Types for communication configuration
export type CommunicationProtocol = "http" | "websocket" | "mqtt"

export interface CommunicationConfig {
  protocol: CommunicationProtocol
  baseUrl: string
  mqttBroker?: string
  mqttTopic?: string
  websocketPath?: string
  apiEndpoint?: string
  username?: string
  password?: string
  useAuth: boolean
}

// Default configuration
export const defaultConfig: CommunicationConfig = {
  protocol: "http",
  baseUrl: "http://192.168.1.100",
  mqttBroker: "mqtt://192.168.1.100:1883",
  mqttTopic: "traffic/commands",
  websocketPath: "/ws",
  apiEndpoint: "/api/command",
  useAuth: false,
}

// Command types
export interface Command {
  target: string // e.g., 'P1A', 'P2B'
  action: string // e.g., 'red_on', 'grnL_off'
  value?: string | number // Optional value for the command
  timestamp?: number // Timestamp when the command was created
}

// Class for handling communication with Raspberry Pi devices
export class CommunicationService {
  private config: CommunicationConfig
  private websocket: WebSocket | null = null
  private mqttClient: any = null
  private connectionStatus: "connected" | "disconnected" | "error" = "disconnected"
  private onStatusChangeCallbacks: ((status: string) => void)[] = []

  constructor(config: CommunicationConfig = defaultConfig) {
    this.config = config
    this.initConnection()
  }

  // Initialize the connection based on the selected protocol
  private initConnection() {
    try {
      switch (this.config.protocol) {
        case "websocket":
          this.initWebSocket()
          break
        case "mqtt":
          this.initMqtt()
          break
        case "http":
          // HTTP doesn't need persistent connection
          this.setConnectionStatus("connected")
          break
      }
    } catch (error) {
      console.error("Failed to initialize connection:", error)
      this.setConnectionStatus("error")
    }
  }

  // Initialize WebSocket connection
  private initWebSocket() {
    try {
      const wsUrl = this.config.baseUrl.replace(/^http/, "ws") + (this.config.websocketPath || "/ws")
      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        console.log("WebSocket connection established")
        this.setConnectionStatus("connected")
      }

      this.websocket.onclose = () => {
        console.log("WebSocket connection closed")
        this.setConnectionStatus("disconnected")
        // Try to reconnect after 5 seconds
        setTimeout(() => this.initWebSocket(), 5000)
      }

      this.websocket.onerror = (error) => {
        console.error("WebSocket error:", error)
        this.setConnectionStatus("error")
      }

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("Received message from WebSocket:", data)
          // Handle incoming messages if needed
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error)
      this.setConnectionStatus("error")
    }
  }

  // Initialize MQTT connection
  private initMqtt() {
    try {
      if (!this.config.mqttBroker) {
        throw new Error("MQTT broker URL not provided")
      }

      // Connect to MQTT broker
      const options: any = {}
      if (this.config.useAuth && this.config.username && this.config.password) {
        options.username = this.config.username
        options.password = this.config.password
      }

      this.mqttClient = mqtt.connect(this.config.mqttBroker, options)

      this.mqttClient.on("connect", () => {
        console.log("MQTT connection established")
        this.setConnectionStatus("connected")

        // Subscribe to response topic
        const responseTopic = `${this.config.mqttTopic}/response`
        this.mqttClient.subscribe(responseTopic, (err: any) => {
          if (err) {
            console.error("Error subscribing to MQTT topic:", err)
          } else {
            console.log(`Subscribed to ${responseTopic}`)
          }
        })
      })

      this.mqttClient.on("error", (error: any) => {
        console.error("MQTT error:", error)
        this.setConnectionStatus("error")
      })

      this.mqttClient.on("close", () => {
        console.log("MQTT connection closed")
        this.setConnectionStatus("disconnected")
      })

      this.mqttClient.on("message", (topic: string, message: Buffer) => {
        try {
          const data = JSON.parse(message.toString())
          console.log(`Received message on topic ${topic}:`, data)
          // Handle incoming messages if needed
        } catch (error) {
          console.error("Error parsing MQTT message:", error)
        }
      })
    } catch (error) {
      console.error("Failed to initialize MQTT:", error)
      this.setConnectionStatus("error")
    }
  }

  // Update connection status and notify listeners
  private setConnectionStatus(status: "connected" | "disconnected" | "error") {
    this.connectionStatus = status
    this.onStatusChangeCallbacks.forEach((callback) => callback(status))
  }

  // Register a callback for connection status changes
  public onStatusChange(callback: (status: string) => void) {
    this.onStatusChangeCallbacks.push(callback)
    // Immediately call with current status
    callback(this.connectionStatus)
    return () => {
      this.onStatusChangeCallbacks = this.onStatusChangeCallbacks.filter((cb) => cb !== callback)
    }
  }

  // Get current connection status
  public getStatus(): string {
    return this.connectionStatus
  }

  // Update configuration and reinitialize connection
  public updateConfig(config: Partial<CommunicationConfig>) {
    this.config = { ...this.config, ...config }
    this.closeConnections()
    this.initConnection()
  }

  // Close all active connections
  public closeConnections() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }

    if (this.mqttClient) {
      this.mqttClient.end()
      this.mqttClient = null
    }

    this.setConnectionStatus("disconnected")
  }

  // Send a command using the configured protocol
  public async sendCommand(command: Command): Promise<any> {
    // Add timestamp if not provided
    const commandWithTimestamp = {
      ...command,
      timestamp: command.timestamp || Date.now(),
    }

    try {
      switch (this.config.protocol) {
        case "http":
          return this.sendHttpCommand(commandWithTimestamp)
        case "websocket":
          return this.sendWebSocketCommand(commandWithTimestamp)
        case "mqtt":
          return this.sendMqttCommand(commandWithTimestamp)
        default:
          throw new Error(`Unsupported protocol: ${this.config.protocol}`)
      }
    } catch (error) {
      console.error(`Error sending command via ${this.config.protocol}:`, error)
      throw error
    }
  }

  // Send command via HTTP
  private async sendHttpCommand(command: Command): Promise<any> {
    const url = `${this.config.baseUrl}${this.config.apiEndpoint || "/api/command"}`
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    }

    // Add authentication if configured
    if (this.config.useAuth && this.config.username && this.config.password) {
      const authHeader = "Basic " + btoa(`${this.config.username}:${this.config.password}`)
      options.headers = {
        ...options.headers,
        Authorization: authHeader,
      }
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  // Send command via WebSocket
  private sendWebSocketCommand(command: Command): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket is not connected"))
        return
      }

      // Generate a unique ID for this command to track the response
      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const commandWithId = { ...command, id: commandId }

      // Set up a one-time message handler to catch the response
      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          if (data.id === commandId) {
            this.websocket?.removeEventListener("message", messageHandler)
            resolve(data)
          }
        } catch (error) {
          console.error("Error parsing WebSocket response:", error)
        }
      }

      this.websocket.addEventListener("message", messageHandler)

      // Set a timeout to remove the listener if no response is received
      setTimeout(() => {
        this.websocket?.removeEventListener("message", messageHandler)
        reject(new Error("WebSocket command timed out"))
      }, 5000)

      // Send the command
      this.websocket.send(JSON.stringify(commandWithId))
    })
  }

  // Send command via MQTT
  private sendMqttCommand(command: Command): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.mqttClient || !this.mqttClient.connected) {
        reject(new Error("MQTT client is not connected"))
        return
      }

      if (!this.config.mqttTopic) {
        reject(new Error("MQTT topic not configured"))
        return
      }

      // Generate a unique ID for this command
      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const commandWithId = { ...command, id: commandId }

      // Publish the command to the MQTT topic
      this.mqttClient.publish(
        this.config.mqttTopic,
        JSON.stringify(commandWithId),
        { qos: 1 }, // Quality of Service level 1 (at least once delivery)
        (err: any) => {
          if (err) {
            reject(new Error(`Failed to publish MQTT message: ${err.message}`))
          } else {
            // For MQTT, we don't wait for a response by default
            // In a real implementation, you might want to subscribe to a response topic
            resolve({ success: true, id: commandId })
          }
        },
      )
    })
  }

  // Send a batch of commands
  public async sendBatchCommands(commands: Command[]): Promise<any[]> {
    const results = []

    for (const command of commands) {
      try {
        const result = await this.sendCommand(command)
        results.push({ command, result, success: true })
      } catch (error) {
        results.push({
          command,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false,
        })
      }
    }

    return results
  }

  // Helper method to create a simple command
  public static createCommand(target: string, action: string, value?: string | number): Command {
    return {
      target,
      action,
      value,
      timestamp: Date.now(),
    }
  }
}

// Create a singleton instance
let communicationServiceInstance: CommunicationService | null = null

export function getCommunicationService(config?: CommunicationConfig): CommunicationService {
  if (!communicationServiceInstance) {
    communicationServiceInstance = new CommunicationService(config)
  } else if (config) {
    communicationServiceInstance.updateConfig(config)
  }

  return communicationServiceInstance
}

