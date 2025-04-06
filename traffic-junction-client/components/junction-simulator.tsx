"use client"

import { useState, useEffect } from "react"
import TrafficLight from "./traffic-light"

interface JunctionSimulatorProps {
  lightStatus: Record<number, string>
}

export default function JunctionSimulator({ lightStatus }: JunctionSimulatorProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Trigger a brief animation when light status changes
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 300)
    return () => clearTimeout(timer)
  }, [lightStatus])

  return (
    <div className={`relative transition-all duration-300 ${isAnimating ? "scale-105" : "scale-100"}`}>
      <div className="relative">
        <img src="/junction-map.png" alt="Traffic Junction Map" className="max-w-full h-auto" />

        {/* Traffic light indicators */}
        {Object.entries(lightStatus).map(([route, status]) => {
          const position = getTrafficLightPosition(Number.parseInt(route))
          return (
            <div key={`light-${route}`} className="absolute" style={{ top: position.top, left: position.left }}>
              <TrafficLight status={status} size="md" className="border-2 border-white shadow-md" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Update the getTrafficLightPosition function to fix the overlapping lights for routes 1 and 13
function getTrafficLightPosition(routeNumber: number) {
  // These positions would need to be adjusted based on the actual image
  const positions: Record<number, { top: string; left: string }> = {
    1: { top: "78%", left: "18%" }, // Adjusted position for route 1 light
    2: { top: "18%", left: "82%" },
    3: { top: "88%", left: "43%" },
    4: { top: "18%", left: "13%" },
    5: { top: "18%", left: "23%" },
    6: { top: "18%", left: "3%" },
    7: { top: "48%", left: "3%" },
    8: { top: "48%", left: "97%" },
    9: { top: "78%", left: "13%" },
    10: { top: "78%", left: "82%" },
    11: { top: "78%", left: "92%" },
    12: { top: "18%", left: "92%" },
    13: { top: "78%", left: "23%" }, // Original position kept for route 13 light
    14: { top: "88%", left: "63%" },
  }

  return positions[routeNumber] || { top: "50%", left: "50%" }
}

