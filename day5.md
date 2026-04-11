# 프로젝트 로그: Vibe Bridge (Day 5) - 실시간 데이터 통합 및 AI 중계 고도화

## 1. 오늘의 목표 달성 (Day 5 Achievements)

### [Step 1] 데이터 동기화 아키텍처 혁신 (Local -> Cloud)
- **Firebase Realtime Database 도입**: 기존 `localStorage` 및 `BroadcastChannel` 기반의 탭 간 통신을 종료하고, Firebase를 통한 **기기 간(Device-to-Device) 실시간 동기화**로 전면 전환했습니다.
- **상태 관리 중앙화**: `App.jsx`가 Firebase 리스너를 독점하고 하위 컴포넌트(`StudentView`, `TeacherDashboard`)는 순수 Props로만 데이터를 수신하는 단방향 데이터 흐름을 완성했습니다.

### [Step 2] AI 모델 최적화 및 안정화
- **모델 통합**: 모든 AI 기능(강의 분석, 단어 설명, 스마트 인사이트)을 서비스 종료나 유료 할당량 이슈가 없는 **`gemini-2.5-flash-lite` (무료 티어)** 모델로 통일했습니다.
- **서버리스 아키텍처**: 존재하지 않는 `/explain` 백엔드 엔드포인트 대신, 클라이언트에서 직접 Gemini API를 호출하도록 변경하여 비용과 구조를 단순화했습니다.

### [Step 3] STT(음성 인식) 엔진 견고화
- **권한 요청 명시화**: STT 시작 전 마이크 권한(`getUserMedia`)을 명시적으로 요청하여 `localhost` 및 배포 환경에서의 무반응 이슈를 해결했습니다.
- **무한 루프 재시작**: STT가 예기치 않게 종료되거나 오류가 발생해도 `isDestroyedRef` 플래그를 통해 안전하게 자동 재시작되는 구조를 확립했습니다.

### [Step 4] 기획 의도 기반 UI/UX 개편
- **이해도 위험 신호 시스템**: 단순 수치를 넘어 '양호/주의/위험' 3단계로 표시되는 직관적인 대시보드를 구축했습니다.
- **강의 속도 피드백**: 학생이 '느림/적당/빠름' 신호를 보낼 수 있는 인터페이스를 추가하고, 이를 교수 대시보드 상단에 실시간 반영했습니다.
- **한글화 및 도움말**: 모든 전문 용어를 한국어로 순화하고, 마우스 오버 시 기능 설명을 보여주는 툴팁(`title`)을 전면 적용했습니다.

---

## 2. 기술적 세부 사항 (For Future Me)

### Firebase 데이터 구조
- `sessions/{code}/subtitle`: 실시간 자막 (text, timestamp)
- `sessions/{code}/feedback/wordClicks`: `push()` 기반 단어 클릭 리스트 (aggregation 필요)
- `sessions/{code}/feedback/lectureTempo`: 최신 강의 속도 (value, timestamp)
- `sessions/{code}/students`: 접속 학생 객체 리스트 (count 추출용)

### AI 인사이트 트리거 (Trigger Logic)
- **조건**: (미이해 2명↑ OR 단어 질문 3회↑ OR 속도 빠름) 상태 발생 시
- **제한**: API 부하 방지를 위해 최소 **30초 간격**으로만 호출 (`lastInsightTimeRef`)

---

## 3. 다음 작업 시 고려사항 (Next Steps)
1. **분석 리포트 생성**: 강의 종료 시 Firebase에 쌓인 데이터를 집계하여 PDF 리포트로 변환하는 기능 필요.
2. **AI 실시간 조언(학생용)**: 교수 대시보드뿐만 아니라 학생 화면에도 현재 맥락에 맞는 '학습 가이드'를 실시간으로 띄워주는 기능 검토.
3. **모바일 최적화**: 학생용 화면의 레이아웃이 모바일 브라우저에서 깨지지 않는지 추가 점검 필요.

---
**Day 5 작업 종료 및 깃허브 푸시 완료.** 이제 Vibe Bridge는 실제 강의 현장에서 다수의 기기로 테스트 가능한 수준의 완성도를 갖추었습니다.
