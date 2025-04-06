import JunctionControl from "@/components/junction-control"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Settings, Activity, Cpu, Radio } from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="w-full max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Traffic Junction Control System</h1>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="default" size="sm" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            <Link href="/test">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Sequence Testing</span>
              </Button>
            </Link>
            <Link href="/diagnostics">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Cpu className="h-4 w-4" />
                <span className="hidden sm:inline">Diagnostics</span>
              </Button>
            </Link>
            <Link href="/config">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">IP Config</span>
              </Button>
            </Link>
            <Link href="/communication">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Radio className="h-4 w-4" />
                <span className="hidden sm:inline">Communication</span>
              </Button>
            </Link>
          </div>
        </div>
        <JunctionControl />
      </div>
    </main>
  )
}

