import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Assiworks Opening",
  description: "Assiworks 오프닝 행사 소개 및 참여 등록",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="dot-grid min-h-screen">
          <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
        </div>
      </body>
    </html>
  )
}
