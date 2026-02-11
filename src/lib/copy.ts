import { useEffect, useState } from "react"

type CopyEntry =
  | {
      type: "text"
      value: string
    }
  | {
      type: "list"
      value: string[]
    }

export type CopyDeck = Record<string, CopyEntry>

const interpretSection = (raw: string): CopyEntry => {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { type: "text", value: "" }
  }

  const lines = trimmed.split(/\r?\n/)
  const normalized = lines.map((line) => line.trim()).filter(Boolean)
  const isList = normalized.length > 0 && normalized.every((line) => line.startsWith("- "))

  if (isList) {
    const items = normalized.map((line) => line.replace(/^-+\s*/, "").trim())
    return { type: "list", value: items }
  }

  return { type: "text", value: trimmed }
}

export const parseCopyDeck = (markdown: string): CopyDeck => {
  const data: CopyDeck = {}
  const lines = markdown.split(/\r?\n/)
  let currentKey: string | null = null
  let buffer: string[] = []

  const flush = () => {
    if (!currentKey) return
    data[currentKey] = interpretSection(buffer.join("\n"))
    currentKey = null
    buffer = []
  }

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/)
    if (headingMatch) {
      flush()
      currentKey = headingMatch[1].trim()
      continue
    }

    if (!currentKey) continue
    buffer.push(line)
  }

  flush()
  return data
}

const entryToText = (entry?: CopyEntry, fallback = ""): string => {
  if (!entry) return fallback
  if (entry.type === "list") {
    return entry.value.join(" ")
  }
  return entry.value || fallback
}

const entryToList = (entry?: CopyEntry): string[] => {
  if (!entry || entry.type !== "list") return []
  return entry.value
}

export const textForKey = (copy: CopyDeck, key: string, fallback = "") =>
  entryToText(copy[key], fallback)

export const listForKey = (copy: CopyDeck, key: string) => entryToList(copy[key])

export type CopyPair = { title: string; value: string }

export const pairsForKey = (copy: CopyDeck, key: string): CopyPair[] =>
  entryToList(copy[key]).map((line) => {
    const [title = "", value = ""] = line.split("|").map((part) => part?.trim() ?? "")
    return { title, value }
  })

export const useCopyDeck = () => {
  const [copy, setCopy] = useState<CopyDeck>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const response = await fetch(`/content.md?v=${Date.now()}`, { cache: "no-store" })
        if (!response.ok) {
          throw new Error(`Failed to load copy deck (${response.status})`)
        }
        const markdown = await response.text()
        if (!active) return
        setCopy(parseCopyDeck(markdown))
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "COPY_DECK_ERROR")
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return { copy, loading, error }
}
