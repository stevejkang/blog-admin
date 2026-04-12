import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { mergePR } from "@/lib/github/pull-requests"

export async function POST(request: Request) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()

    if (body.action === "merge-pr") {
      if (!body.prNumber || typeof body.prNumber !== "number") {
        return NextResponse.json(
          { error: { message: "prNumber is required", code: "VALIDATION_ERROR" } },
          { status: 400 },
        )
      }

      await mergePR(body.prNumber)
      return NextResponse.json({ data: { merged: true } })
    }

    return NextResponse.json(
      { error: { message: "Invalid action", code: "BAD_REQUEST" } },
      { status: 400 },
    )
  } catch {
    return NextResponse.json(
      { error: { message: "Failed to merge PR", code: "GITHUB_API_ERROR" } },
      { status: 502 },
    )
  }
}
