import React, { useState } from 'react';

// 메인 앱 컴포넌트: 전체 상태(역할, 클릭 데이터)를 관리하여 'Shared State' 구조를 시뮬레이션합니다.
export default function App() {
  // 앱의 전반적인 상태 (역할: 학생, 교수, 시뮬레이터)를 관리합니다.
  const [role, setRole] = useState(null); 
  
  // 학생들의 단어 클릭 횟수를 저장하는 'Shared State' 객체입니다.
  // 실제 서비스 환경에서는 이 데이터가 서버(WebSocket, Firebase 등)를 통해 동기화됩니다.
  const [wordClicks, setWordClicks] = useState({
    '인공지능': 0,
    '머신러닝': 0,
    '데이터': 0,
    '알고리즘': 0,
    '딥러닝': 0
  });

  // [학생용 인터랙션] 단어 클릭 시 호출되는 핸들러. 학생 뷰에서 단어를 클릭하면 이 함수가 실행됩니다.
  const handleWordClick = (word) => {
    setWordClicks(prev => ({
      ...prev,
      [word]: prev[word] + 1
    }));
  };

  // 초기 접속 시: 역할 선택 화면 렌더링
  if (!role) {
    return <RoleSelection onSelect={setRole} />;
  }

  // Apple 스타일의 깔끔한 배경색(slate-50)과 기본 폰트 설정
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 상단 글로벌 네비게이션 바: 현재 모드 표시 및 뒤로 가기 */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50 transition-all">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI-Mediated <span className="text-indigo-600">Edu Bridge</span></h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full shadow-inner">
            현재 모드: {role === 'student' ? '👨‍🎓 학생' : role === 'teacher' ? '👨‍🏫 교수' : '🚀 시뮬레이터'}
          </span>
          <button 
            onClick={() => setRole(null)}
            className="text-sm bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 px-4 py-1.5 rounded-lg transition-colors"
          >
            역할 변경
          </button>
        </div>
      </nav>

      {/* 역할에 따른 메인 화면 렌더링 */}
      <main className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
        {role === 'student' && <StudentView wordClicks={wordClicks} onWordClick={handleWordClick} />}
        {role === 'teacher' && <TeacherDashboard wordClicks={wordClicks} />}
        {/* '시뮬레이터' 모드: 학생 화면과 교수 화면을 양옆에 배치하여 실시간 상호작용을 한눈에 보여줍니다. */}
        {role === 'simulator' && (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 lg:border-r border-slate-200 lg:pr-8">
              <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                <span className="text-2xl">👨‍🎓</span> 학생 디바이스
              </h2>
              <StudentView wordClicks={wordClicks} onWordClick={handleWordClick} />
            </div>
            <div className="flex-1 lg:pl-4">
              <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                <span className="text-2xl">👨‍🏫</span> 교수 디바이스
              </h2>
              <TeacherDashboard wordClicks={wordClicks} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// 1. 역할 선택 컴포넌트 (초기 진입 화면)
function RoleSelection({ onSelect }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full space-y-8 border border-white/50 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Edu Bridge</h1>
          <p className="text-slate-500 font-medium text-sm">소통의 장벽을 없애는 새로운 교육 플랫폼</p>
        </div>
        <div className="space-y-4 pt-4">
          {/* 학생으로 입장하기 버튼 */}
          <button 
            onClick={() => onSelect('student')}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-2xl">👨‍🎓</span> 학생 모드
          </button>
          {/* 교수로 입장하기 버튼 */}
          <button 
            onClick={() => onSelect('teacher')}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-2xl">👨‍🏫</span> 교수 대시보드
          </button>
          
          <div className="relative py-4 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="bg-white px-4 text-slate-400">또는</span></div>
          </div>

          {/* 실시간 시뮬레이터 실행 버튼 (요구사항: 상호작용 체감용) */}
          <button 
            onClick={() => onSelect('simulator')}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl shadow-indigo-600/20 transform hover:-translate-y-1"
          >
            <span className="text-2xl">🚀</span> 동시 화면 시뮬레이터 실행
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. 학생 뷰 컴포넌트: 강의 스크립트를 보고 모르는 단어를 클릭합니다.
function StudentView({ wordClicks, onWordClick }) {
  // 모달에 띄울 선택된 단어의 상태를 관리합니다.
  const [selectedWord, setSelectedWord] = useState(null);

  // 강의 스크립트 본문. 'keyword' 타입인 객체는 클릭 가능한 버튼으로 렌더링됩니다.
  const scriptText = [
    { type: 'text', content: '오늘 우리는 ' },
    { type: 'keyword', content: '인공지능' },
    { type: 'text', content: '의 핵심 분야 중 하나인 ' },
    { type: 'keyword', content: '머신러닝' },
    { type: 'text', content: '에 대해 배울 것입니다. 기본적으로 방대한 ' },
    { type: 'keyword', content: '데이터' },
    { type: 'text', content: '를 컴퓨터에 입력하여 특정한 패턴을 학습하게 만드는 ' },
    { type: 'keyword', content: '알고리즘' },
    { type: 'text', content: '을 설계하는 과정입니다. 최근 가장 화두가 되는 것은 심층 신경망을 활용한 ' },
    { type: 'keyword', content: '딥러닝' },
    { type: 'text', content: ' 기술입니다.' },
  ];

  // 단어 클릭 시 실행되는 함수
  const handleKeywordClick = (word) => {
    onWordClick(word);     // 상위 상태(App.jsx)를 업데이트하여 교수 화면에 실시간 데이터(클릭) 전달
    setSelectedWord(word); // 학생 본인의 화면에 설명 모달을 띄우기 위해 로컬 상태 업데이트
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden transition-all">
      <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
        <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block shadow-sm"></span>
        실시간 자동 자막 (Live Script)
      </h3>
      
      {/* 강의 스크립트 텍스트 렌더링 영역 */}
      <div className="text-lg md:text-xl leading-loose md:leading-relaxed text-slate-700 font-medium">
        {scriptText.map((part, index) => {
          if (part.type === 'keyword') {
            return (
              <button
                key={index}
                onClick={() => handleKeywordClick(part.content)}
                className="group relative inline-flex items-center justify-center font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-3 py-1 mx-1 rounded-xl cursor-pointer transition-all duration-300 ease-out active:scale-95 shadow-sm hover:shadow-md"
              >
                {part.content}
                {/* 단어 우측 상단에 작게 뛰는 점(Ping)을 추가하여 클릭을 유도하는 UI */}
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500 border-2 border-white group-hover:border-indigo-600 transition-colors"></span>
                </span>
              </button>
            );
          }
          return <span key={index}>{part.content}</span>;
        })}
      </div>

      <div className="mt-10 p-5 bg-slate-50/50 rounded-2xl text-sm text-slate-500 border border-slate-100 flex items-start gap-3">
        <span className="text-xl">💡</span>
        <p className="leading-relaxed">
          이해가 안 되는 <b className="text-indigo-600 font-semibold">파란색 키워드</b>를 클릭하면 즉시 상세 설명을 볼 수 있으며, 클릭 데이터는 교수님께 자동으로 전달되어 강의 속도 조절에 활용됩니다. (채팅 금지 규칙 적용)
        </p>
      </div>

      {/* 선택된 단어가 있을 때만 모달을 렌더링합니다. */}
      {selectedWord && (
        <WordExplanationModal 
          word={selectedWord} 
          onClose={() => setSelectedWord(null)} 
        />
      )}
    </div>
  );
}

// 학생 뷰 내 '3단계 난이도' 단어 설명 모달 컴포넌트
function WordExplanationModal({ word, onClose }) {
  // 각 단어별 3단계(입문/심화/마스터) 설명 데이터
  const explanations = {
    '인공지능': {
      intro: '컴퓨터가 사람처럼 생각하고 배울 수 있게 만드는 기술이에요.',
      deep: '논리적 추론, 학습, 시각적 인식 등을 소프트웨어로 구현하는 컴퓨터 과학의 분야입니다.',
      master: '튜링 테스트를 통과할 수 있는 범용 AI(AGI)부터 특정 목적을 가진 좁은 AI(ANI)까지 포함하는 개념입니다.'
    },
    '머신러닝': {
      intro: '컴퓨터가 스스로 데이터에서 규칙을 찾아 학습하는 기술입니다.',
      deep: '명시적인 프로그래밍 없이 데이터로부터 패턴을 학습하여 예측이나 결정을 수행하는 알고리즘 연구입니다.',
      master: '지도/비지도/강화학습 방법론을 통해 모델의 가중치를 최적화하는 확률 및 통계 기반 기술입니다.'
    },
    '데이터': {
      intro: '컴퓨터가 똑똑해지기 위해 읽어들이는 정보의 재료들입니다.',
      deep: '분석이나 처리의 대상이 되는 사실, 개념, 명령을 형식화한 것입니다.',
      master: '정형, 반정형, 비정형 형태로 나뉘며, 모델 성능에 직접적인 영향을 미치는 피처(Feature)와 라벨(Label)의 집합입니다.'
    },
    '알고리즘': {
      intro: '어떤 문제를 해결하기 위한 순서나 요리 레시피 같은 방법이에요.',
      deep: '주어진 입력으로부터 원하는 출력을 유도하기 위해 명확하게 정의된 연산들의 유한 집합입니다.',
      master: '시간 복잡도와 공간 복잡도를 최적화하여 리소스를 효율적으로 사용하면서 해를 탐색하는 수학적 모델입니다.'
    },
    '딥러닝': {
      intro: '인간의 뇌 신경망을 모방하여 만든 훨씬 복잡하고 똑똑한 학습 방식이에요.',
      deep: '인공신경망(ANN)의 층(Layer)을 여러 개 깊게 쌓아 복잡한 비선형 관계를 학습하는 기술입니다.',
      master: '역전파 알고리즘과 경사하강법을 이용하여 다층 퍼셉트론의 손실 함수를 최소화하는 과정입니다.'
    }
  };

  const currentExp = explanations[word] || { intro: '설명이 없습니다.', deep: '설명이 없습니다.', master: '설명이 없습니다.' };
  
  // 현재 선택된 난이도 탭 상태 (기본값: 입문)
  const [level, setLevel] = useState('intro');

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-300">
        
        {/* 모달 헤더 */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <h4 className="text-xl font-bold text-slate-800">
            단어 사전: <span className="text-indigo-600">{word}</span>
          </h4>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* 난이도 탭 선택 (Segmented Control 스타일 적용) */}
          <div className="flex bg-slate-100 rounded-xl p-1.5 shadow-inner">
            {[
              { id: 'intro', label: '🌱 입문' },
              { id: 'deep', label: '🌿 심화' },
              { id: 'master', label: '🌳 마스터' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setLevel(tab.id)}
                className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all duration-300 ${
                  level === tab.id 
                    ? 'bg-white shadow-sm text-indigo-700 scale-100' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 선택된 난이도에 따른 설명 노출 영역 */}
          <div className="min-h-[120px] flex items-center justify-center bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <p className="text-slate-700 leading-relaxed font-medium text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              {currentExp[level]}
            </p>
          </div>
        </div>

        {/* 교수에게 데이터가 전달됨을 알리는 안내 문구 */}
        <div className="bg-indigo-50/80 p-4 text-center border-t border-indigo-100">
          <p className="text-xs text-indigo-700 font-semibold flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            이 단어를 클릭한 기록이 익명으로 교수님께 전달되었습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// 3. 교수용 대시보드 컴포넌트: 학생들의 클릭 데이터를 실시간 히트맵(막대 그래프)으로 시각화합니다.
function TeacherDashboard({ wordClicks }) {
  // 학생들의 전체 클릭 수를 누적 합산합니다.
  const totalClicks = Object.values(wordClicks).reduce((sum, count) => sum + count, 0);
  
  // 가장 많이 클릭된 단어의 횟수 (그래프의 100% 기준을 잡기 위함. 최소 1을 보장하여 0으로 나누기 방지)
  const maxClicks = Math.max(...Object.values(wordClicks), 1); 

  // 클릭 횟수가 많은 순서대로 배열을 정렬합니다. [ ['머신러닝', 5], ['데이터', 3], ... ]
  const sortedWords = Object.entries(wordClicks).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 h-full">
      
      {/* 대시보드 헤더 */}
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-rose-500 rounded-full inline-block shadow-sm"></span>
          학생 이해도 인사이트
        </h3>
        <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          Live Sync
        </div>
      </div>

      {/* 상단 요약 지표 카드 3개 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
          <p className="text-xs font-semibold text-slate-500 mb-2">누적 도움 요청(클릭)</p>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-extrabold text-slate-800">{totalClicks}</span>
            <span className="text-base font-bold text-slate-400 mb-1">건</span>
          </div>
        </div>
        
        <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-100 rounded-full -mr-8 -mt-8 opacity-50"></div>
          <p className="text-xs font-semibold text-rose-600 mb-2 relative z-10">집중 설명 필요</p>
          <p className="text-xl font-extrabold text-rose-700 relative z-10 truncate">
            {sortedWords[0][1] > 0 ? sortedWords[0][0] : '대기 중'}
          </p>
        </div>
        
        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm transition-transform hover:-translate-y-1 duration-300">
          <p className="text-xs font-semibold text-indigo-600 mb-2">현재 강의 페이스</p>
          <p className="text-xl font-extrabold text-indigo-700">
            {totalClicks > 15 ? '속도 조절 권장 ⚠️' : '원활함 🚀'}
          </p>
        </div>
      </div>

      <h4 className="text-base font-bold text-slate-700 mb-6">실시간 키워드 히트맵 (클릭 빈도)</h4>
      
      {/* 실시간으로 움직이는 막대 그래프 (요구사항 1번: Shared State 시뮬레이션의 핵심 시각적 요소) */}
      <div className="space-y-6">
        {sortedWords.map(([word, count], index) => {
          // 최대 클릭 수를 기준으로 너비(%)를 계산합니다. (UI가 깨지지 않도록 최소 2% 보장)
          const widthPercentage = Math.max((count / maxClicks) * 100, 2); 
          
          return (
            <div key={word} className="relative group">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-slate-700 flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-4">{index + 1}.</span> {word}
                </span>
                <span className="font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{count} 회</span>
              </div>
              
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                {/* 데이터가 변경될 때마다 너비(width)가 부드럽게 변하도록 transition 설정 (요구사항 2번) */}
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ 
                    width: `${widthPercentage}%`, 
                    // 1등 단어는 눈에 띄게 그라데이션 색상을 다르게 줍니다.
                    backgroundImage: index === 0 
                      ? 'linear-gradient(to right, #fb7185, #e11d48)' 
                      : 'linear-gradient(to right, #818cf8, #4f46e5)'
                  }}
                >
                  {/* 막대 그래프 내부의 광택 애니메이션 효과 */}
                  <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-white/30 to-transparent"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 단원 종료 시 노출되는 '이해도 체크' 영역 (FUNCTIONAL_MAP.md 요구사항) */}
      <div className="mt-12 pt-8 border-t border-slate-100">
        <h4 className="text-base font-bold text-slate-700 mb-4">단원 종합 이해도 체크</h4>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex justify-between text-sm font-bold mb-3 text-slate-600">
            <span>목표 달성률: 1단원 (기초 개념)</span>
            <span className="text-emerald-600">75%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 shadow-inner overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: '75%' }}></div>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-4 flex items-center gap-1.5 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
            학생들의 특정 키워드 클릭 빈도가 기준치 이하로 안정화되면 이해도가 상승한 것으로 간주합니다.
          </p>
        </div>
      </div>

    </div>
  );
}
