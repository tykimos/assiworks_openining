"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function CancelPage() {
  return (
    <Suspense
      fallback={
        <main className="space-y-6">
          <header className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold">참석 취소</h1>
            <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">불러오는 중…</p>
          </header>
        </main>
      }
    >
      <CancelInner />
    </Suspense>
  )
}

function CancelInner() {
  const sp = useSearchParams()
  const id = sp.get("id") || ""
  const token = sp.get("token") || ""

  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<null | "ok" | "already" | "error">(null)

  async function cancel() {
    setLoading(true)
    setDone(null)
    try {
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, token }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setDone(data.alreadyCanceled ? "already" : "ok")
      } else {
        setDone("error")
      }
    } catch {
      setDone("error")
    } finally {
      setLoading(false)
    }
  }

  const invalid = !id || !token

  return (
    <main className="space-y-6">
      <header className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">참석 취소</h1>
        <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
          취소를 진행하려면 아래 버튼을 눌러 확인해주세요.
        </p>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        {invalid ? (
          <p className="text-sm text-red-600">취소 링크가 올바르지 않습니다.</p>
        ) : (
          <>
            <button
              onClick={cancel}
              disabled={loading}
              className="h-12 rounded-xl bg-[#7B3FFF] px-6 text-white disabled:opacity-60"
            >
              {loading ? "취소 처리 중…" : "취소 확정"}
            </button>
            {done === "ok" && <p className="mt-4 text-sm">취소가 완료되었습니다.</p>}
            {done === "already" && <p className="mt-4 text-sm">이미 취소 처리된 등록입니다.</p>}
            {done === "error" && <p className="mt-4 text-sm text-red-600">취소에 실패했습니다.</p>}
          </>
        )}
      </section>

      <Link className="text-sm text-[#7B3FFF] underline" href="/">
        홈으로 돌아가기
      </Link>
    </main>
  )
}
