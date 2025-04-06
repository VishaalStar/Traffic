"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface SignalControlPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routeNumber: number | null
  onSave: (value: string) => void
}

export default function SignalControlPopup({ open, onOpenChange, routeNumber, onSave }: SignalControlPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Signal Control</DialogTitle>
          <DialogDescription>
            {routeNumber ? `Set signal status for Route ${routeNumber}` : "Select a route first"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup defaultValue="0" className="space-y-2">
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
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button onClick={() => onSave("1")}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

