# 📂 Archie-G: 통합 검증 체크리스트 (Optimized QA)

Archie-G의 품질 무결성을 보장하기 위한 최적화된 체크리스트입니다. 모든 작업 완료 전 우선순위에 따라 자가 진단을 수행합니다.

---

### 🚨 P0: 치명적 무결성 (Must-Pass)
시스템의 기본 작동과 빌드 안정성을 검증합니다.
*   [ ] **Build Stability**: `npm run build` 실행 시 에러(`Error`) 및 경고(`Warning`) 0건 확인.
*   [ ] **Console Error Free**: 브라우저 개발자 도구 콘솔(Console)에 빨간색 에러(`TypeError`, `ReferenceError` 등)가 없는가?
*   [ ] **Runtime Stability**: 탭 전환, 버튼 클릭 등 동적 상호작용 시 화면 멈춤이나 하얗게 변하는 현상(Whiteout)이 없는가?
*   [ ] **HMR Integrity**: 코드 수정 후 Fast Refresh가 일어날 때 런타임 오류 없이 즉시 반영되는가?
*   [ ] **API Connectivity**: `/api/analyze`, `/api/files` 등 핵심 엔드포인트의 정상 응답 확인.
*   [ ] **Asset Loading**: 아이콘(Lucide), 폰트 등 필수 에셋 임포트 누락 및 깨짐 없음.

### 🎨 P1: 시각적 표준 (Aesthetics)
디자인 가이드라인([09_UI_UX_STANDARD.md]) 준수 여부를 확인합니다.
*   [ ] **Glassmorphism**: 패널 배경(`white/[0.03]`) 및 블러(`backdrop-blur-xl`)가 의도대로 중첩되는가?
*   [ ] **Color Protocol**: 섹션별 고유 액센트(Violet/Blue/Yellow)가 정확한 테마 위치에 노출되는가?
*   [ ] **Layout Balance**: 메인 탭 전환 및 사이드바 확장 시 레이아웃 무너짐이나 불필요한 스크롤 발생 여부.

### ⚙️ P2: 기능 및 사용자 경험 (UX)
사용자 흐름과 데이터의 영속성을 검증합니다.
*   [ ] **Streaming Performance**: 분석 텍스트가 실시간으로 끊김 없이 렌더링되며, 마지막까지 안정적으로 출력되는가?
*   [ ] **Multi-Chart Parsing**: `MASTER_FLOW`와 `DETAIL_FLOW`가 각각 독립적인 캔버스와 탭에 올바르게 분할되는가?
*   [ ] **State Persistence**: 'PIN' 기능을 통한 히스토리 저장 및 페이지 새로고침 후 복원 기능이 완벽한가?

---
**최종 업데이트**: 2026-04-21
**품질 보증**: Archie-G QA Team
