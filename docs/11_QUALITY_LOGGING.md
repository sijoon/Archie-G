# 📂 Archie-G: 품질 검증 및 증거 수집 (Logging Protocol)

모든 작업은 객관적인 데이터와 시각적 증거를 기반으로 종료되어야 합니다. 본 가이드는 효율적인 검증 절차와 보고 형식을 정의합니다.

---

### 1. 검증 데이터 저장소
*   **Logs**: `archie-g-web/logs/last_build.log`
*   **Visual Evidence**: `/Users/sijunseong/.gemini/antigravity/brain/<conversation-id>/artifacts/` (스크린샷 저장)

### 2. 표준 검증 프로세스 (CLI 기반)
에이전트는 작업 완료 선언 전 반드시 다음 명령어를 수행하여 무결성을 증명해야 합니다.

1.  **빌드 무결성 확인**:
    ```bash
    npm run build > logs/build.log 2>&1
    ```
2.  **결함 자가 진단 (Error Search)**:
    ```bash
    grep -Ei "error|warning|failed" logs/build.log
    ```
3.  **런타임 실시간 검증 (Runtime Verification)**:
    *   `npm run dev` 실행 상태에서 브라우저를 직접 조작하며 터미널의 실시간 로그와 브라우저 콘솔을 동시 모니터링합니다.
    *   `TypeError`, `ENOENT`, `Hydration Mismatch` 등 캐시 오염이나 SSR 관련 런타임 오류가 없는지 전수 조사합니다.
4.  **UI 렌더링 확인**:
    *   브라우저 도구를 사용하여 수정된 UI를 캡처하고 아티팩트에 저장합니다.

### 3. 최종 보고 양식 (Evidence Card)
Walkthrough 또는 최종 답변 하단에 아래 형식의 **Evidence Card**를 반드시 포함하여 품질을 보증합니다.

```markdown
### 🛡️ Evidence Card
- **Build Status**: [✅ SUCCESS / ❌ FAIL]
- **Runtime Status**: [✅ STABLE / ❌ ERROR]
- **QA Checklist**: [P0: PASS / P1: PASS / P2: PASS]
- **Log Summary**: (예: No critical errors found in build/dev log)
- **Visual Proof**: [스크린샷 또는 렌더링 결과 경로]
```

### 4. 주의 사항
*   **Runtime Error Monitoring**: 빌드 성공이 런타임의 무결성을 보장하지 않습니다. `npm run dev` 실행 중 발생하는 터미널 로그와 브라우저 콘솔의 `TypeError`, `ENOENT`, `Cannot read properties of undefined` 등의 에러를 반드시 상시 점검해야 합니다.
*   **Cache Integrity**: 캐시 오염으로 인한 오작동 발생 시, 즉시 `.next` 폴더를 삭제하고 클린 빌드를 수행하여 환경을 초기화합니다.
*   로그 파일 분석 시 끝부분만 확인하지 말고, 전체 빌드 과정에서 발생하는 `Deprecation`이나 `unused variables` 경고도 세심히 검토하여 코드를 정제합니다.
*   시각적 증거는 [09_UI_UX_STANDARD]의 글래스모피즘과 보더 규격이 실제 화면에서 어떻게 보이는지를 중점적으로 확인합니다.

---
**최지막 업데이트**: 2026-04-21
**품질 보증**: Archie-G QA Team
