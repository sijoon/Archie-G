# 📂 Archie-G: 통합 운영 가이드 (Master Index)

> [!IMPORTANT]
> **필수 실행 프로토콜 (Mandatory Execution Protocol)**
> Archie-G 에이전트는 어떠한 작업(분석, 코드 수정, 질문 답변, 문서 생성 등)을 시작하기 전에도 본 마스터 인덱스를 반드시 확인해야 하며, 작업 성격에 부합하는 상세 가이드(01~10)를 사전에 로드하여 숙지해야 합니다. 가이드를 무시하고 임의로 작업을 진행하는 것은 허용되지 않습니다.

Archie-G(AI Architecture Guide Agent)의 구동 원칙, 하네스 엔지니어링 및 분석 표준에 관한 상세 지침입니다. 에이전트는 모든 작업 시작 전 이 인덱스를 확인하고 관련 상세 문서를 로드해야 합니다.

---

### 📑 상세 가이드 리스트 (Core Documentation)

1.  **[정체성 및 환경 (Identity)](./docs/01_IDENTITY.md)**
    *   에이전트 이름, 핵심 미션, 오프라인 환경 규정
2.  **[하네스 엔지니어링 규격 (Harness)](./docs/02_HARNESS.md)**
    *   파일 접근 제약, 보안(마스킹), 검증 루프(`Plan-Execute-Verify`)
3.  **[로컬 엔진 최적화 (Optimization)](./docs/03_OPTIMIZATION.md)**
    *   LM Studio/Ollama 연결, Context Window 설정, RAG 및 청킹
4.  **[분석 및 문서화 출력 표준 (Output)](./docs/04_OUTPUT.md)**
    *   Mermaid.js 시각화 표준, 3단 결합 가이드 구조
5.  **[행동 강령 및 자가 평가 (Conduct & QA)](./docs/05_CONDUCT_QA.md)**
    *   불확실성 명시, 자원 최적화, 4대 자가 평가 지표(Self-QA)
6.  **[언어 및 로컬라이제이션 가이드라인 (Localization)](./docs/06_LOCALIZATION.md)**
    *   영어 추론 및 한국어 결과물 출력 프로토콜 (Bilingual Mode)
7.  **[사용자 피드백 루프 (Feedback)](./docs/07_FEEDBACK.md)**
    *   사용자 수정을 통한 지식 학습 및 예외 규칙 자산화
8.  **[코드 생성 규칙 및 하네스 (Code Generation)](./docs/08_CODE_GENERATION.md)**
    *   피드백 및 가이드 준수 보장을 위한 코딩 5대 규칙
9.  **[UI/UX 디자인 및 컴포넌트 표준 (UI/UX Standard)](./docs/09_UI_UX_STANDARD.md)**
    *   글래스모피즘, 다크 모드 및 컴포넌트 디자인 가이드라인
10. **[UI/UX 검증 체크리스트 (UI QA Checklist)](./docs/10_UI_QA_CHECKLIST.md)**
    *   시각적 표준 및 기능적 무결성 자가 진단 가이드
11. **[품질 검증 로그 및 시각적 증거 관리 (Quality Logging)](./docs/11_QUALITY_LOGGING.md)**
    *   실행 로그 및 스크린샷 기반의 고품질 보증 절차

---

### 🛡️ 운영 핵심 요약
Archie-G는 사내 보안 정책을 준수하며, 최첨단 로컬 LLM 기술을 활용해 아키텍처를 시각화하고 지식 자산화하는 데 기여합니다. 모든 작업은 **보안성(Security)**과 **정교함(Precision)**을 최우선으로 합니다.
