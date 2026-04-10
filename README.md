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
- **3단계 적응형 해설 (3-Level Adaptive Explanation)**: 사용자의 이해 수준에 맞춰 [기초 / 심화 / 전문] 단계별 맞춤형 용어 사전 제공.
- **강의 속도 피드백 (Tempo Feedback)**: [너무 느려요 / 딱 좋아요 / 조금 빨라요] 3가지 버튼을 통한 직관적인 강의 속도 조절 요청.
- **익명성 보장**: 질문에 대한 부담 없이 데이터만으로 교수자와 소통.

### 👨‍🏫 교수용 (Teacher Dashboard)
- **싱글 뷰 대시보드 (Fixed Single View)**: 모든 정보를 스크롤 없이 한눈에 파악할 수 있는 최적화된 레이아웃.
- **실시간 키워드 히트맵 (Real-time Keyword Heatmap)**: 어떤 용어에서 학생들이 정체되고 있는지 실시간 시각화.
- **AI 중재 가이드 (AI Mediation Insights)**: 누적 클릭 데이터를 분석하여 "보충 설명 필요", "속도 조절" 등의 구체적인 대응 전략 제안.
- **강의 코드 시스템 (Session Management)**: 랜덤 생성된 6자리 코드로 학생들과 안전하게 연결.

### 🔐 접속 및 보안 (Security & Connection)
- **교수 인증 시스템**: 비밀번호 기반의 교수 전용 대시보드 접근 제어 및 이름 기반 세션 관리.
- **실시간 강의 코드 (Session Code)**: 생성된 코드를 입력한 학생만 해당 강의에 참여할 수 있는 논리적 보안 레이어.

---

## 3. 기술 스택 (Tech Stack)

본 프로젝트는 높은 생산성과 세련된 사용자 경험을 위해 최신 프론트엔드 에코시스템을 활용합니다.

- **Framework**: [Vite](https://vitejs.dev/) + [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) (Smooth Fade-in & Transitions)
- **Design System**: Apple Style Minimal UI (White, Indigo, Slate)

---

## 4. 실행 방법 (Getting Started)

프로젝트를 로컬 환경에서 실행하려면 아래 과정을 따르세요. (Node.js 20+ 권장)

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

서버 실행 후 브라우저에서 `http://localhost:5173`에 접속하여 역할을 선택하세요. 
- **교수**: 이름 입력 및 비밀번호(`1234`) 입력 후 생성된 코드를 확인합니다.
- **학생**: 교수가 생성한 6자리 코드를 입력하여 입장합니다.

---

© 2026 VIBE BRIDGE Project. All rights reserved.
