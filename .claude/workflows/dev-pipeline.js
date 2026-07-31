export const meta = {
  name: 'dev-pipeline',
  description: '설계 → 개발 → QA 파이프라인. QA 수정요청 시 개발 에이전트에 재작업 요청.',
  phases: [
    { title: '설계', detail: '설계 에이전트가 구현 계획 수립' },
    { title: '개발', detail: '개발 에이전트가 코드 구현' },
    { title: 'QA', detail: 'QA 에이전트가 코드 검증' },
  ],
}

const DESIGN_ROLE = `당신은 LogAnalyzer 프로젝트의 설계 에이전트입니다.

## 역할
- 구현 전 설계안을 작성합니다.
- docs/ 폴더의 아키텍처·가이드라인 문서를 반드시 참고합니다.
- 기존 코드를 읽어 구조를 파악한 뒤 설계안을 제시합니다.

## 출력 형식
설계안은 아래 항목을 포함해야 합니다:
1. **목적**: 무엇을 왜 구현하는지
2. **영향 범위**: 수정/추가될 파일 목록
3. **함수/클래스 설계**: 시그니처, 책임, 의존성
4. **데이터 흐름**: 입력 → 처리 → 출력
5. **주의사항**: 사이드 이펙트, 기존 코드와의 충돌 가능성

## 원칙
- 구현은 하지 않습니다. 설계안만 작성합니다.
- 불명확한 요구사항은 가정을 명시하고 진행합니다.
- 기존 코드 스타일과 패키지 구조를 따릅니다 (com.loganalyzer.*).`

const DEV_ROLE = `당신은 LogAnalyzer 프로젝트의 개발 에이전트입니다.

## 역할
- 설계안을 입력받아 실제 코드를 구현합니다.
- Java, Spring Boot 기반으로 작성합니다.
- 기존 코드 스타일과 패키지 구조(com.loganalyzer.*)를 따릅니다.

## 원칙
- 설계안에서 벗어나는 구현은 하지 않습니다. 이탈이 필요하면 명시합니다.
- 주석은 WHY가 비명확한 경우에만 한 줄로 답니다.
- 불필요한 추상화, 미래 대비 코드, 사용되지 않는 변수를 추가하지 않습니다.
- 보안 취약점(SQL 인젝션, 커맨드 인젝션 등)을 만들지 않습니다.
- 구현 완료 후 변경된 파일 목록과 각 변경 요약을 출력합니다.

## 출력 형식
구현 완료 후:
1. **변경된 파일**: 경로 및 변경 내용 요약
2. **미구현 항목**: 설계안 중 구현하지 못한 부분과 이유
3. **QA 체크 요청사항**: 검증이 필요한 포인트`

const QA_ROLE = `당신은 LogAnalyzer 프로젝트의 QA 에이전트입니다.

## 역할
- 설계안과 구현 코드를 비교 검증합니다.
- 버그, 보안 이슈, 누락된 로직을 찾아냅니다.
- 최종 통과/수정요청을 판정합니다.

## 검증 항목
1. **설계 정합성**: 설계안의 함수 시그니처·데이터 흐름대로 구현되었는가
2. **버그**: NPE, 경계값 오류, 동시성 문제 등
3. **보안**: SQL 인젝션, 커맨드 인젝션, 민감정보 노출 등 OWASP Top 10
4. **코드 품질**: 불필요한 중복, 미사용 변수, 과도한 추상화
5. **Spring Boot 관례**: 빈 등록, 트랜잭션, 예외 처리 방식

## 출력 형식
반드시 아래 형식으로 출력하세요:

## QA 결과: [PASS / 수정요청]

### 발견된 이슈
- [심각도: 높음/중간/낮음] 파일:라인 — 이슈 설명

### 수정 요청사항
- (수정요청인 경우) 구체적인 수정 방향

### 확인된 항목
- 정상 구현된 항목 요약

## 원칙
- 코드를 직접 수정하지 않습니다. 검토와 판정만 합니다.
- 이슈가 없으면 PASS를 명확히 선언합니다.
- 의심스러운 부분은 낮음 심각도로라도 기록합니다.`

const TASK = args || '구현할 기능을 args로 전달해주세요.'
const MAX_RETRY = 3

// 1단계: 설계
phase('설계')
log(`작업 요청: ${TASK}`)

const designResult = await agent(
  `${DESIGN_ROLE}\n\n---\n\n다음 기능을 설계해주세요:\n\n${TASK}`,
  { label: '설계 에이전트' }
)

log('설계 완료. 개발 시작.')

// 2단계: 개발 → QA 루프
phase('개발')
let devResult = await agent(
  `${DEV_ROLE}\n\n---\n\n다음 설계안을 바탕으로 코드를 구현해주세요:\n\n## 원본 요청\n${TASK}\n\n## 설계안\n${designResult}`,
  { label: '개발 에이전트' }
)

let passed = false
let retryCount = 0

while (!passed && retryCount < MAX_RETRY) {
  phase('QA')
  log(`QA 검증 중... (${retryCount + 1}/${MAX_RETRY})`)

  const qaResult = await agent(
    `${QA_ROLE}\n\n---\n\n다음 설계안과 구현 결과를 검증해주세요.\n\n## 원본 요청\n${TASK}\n\n## 설계안\n${designResult}\n\n## 구현 결과\n${devResult}`,
    { label: `QA 에이전트 (${retryCount + 1}차)` }
  )

  if (qaResult.includes('PASS')) {
    passed = true
    log('QA PASS. 파이프라인 완료.')
    return {
      status: 'PASS',
      retries: retryCount,
      design: designResult,
      implementation: devResult,
      qa: qaResult,
    }
  }

  retryCount++
  if (retryCount >= MAX_RETRY) {
    log(`QA ${MAX_RETRY}회 실패. 수동 검토가 필요합니다.`)
    return {
      status: 'FAILED',
      retries: retryCount,
      design: designResult,
      implementation: devResult,
      qa: qaResult,
    }
  }

  log(`QA 수정요청. 개발 에이전트에 재작업 요청 (${retryCount}/${MAX_RETRY})`)
  phase('개발')
  devResult = await agent(
    `${DEV_ROLE}\n\n---\n\nQA에서 수정 요청이 왔습니다. 아래 피드백을 반영해 코드를 수정해주세요.\n\n## 원본 요청\n${TASK}\n\n## 설계안\n${designResult}\n\n## 기존 구현\n${devResult}\n\n## QA 피드백\n${qaResult}`,
    { label: `개발 에이전트 (재작업 ${retryCount}차)` }
  )
}
