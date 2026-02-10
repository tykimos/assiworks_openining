"use client"

import { useMemo, useState } from "react"

type ApiOk = {
  ok: true
  registration: { id: string; cancelToken: string; createdAt: string }
}

type ApiErr = { ok: false; error: string; issues?: unknown }

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiOk | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cancelUrl = useMemo(() => {
    if (!result) return null
    const url = new URL("/cancel", window.location.origin)
    url.searchParams.set("id", result.registration.id)
    url.searchParams.set("token", result.registration.cancelToken)
    return url.toString()
  }, [result])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form.entries())

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as ApiOk | ApiErr
      if (!res.ok || !data.ok) {
        setError("등록에 실패했습니다. 입력값을 확인해주세요.")
        return
      }
      setResult(data)
      ;(e.currentTarget as HTMLFormElement).reset()
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="space-y-8">
      <header className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(123,63,255,0.10)] px-3 py-1 text-sm text-[rgb(var(--text-secondary))]">
          <span className="h-2 w-2 rounded-full bg-[#7B3FFF]" />
          Assiworks Opening
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Assiworks 오프닝 프로그램</h1>
        <p className="mt-2 text-[rgb(var(--text-secondary))]">
          어시웍스(Assiworks)의 방향성과 제품 로드맵, 그리고 데모 세션을 함께하는 오프닝 행사입니다.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ProgramCard title="Intro" desc="Assiworks 소개 및 비전" />
          <ProgramCard title="Demo" desc="워크플로우/에이전트 시연" />
          <ProgramCard title="Q&A" desc="참여자 질문 & 피드백" />
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">참여 등록</h2>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">아래 폼을 작성하면 등록이 완료됩니다.</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Field label="이름" name="name" required />
            <Field label="이메일" name="email" type="email" required />
            <Field label="연락처(선택)" name="phone" placeholder="010-0000-0000" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="회사(선택)" name="company" />
              <Field label="직함/역할(선택)" name="role" />
            </div>
            <Field label="참석 인원(선택)" name="headcount" type="number" min={1} max={20} />
            <div>
              <label className="mb-1 block text-sm text-[rgb(var(--text-secondary))]">메모(선택)</label>
              <textarea
                name="note"
                className="h-24 w-full rounded-lg border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm outline-none focus:border-[#7B3FFF]"
                maxLength={500}
              />
            </div>

            <button
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#7B3FFF] px-6 text-white shadow-sm disabled:opacity-60"
              type="submit"
            >
              {loading ? "등록 중…" : "참여 등록"}
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {result && cancelUrl && (
              <div className="rounded-xl border border-[rgba(123,63,255,0.35)] bg-[rgba(123,63,255,0.06)] p-4 text-sm">
                <p className="font-medium">등록이 완료되었습니다.</p>
                <p className="mt-2 text-[rgb(var(--text-secondary))]">불참 시 아래 링크로 취소할 수 있습니다.</p>
                <a
                  className="mt-2 block break-all text-[#7B3FFF] underline"
                  href={cancelUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {cancelUrl}
                </a>
              </div>
            )}
          </form>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">안내</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[rgb(var(--text-secondary))]">
            <li>등록 후 화면에 제공되는 취소 링크는 본인만 보관해주세요.</li>
            <li>취소는 링크 접속 후 확인 버튼을 누르면 즉시 처리됩니다.</li>
            <li>운영 환경에서는 DB를 Postgres로 변경하는 것을 권장합니다.</li>
          </ul>
        </div>
      </section>
    </main>
  )
}

function ProgramCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-6">
      <div className="text-sm font-semibold text-[#7B3FFF]">{title}</div>
      <div className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{desc}</div>
    </div>
  )
}

function Field(
  props: {
    label: string
    name: string
    required?: boolean
    type?: string
    placeholder?: string
    min?: number
    max?: number
  } & React.InputHTMLAttributes<HTMLInputElement>,
) {
  const { label, name, required, type = "text", placeholder, min, max, ...rest } = props
  return (
    <div>
      <label className="mb-1 block text-sm text-[rgb(var(--text-secondary))]">
        {label}
        {required ? <span className="text-[#7B3FFF]"> *</span> : null}
      </label>
      <input
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        min={min}
        max={max}
        className="h-11 w-full rounded-lg border border-[rgb(var(--border))] bg-white px-3 text-sm outline-none focus:border-[#7B3FFF]"
        {...rest}
      />
    </div>
  )
}
