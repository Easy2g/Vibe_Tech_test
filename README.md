# VIBE BRIDGE: AI-Mediated Edu Platform

> **"소통의 침묵을 데이터의 인사이트로 전환하다."**  
> 질문의 두려움이라는 심리적 장벽(Psychological Barrier)을 비언어적 데이터(Non-verbal Data)로 해결하는 AI 중재 기반 교육 플랫폼입니다.

---

## 1. 기획 배경 (Vision)

현대 교육 환경에서 학생들은 모르는 내용을 즉각적으로 질문하는 것에 심리적 부담을 느낍니다. 이러한 '질문의 부재'는 학습 격차를 심화시키는 결정적인 요인이 됩니다. 

**VIBE BRIDGE**는 직접적인 채팅이나 음성 질문 없이, 학생의 **'키워드 클릭(Interaction Data)'**을 학습 신호로 포착합니다. 이를 실시간으로 분석하여 교수자에게는 **강의 최적화 데이터(Teaching Insights)**를, 학생에게는 **개별 맞춤형 해설(Adaptive Context)**을 제공함으로써 교육 현장의 소통 장벽을 기술적으로 해결하고자 합니다.

---

## 2. 핵심 기능 (Key Features)

### 👨‍🎓 학생용 (Student Interface)
- **실시간 지능형 스크립트 (Live Contextual Script)**: 강의 흐름에 따라 노출되는 텍스트 중 모르는 용어를 즉시 클릭 가능.
- **3단계 적응형 해설 (3-Level Adaptive Explanation)**: 사용자의 이해 수준에 맞춰 [입문(Intro) / 심화(Deep) / 마스터(Master)] 단계별 맞춤형 용어 사전 제공.
- **익명 피드백 시스템 (Anonymous Feedback)**: 질문에 대한 부담 없이 클릭 한 번으로 교수자에게 이해도 부족 신호 전송.

### 👨‍🏫 교수용 (Teacher Dashboard)
- **실시간 키워드 히트맵 (Real-time Keyword Heatmap)**: 어떤 용어에서 학생들이 정체되고 있는지 막대 그래프로 시각화.
- **강의 페이스 가이드 (Lecture Pacing Guide)**: 누적 클릭 데이터를 기반으로 강의 속도 조절(Slow down/Speed up) 권장 알림 제공.
- **단원 종합 이해도 체크 (Chapter Mastery Analytics)**: 강의 종료 시점의 데이터 안정화를 분석하여 전체적인 단원 이해도(Achievement Rate) 산출.

---

## 3. 기술 스택 (Tech Stack)

본 프로젝트는 높은 생산성과 세련된 사용자 경험을 위해 최신 프론트엔드 에코시스템을 활용합니다.

- **Framework**: [Vite](https://vitejs.dev/) + [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first engine)
- **State Management**: React Shared State (Simulation model)
- **Design System**: Apple Style Minimal UI (White, Indigo, Slate)

---

## 4. Day 1 개발 로그 (Development Log)

- **인프라 구축**: Vite 환경 설정 및 Tailwind CSS v4 최신 규격(`@tailwindcss/postcss`) 기반의 빌드 파이프라인 최적화.
- **코어 아키텍처 설계**: 단일 파일(`App.jsx`) 내에서 학생-교수 간 데이터 흐름을 시뮬레이션하는 Shared State 구조 설계 완료.
- **UI 프로토타이핑**: Apple 디자인 가이드를 준수하는 미니멀한 인터페이스 및 사용자 인터랙션을 강조하는 Tailwind 애니메이션(Ping, Transition) 구현.
- **로그 데이터 연동**: 키워드 클릭 시 실시간으로 대시보드 통계가 갱신되는 반응형 UI 검증 완료.

---

## 5. 실행 방법 (Getting Started)

프로젝트를 로컬 환경에서 실행하려면 아래 과정을 따르세요. (Node.js 20+ 권장)

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

서버 실행 후 브라우저에서 `http://localhost:5173` (또는 표시된 포트)에 접속하여 **'시뮬레이터 모드'**를 선택하면 학생과 교수의 실시간 상호작용을 한눈에 확인할 수 있습니다.

---

© 2026 VIBE BRIDGE Project. All rights reserved.
