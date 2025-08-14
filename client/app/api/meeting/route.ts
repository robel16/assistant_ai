import { processScheduleRequest } from "../../../../server/controllers/nlpController"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { text } = body

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    return new Promise(async (resolve) => {
      const res = {
        status: (statusCode: number) => ({
          json: (data: any) => {
            resolve(
              new NextResponse(JSON.stringify(data), {
                status: statusCode,
                headers: { "Content-Type": "application/json" },
              }),
            )
          },
        }),
      }
      await processScheduleRequest({ body: { text } } as any, res as any)
    })
  } catch (error) {
    console.error("Error processing meeting request:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
