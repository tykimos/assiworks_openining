<!-- default-transition: fade -->

{.spacer-xl}

[center]
  {.xxl .gradient .bold} **Assi Works**

{.spacer}

[center]
  {.large .light .muted} AI 기반 업무 시스템 재빌딩

{.spacer}

[center]
  {.sub} From "AI helps work" to "work runs by AI"
  {.sub} Unit → Flow → Agent → AssiLoop → AssiAir
  {.small .muted} (그리고, 통제 가능한 자율성)

{.spacer-lg}

[center]
  {.small .muted} VIP Briefing | AIFactory
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
  LLM 기반으로 "정말 다양한 서비스"가 가능하다는 감각
  그러나 곧 발견한 진짜 문제: 가능성이 아니라 **"업무 적용성"**

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
<!-- transition: fade -->

{.small .bold .blue}
PROBLEM
## 에이전트는 많은데 "쓸 수가 없다"

{.spacer-sm}

[cols]
  [box gray]
    {.bold .large}
    현장의 말 (요약)

    - 외부 서비스는 불안, 내부 개발은 부담
    - ROI가 불명확
    - 그냥 ChatGPT/Gemini/Claude 쓰면 되지 않나?
    - 자율성은 불안(멋대로 할까봐)
    - 단순 반복 업무도 완벽히 못함
    - 기술 변화가 너무 빨라 피로
  [right]
    [box dark]
      {.bold .large .white}
      정리하면…

      {.spacer-sm}

      {.bold .xl .white}
      "AI가 도와주는 건 되는데
      업무 시스템으로는 못 쓴다."

      {.spacer-sm}

      {.small .white}
      그래서 다음 질문이 필요해졌다.
---
<!-- transition: slide-left -->

{.small .bold .blue}
INSIGHT
## 우리가 던진 2개의 질문

{.spacer-sm}

[box gray]

  {.blue .bold .xl}
  1
  {.bold .large}
  복합적·자율적 업무를
  사람이 "고도의 지능"으로 처리하는 건 아닐까?

  ***

  {.blue .bold .xl}
  2
  {.bold .large}
  사람 중심의 업무 흐름 때문에
  AI가 역량을 펼칠 "공간"이 없는 건 아닐까?

---
<!-- layout: center, bg:#0B1220, class:slide-dark, transition: zoom -->

{.small .bold .blue}
결론

{.spacer-sm}

{.xxl .bold}
AI를 위한 환경으로
업무 시스템을 재빌드하자

{.spacer-sm}

{.light .sub}
"AI를 붙이는 것"이 아니라 "AI가 일할 수 있게 만드는 것"

{.spacer-lg}

[cols-3]
  [col]
    [box blue]
      {.center .bold .small}
      Unit
  [col]
    [box blue]
      {.center .bold .small}
      Flow
  [col]
    [box blue]
      {.center .bold .small}
      Agent

[cols-3]
  [col]
    [box blue]
      {.center .bold .small}
      AssiLoop
  [col]
    [box blue]
      {.center .bold .small}
      AssiAir
  [col]
    [box blue]
      {.center .bold .small}
      Control
---
<!-- transition: slide-left -->

{.small .bold .blue}
LAYER 1
## Unit: 가장 기초는 "도구"

{.spacer-sm}

[cols]
  [box gray]
    {.bold .large}
    왜 Tool부터?

    - 도구가 사람과 업무를 "이어준다"
    - 도구가 표준화되면 연결/권한/로그가 일관해진다
    - LLM도 "하나의 Tool"로 취급(교체 가능)
  [right]
    [box blue]
      {.bold .large}
      Tool 표준 스키마 (예)

      - 입력/출력 계약
      - 인증/권한
      - 비용/SLA
      - 실패 처리/재시도
      - 감사 로그/리플레이
---
<!-- transition: fade -->

{.small .bold .blue}
LAYER 2
## Flow: 정형 업무는 "공정(체인)"이다

{.sub}
업무의 대부분은 루틴한 공정으로 흐른다.

{.spacer-sm}

[cols-3]
  [col]
    [box blue]
      {.center .bold}
      요청/입력
      {.center .small .muted}
      폼·메일·메시지
  [col]
    [box blue]
      {.center .bold}
      수집
      {.center .small .muted}
      DB·웹·파일
  [col]
    [box blue]
      {.center .bold}
      가공
      {.center .small .muted}
      정규화·요약

[cols]
  [box blue]
    {.center .bold}
    검증
    {.center .small .muted}
    규칙·승인
  [right]
    [box blue]
      {.center .bold}
      처리/전달
      {.center .small .muted}
      티켓·보고

{.spacer-sm}

[box gray]
  {.bold .large}
  2024년 겨울의 학습

  {.sub}
  도구 + 플로우만으로도 "많은 일"이 가능했다.
  정형화된 업무 영역은 이미 자동화의 주 전장이다.
---
<!-- transition: slide-left -->

{.small .bold .blue}
LAYER 3
## Agent: 도구와 플로우를 "계획"하는 존재

{.sub}
사용자 요청 → 계획(작업 분해/선택/순서) → 실행(Flow/Tool 호출) → 기록(Trace)

{.spacer-sm}

[cols]
  [box gray]
    {.bold .large}
    Agent가 가져야 할 것

    - 사람과 소통하는 채팅 인터페이스
    - 전체 흐름 속에서 동작할 입출력 인터페이스
    - 실행 상태/실패 대응/재시도
    - 결정과 실행의 추적(감사 가능)
  [right]
    [box blue]
      {.bold .large}
      예: "요청"이 들어오면

      1. 필요한 Tool/Flow 선택
      2. 순서/분기 계획
      3. 위험 액션은 승인 요청
      4. 실행 결과 보고 + 로그 남김

{.spacer-sm}

[box dark]
  {.bold .large .white .center}
  핵심: "대화"와 "실행"을 같은 시스템 안에 둔다
---
<!-- transition: fade -->

{.small .bold .blue}
SCOPE
## 정형화된 업무만으로도 "막강"

{.spacer-sm}

[cols]
  [box gray]
    {.bold .large}
    강력한 영역

    - 루틴/반복 업무
    - 공정 기반 처리(티켓/보고/정리)
    - 정해진 규칙과 승인 체계
    - 측정 가능한 KPI(시간/성공률/품질)
  [right]
    [box blue]
      {.bold .large}
      효과는 "측정"으로 증명

      - 처리 시간: 리드타임 감소
      - 자동화 비율: Flow/Agent 처리 비중
      - 성공률/재시도율: 안정성 지표
      - 품질: CS 만족도·정확도·오류율
      - 운영 비용: 인력/외부 비용 절감

{.spacer-sm}

[box dark]
  {.bold .white .center}
  ROI 불확실 → Flow 단위 계측으로 파일럿-확장 방식
---
<!-- transition: slide-left -->

{.small .bold .blue}
LAYER 4
## AssiLoop: 복잡한 상황을 위한 "상시 대기"

{.spacer-sm}

[cols]
  [box gray]
    {.bold .large}
    왜 Loop가 필요한가?

    - 여러 업무가 동시에 발생
    - 도구는 "정의"되어야만 작동(MCP도 동일)
    - 복잡한 상황은 상시 감시/대기가 필요
    - 이벤트/상태 변화에 반응해 자동 처리
  [right]
    [box dark]
      {.bold .large .white}
      AssiLoop = Always-on Agent

      {.white}
      - 이벤트 구독(스케줄/웹훅/메시지)
      - 상황 판단(우선순위/라우팅/충돌 방지)
      - 부분 자율 + 승인 게이트
      - 필요 시 사람에게 핸드오프

{.spacer-sm}

[box dark]
  {.bold .large .white .center}
  "항시 대기"가 되어야 업무가 끊기지 않는다
---
<!-- transition: fade -->

{.small .bold .blue}
LAYER 5
## AssiAir: CS를 위한 "작고 강력한" 에이전트

{.sub}
CS는 "대화 인터페이스 위에서" 빠르고 안정적으로 처리되어야 한다.

{.spacer-sm}

[cols]
  [box gray]
    {.bold .large}
    CS 업무의 특징

    - 제한된 범위 안에서 다양한 처리
    - 사람과의 실시간 소통
    - 짧은 지연·높은 신뢰
    - 정책/규칙 기반의 일관성
  [right]
    [box blue]
      {.bold .large}
      AssiAir 설계 포인트

      - 범위 제한(가드레일) + 안정성
      - 상담 요약/다음 액션 추천
      - 티켓 생성/분류/라우팅
      - 운영자가 쉽게 검증/개입
---
<!-- transition: slide-left -->

{.small .bold .blue}
GOVERNANCE
## 기술이 아니라 "통제 가능한 시스템"

[box dark]
  {.bold .xl .white .center}
  우리는 에이전트 기술을 파는 회사가 아니다.
  {.white .center}
  업무에 쓰려면 "제한된 범위 + 감시/제어 + 책임 추적"이 가능해야 한다.

{.spacer-sm}

[cols]
  [box gray]
    {.bold .large}
    책임의 이동

    {.bold .xl .blue}
    생산/처리의 책임 → 관리의 책임

    {.large}
    AI가 대신 "한다"
    사람은 "관리"한다
  [right]
    [box blue]
      {.bold .large}
      Control 4요소

      - 권한/정책(허용 범위·한도)
      - 승인 워크플로(고위험 액션)
      - 관측/로그(리플레이·추적)
      - 감사/컴플라이언스(변경 이력)
---
<!-- transition: zoom -->

{.small .bold .blue}
NEXT
## VIP와 함께 시작합니다

{.spacer-sm}

[cols]
  [box gray]
    {.bold .large}
    VIP Early Access

    - 릴리즈되는 기능을 우선 체험
    - 실제 업무 환경에 적용하며 표준 Tool/Flow 축적
    - KPI 계측 기반으로 파일럿 → 확장
  [right]
    [box dark]
      {.small .bold .blue}
      이어서(후반부)

      {.bold .xl .white}
      기술 상세 소개

      {.white}
      - Unit 스키마 / Tool 인터페이스
      - Flow DSL/런타임
      - Agent 오케스트레이션
      - AssiLoop 이벤트 모델
      - AssiAir 경량 아키텍처
      - 보안/통제 모델

{.spacer-sm}

[box dark]
  {.bold .large .white .center}
  함께 "재빌딩"을 시작하겠습니다
