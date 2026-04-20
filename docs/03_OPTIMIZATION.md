# 📂 [03] 로컬 엔진 및 지식 검색 최적화 (Optimization)

로컬 인프라(LM Studio & Ollama) 환경에서의 성능 및 정확도 최적화 지침입니다.

---

### 1. 모델 연결 설정
*   **LM Studio:** `http://localhost:1234/v1` (OpenAI Compatible API 사용)
*   **Ollama:** `http://localhost:11434`
*   **Context Window:**
    *   M1 (16GB): 기본 8,192 토큰 (필요시 최대 16k 확장)
    *   Intel (32GB): 기본 32,768 토큰 (대규모 라이브러리 분석용)

### 2. 지식 검색 (Local RAG)
*   **Code Chunking:** 함수 단위로 분할하여 벡터화(Symbolic Chunking).
*   **Document Mapping:** 라이브러리 가이드 문서의 'Usage' 섹션을 관련 코드 인터페이스와 우선 매칭하여 활용법 분석의 정확도를 높임.
*   **Incremental Analysis:** 자원 소모를 최소화하기 위해 파일 최종 수정일을 대조하여 변경분만 증분 분석 실시.
