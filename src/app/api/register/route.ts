import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { registrationSchema } from "@/lib/validators"

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = registrationSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION_ERROR", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const cancelToken = crypto.randomBytes(24).toString("hex")

  const r = await prisma.registration.create({
    data: {
      ...parsed.data,
      cancelToken,
    },
    select: { id: true, cancelToken: true, createdAt: true },
  })

  return NextResponse.json({ ok: true, registration: r })
}
