# Supabase 연동 및 DB 테이블 생성

이 프로젝트의 API 핸들러(`api/register.js`, `api/cancel.js`, `api/registrations.js`)는 Supabase(PostgreSQL)를 사용해 사전 등록 정보를 저장합니다. 아래 순서대로 진행하면 동일한 환경을 만들 수 있습니다.

## 1. Supabase 프로젝트 준비

1. [Supabase Console](https://supabase.com/dashboard)에서 새 프로젝트를 생성합니다. 프리 플랜으로도 충분합니다.
2. 프로젝트가 생성되면 **Project Settings → API**에서
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY`
   값을 복사해 둡니다. 서비스 롤 키는 서버에서만 사용해야 하므로 외부에 노출하지 마세요.

## 2. 환경 변수 설정

로컬에서 `vercel dev` 또는 Vercel 배포에서 API를 호출하려면 아래 값을 환경 변수로 넣어야 합니다.

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL. 클라이언트 스크립트에서도 사용되므로 `NEXT_PUBLIC_` 접두사를 갖습니다. |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 롤 키. 서버 함수에서만 사용합니다. |
| `REGISTRATIONS_ADMIN_TOKEN` | `/api/registrations` 엔드포인트를 보호하는 값. 임의의 안전한 토큰을 생성해 넣으세요. |
| `RESEND_API_KEY` *(선택)* | 등록 완료 안내 메일을 Resend로 보낼 때 필요합니다. |
| `REGISTRATION_FROM_EMAIL` *(선택)* | 메일 발신 주소를 커스터마이즈할 때 사용합니다. 설정하지 않으면 `events@assiworks.ai`. |

로컬에서는 `export KEY=value` 혹은 `.env` 파일(예: `.env.local`)을 써서 값을 주입하고, Vercel에서는 **Project Settings → Environment Variables**에 동일한 키를 추가하세요.

## 3. 데이터베이스 테이블 생성

`supabase/schema.sql`에 필요한 스키마가 들어 있습니다. Supabase SQL Editor 혹은 `psql`에서 아래 명령을 실행하세요.

```sql
-- supabase/schema.sql
create extension if not exists "pgcrypto";

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  affiliation text,
  position text,
  note text,
  cancel_token text not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
-- 이하 인덱스와 trigger 포함
```

모든 필드는 현재 API 구현과 1:1로 매핑됩니다.

## 4. 동작 확인

1. `vercel dev`로 로컬 개발 서버를 실행하거나, 배포된 주소에서 테스트합니다.
2. 임의 값으로 POST 요청을 보내 등록을 생성합니다.

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"홍길동","affiliation":"AssiWorks","position":"Developer","message":"hello"}'
```

3. 응답에 포함된 `cancelLink`를 열거나 아래처럼 `/api/cancel`을 호출해 취소 흐름을 점검할 수 있습니다.

```bash
curl -X POST http://localhost:3000/api/cancel \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","token":"<위 cancelLink의 token>"}'
```

4. 관리자 전용 엔드포인트(`/api/registrations`)를 확인하려면 앞서 설정한 `REGISTRATIONS_ADMIN_TOKEN`을 헤더에 넣습니다.

```bash
curl https://<배포호스트>/api/registrations \
  -H "x-admin-token: $REGISTRATIONS_ADMIN_TOKEN"
```

이 과정을 마치면 Supabase와의 연결이 완료되고, 폼 제출 → 저장 → 취소 → 확인의 전 흐름을 검증할 수 있습니다.
