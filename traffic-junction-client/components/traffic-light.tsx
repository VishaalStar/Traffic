interface TrafficLightProps {
  status: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function TrafficLight({ status, size = "md", className = "" }: TrafficLightProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  }

  const getColor = () => {
    switch (status) {
      case "green":
        return "bg-green-500"
      case "yellow":
        return "bg-yellow-500"
      case "red":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  return <div className={`${sizeClasses[size]} rounded-full ${getColor()} ${className}`} />
}

