# Assiworks Opening

Assiworks 오프닝 행사 소개 + 참여 등록/취소를 제공하는 웹사이트.

## Tech

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite (로컬/단일 서버용)

## Local dev

```bash
npm install
npm run db:push
npm run dev
```

Open: http://localhost:3000

## Routes

- `/` : 프로그램 소개 + 참여 등록 폼
- 등록 완료 시 취소 링크(토큰 포함)가 화면에 표시됩니다.
- `/cancel` : 취소 링크를 통해 참석 취소 처리

## Notes

- 운영 배포 시에는 SQLite 대신 Postgres(Supabase/Neon 등)로 바꾸는 것을 권장합니다.
- 취소 링크는 토큰 기반이므로 외부 공유에 주의해주세요.
