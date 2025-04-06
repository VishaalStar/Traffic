import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if we can access environment variables
    const envCheck = process.env.NODE_ENV ? true : false

    // Basic health check response
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      envCheck,
      version: "1.0.0",
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

