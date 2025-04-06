import { NextResponse } from "next/server"

// This would be replaced with your actual database or storage logic
async function getSequencesFromStorage() {
  // In a real implementation, you would fetch this from a database
  // For now, we'll return null to use the default values in the component
  return null
}

export async function GET() {
  try {
    // Fetch sequences from storage
    const sequences = await getSequencesFromStorage()

    if (!sequences) {
      // If no sequences are found, return an empty response
      // The client will use default values
      return NextResponse.json({})
    }

    return NextResponse.json(sequences)
  } catch (error) {
    console.error("Error fetching sequences:", error)
    return NextResponse.json({ error: "Failed to fetch sequences" }, { status: 500 })
  }
}

