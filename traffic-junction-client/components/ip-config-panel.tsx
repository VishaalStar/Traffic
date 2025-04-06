"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Save, RefreshCw } from "lucide-react"
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
import { useSyncedState } from "@/lib/sync-service"

export default function IpConfigPanel() {
  const [syncedState, updateSyncedState] = useSyncedState()
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
  const [isLoading, setIsLoading] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Load IP addresses from synced state
  useEffect(() => {
    if (syncedState.ipAddresses) {
      setIpAddresses(syncedState.ipAddresses)
    }
  }, [syncedState.ipAddresses])

  const validateIpAddress = (ip: string): boolean => {
    const ipPattern =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipPattern.test(ip)
  }

  const handleIpChange = (pole: string, value: string) => {
    setIpAddresses((prev) => ({
      ...prev,
      [pole]: value,
    }))

    // Clear validation error if it exists
    if (validationErrors[pole]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[pole]
        return newErrors
      })
    }
  }

  const validateAllIps = (): boolean => {
    const errors: Record<string, string> = {}
    let isValid = true

    Object.entries(ipAddresses).forEach(([pole, ip]) => {
      if (!validateIpAddress(ip)) {
        errors[pole] = "Invalid IP address format"
        isValid = false
      }
    })

    // Check for duplicate IPs
    const ips = Object.values(ipAddresses)
    const uniqueIps = new Set(ips)
    if (ips.length !== uniqueIps.size) {
      toast({
        title: "Validation Error",
        description: "Duplicate IP addresses detected. Each pole must have a unique IP address.",
        variant: "destructive",
      })
      isValid = false
    }

    setValidationErrors(errors)
    return isValid
  }

  const handleSave = () => {
    if (!validateAllIps()) {
      return
    }

    setConfirmDialogOpen(true)
  }

  const confirmSave = async () => {
    setIsLoading(true)
    setConfirmDialogOpen(false)

    try {
      // Update the synced state with the new IP addresses
      const success = await updateSyncedState({ ipAddresses })

      if (!success) {
        throw new Error("Failed to update IP addresses")
      }

      toast({
        title: "Configuration Saved",
        description: "IP address configuration has been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving IP configuration:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save IP address configuration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (syncedState.ipAddresses) {
      setIpAddresses({ ...syncedState.ipAddresses })
    }
    setValidationErrors({})

    toast({
      title: "Configuration Reset",
      description: "IP address configuration has been reset to the last saved values.",
    })
  }

  const hasChanges = JSON.stringify(ipAddresses) !== JSON.stringify(syncedState.ipAddresses || {})

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>IP Address Configuration</CardTitle>
          <CardDescription>
            Configure the IP addresses for each traffic control board. Each board must have a unique IP address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ipAddresses).map(([pole, ip]) => (
              <div key={pole} className="space-y-1">
                <Label htmlFor={`ip-${pole}`} className="flex items-center gap-2">
                  {pole}
                  {validationErrors[pole] && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {validationErrors[pole]}
                    </Badge>
                  )}
                </Label>
                <Input
                  id={`ip-${pole}`}
                  value={ip}
                  onChange={(e) => handleIpChange(pole, e.target.value)}
                  className={validationErrors[pole] ? "border-red-500" : ""}
                  placeholder="e.g. 192.168.1.100"
                />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges || isLoading}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isLoading} className="flex items-center gap-2">
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network Settings</CardTitle>
          <CardDescription>Configure additional network settings for the traffic control system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="gateway">Default Gateway</Label>
              <Input id="gateway" defaultValue="192.168.1.1" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="subnet">Subnet Mask</Label>
              <Input id="subnet" defaultValue="255.255.255.0" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dns">Primary DNS</Label>
              <Input id="dns" defaultValue="8.8.8.8" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dns2">Secondary DNS</Label>
              <Input id="dns2" defaultValue="8.8.4.4" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Update Network Settings</Button>
        </CardFooter>
      </Card>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm IP Configuration Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update the IP addresses for the traffic control boards. This will affect the
              communication with the physical devices.
              <br />
              <br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Yes, Update Configuration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

