import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const cancelSchema = z.object({
  id: z.string().min(1),
  token: z.string().min(1),
})

export async function POST(req: Request) {
  const json = await req.json().catch(() => null)
  const parsed = cancelSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 })
  }

  const { id, token } = parsed.data

  const existing = await prisma.registration.findUnique({
    where: { id },
    select: { id: true, cancelToken: true, status: true },
  })

  if (!existing || existing.cancelToken !== token) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND_OR_BAD_TOKEN" }, { status: 404 })
  }

  if (existing.status === "CANCELED") {
    return NextResponse.json({ ok: true, alreadyCanceled: true })
  }

  await prisma.registration.update({
    where: { id },
    data: { status: "CANCELED", canceledAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
