import SequenceTester from "@/components/sequence-tester"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Settings, Activity, Cpu } from "lucide-react"

export default function TestPage() {
  return (
    <main className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Traffic Light Sequence Testing</h1>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
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
        </div>
      </div>
      <SequenceTester />
    </main>
  )
}

