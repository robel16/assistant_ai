import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task, dueDate, userId, priority } = body

    // Validate required fields
    if (!task || !dueDate || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: task, dueDate, and userId are required" },
        { status: 400 },
      )
    }

    // Forward the request to your Express backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000"
    const response = await fetch(`${backendUrl}/api/reminder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task,
        dueDate,
        userId,
        priority: priority || "medium",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      return NextResponse.json({ error: errorData.error || "Failed to create reminder" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating reminder:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
