# AssiWorks 발표자료 작성 스킬

이 문서는 AssiWorks Opening 발표자료 마크다운 문법을 정리한 가이드입니다.

---

## 슬라이드 구분

슬라이드는 `---` (대시 3개 이상)으로 구분합니다.

```markdown
# 첫 번째 슬라이드

---

# 두 번째 슬라이드
```

---

## 메타데이터

슬라이드 최상단에 HTML 주석으로 설정합니다.

```markdown
<!-- layout: center, bg: #0B1220, class: slide-dark, transition: fade -->
```

| 키 | 값 | 설명 |
|----|-----|------|
| `layout` | `default`, `center`, `cover` | 슬라이드 레이아웃 |
| `bg` | CSS 색상값 | 배경색 |
| `class` | CSS 클래스명 | 추가 클래스 (예: `slide-dark`) |
| `transition` | `fade`, `slide-left`, `slide-up`, `zoom`, `none` | 전환 효과 |
| `default-transition` | 위와 동일 | 모든 슬라이드 기본 전환 (첫 슬라이드에 설정) |

---

## 기본 마크다운

```markdown
# 제목 (h1)
## 소제목 (h2)
### 소소제목 (h3)

**굵게**, *기울임*, ***굵은 기울임***
`인라인 코드`

- 목록 항목
- 또 다른 항목

1. 번호 목록

[링크 텍스트](https://example.com)
![이미지 설명](이미지URL)

---  ← 구분선 (슬라이드 구분과 별도, 줄 안에서 사용)
```

---

## 레이아웃 디렉티브

`[디렉티브]` 문법으로 레이아웃을 구성합니다. 자식 요소는 **2칸 들여쓰기**합니다.

### 2열 레이아웃

```markdown
[cols]
  [left]
    왼쪽 내용
  [right]
    오른쪽 내용
```

비율 지정:

```markdown
[cols 2:3]
  [col]
    좁은 열
  [col]
    넓은 열
```

### 3열 레이아웃

```markdown
[cols-3]
  [col]
    첫째 열
  [col]
    둘째 열
  [col]
    셋째 열
```

### 정렬

```markdown
[center]
  가운데 정렬 내용

[right]
  오른쪽 정렬 내용

[bottom]
  하단 배치 내용

[bottom right]
  하단 오른쪽 배치
```

### 박스

```markdown
[box blue]
  파란 배경 박스

[box gray]
  회색 배경 박스
```

**박스 색상**: `blue`, `gray`, `purple`, `green`, `yellow`, `dark`, `white`, `glass`, `gradient`, `glow`, `rounded`

---

## 스타일 클래스

`{.클래스1 .클래스2}` 문법으로 텍스트에 스타일을 적용합니다.

### 블록 스타일 (줄 단위)

```markdown
{.large .bold}
이 텍스트는 크고 굵습니다

{.xxl .gradient .bold}
**거대한 그라디언트 텍스트**
```

### 인라인 스타일

```markdown
{.accent .bold}(강조 텍스트)를 문장 안에 넣기
```

### 텍스트 크기

| 클래스 | 효과 |
|--------|------|
| `.small` | 0.85em |
| `.large` | 1.4em |
| `.xl` | 2em |
| `.xxl` | 3em |

### 텍스트 굵기

| 클래스 | 효과 |
|--------|------|
| `.bold` | 굵게 (800) |
| `.light` | 얇게 (300) |

### 텍스트 색상

| 클래스 | 색상 |
|--------|------|
| `.muted` | 회색 (#6a6f95) |
| `.accent` | 보라 (#636bff) |
| `.blue` | 파랑 (#2563EB) |
| `.orange` | 주황 (#f97316) |
| `.white` | 흰색 |
| `.sub` | 부제 회색 (#334155) |

### 텍스트 효과

| 클래스 | 효과 |
|--------|------|
| `.center` | 가운데 정렬 |
| `.gradient` | 파랑→보라 그라디언트 |
| `.glow` | 네온 발광 효과 |

### 여백 (Spacer)

빈 공간을 삽입합니다. (자동으로 닫히는 div)

```markdown
{.spacer}
{.spacer-sm}
{.spacer-lg}
{.spacer-xl}
```

| 클래스 | 높이 |
|--------|------|
| `.spacer-sm` | 0.5rem |
| `.spacer` | 1rem |
| `.spacer-lg` | 3rem |
| `.spacer-xl` | 5rem |

---

## 애니메이션 (Fragment)

단계별로 나타나는 요소. 발표 시 화살표 키로 하나씩 공개됩니다.

```markdown
{.fade-in}
페이드 인

{.fade-up}
아래에서 위로

{.scale-in}
확대되며 등장

{.fade-up .delay-400}
0.4초 지연 후 등장
```

**지연 옵션**: `.delay-200`, `.delay-400`, `.delay-600`, `.delay-800`, `.delay-1000`, `.delay-1200`

### 연속 애니메이션

```markdown
{.float}
둥둥 떠다니는 요소

{.pulse}
깜빡이는 요소
```

---

## 전체 예시

```markdown
<!-- default-transition: fade -->

{.spacer-xl}

[center]
  {.xxl .gradient .bold} **AssiWorks**

{.spacer}

[center]
  {.large .light .muted} AI 기반 업무 시스템 재빌딩

---
<!-- transition: slide-left -->

{.small .bold .blue}
ORIGIN
## 시작은 2023년 겨울

{.spacer-sm}

[box gray]
  {.bold .large}
  ChatGPT Azure톤에서 얻은 확신

  {.sub}
  LLM 기반으로 다양한 서비스가 가능하다는 감각

{.spacer}

[cols-3]
  [col]
    [box blue]
      {.center .small .muted}
      2023 W
      {.center .bold}
      가능성
  [col]
    [box blue]
      {.center .small .muted}
      2024 W
      {.center .bold}
      도구+플로우 검증
  [col]
    [box blue]
      {.center .small .muted}
      Now
      {.center .bold}
      에이전트/루프/에어

---
<!-- layout: center, bg: #0B1220, class: slide-dark -->

{.spacer-lg}

[center]
  {.xxl .bold .white}
  감사합니다

{.spacer}

[center]
  {.muted}
  AssiWorks Opening · 2026.03.03
```

---

## 키보드 단축키 (발표 모드)

| 키 | 동작 |
|----|------|
| `→` / `↓` / `Space` | 다음 (프래그먼트 → 슬라이드) |
| `←` / `↑` | 이전 (프래그먼트 → 슬라이드) |
| `ESC` | 발표 종료 |

---

## 다크 슬라이드 만들기

```markdown
<!-- bg: #0B1220, class: slide-dark -->
```

`slide-dark` 클래스를 사용하면 텍스트 색상이 자동으로 흰색 계열로 전환됩니다.

---

## 이미지 팁

- 에디터에 이미지를 **붙여넣기**(Ctrl+V)하면 자동으로 base64로 삽입됩니다.
- 여러 이미지를 연속으로 배치하면 가로 정렬됩니다.
- 이미지 크기는 자동으로 반응형 조절됩니다.

---

## PDF 변환 API

마크다운 텍스트를 POST 요청으로 보내면 PDF 파일을 반환합니다.

### 엔드포인트

```
POST /api/export-pdf
```

### 요청

```json
{
  "markdown": "# 첫 번째 슬라이드\n\n---\n\n# 두 번째 슬라이드"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `markdown` | `string` | O | 슬라이드 마크다운 텍스트 (`---`로 슬라이드 구분) |

### 응답

- **성공**: `application/pdf` 바이너리 (파일명: `presentation.pdf`)
- **실패**: `{ "ok": false, "message": "에러 메시지" }`

### curl 예시

```bash
curl -X POST https://your-domain.vercel.app/api/export-pdf \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# Hello\n\n---\n\n# World"}' \
  -o presentation.pdf
```

### 제약사항

- 최대 실행 시간: 60초
- 이미지는 외부 URL(`https://`)만 지원 (로컬 경로 불가)
- 슬라이드 크기: 960×540px (16:9 비율)
