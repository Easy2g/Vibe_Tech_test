import React, { useState } from 'react';
import { RoleSelection } from './components/SharedUI';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import { AnimatePresence, motion } from 'framer-motion';

// ==========================================
// 메인 컨트롤러 (Central State Hub & Router)
// ==========================================
// App.jsx는 더 이상 복잡한 UI를 렌더링하지 않으며, 오직 '공유 메모리(Shared State)' 관리와
// 컴포넌트 라우팅(Component Routing) 기능에만 집중하는 클린 아키텍처 형태로 모듈화되었습니다.
export default function App() {
  const [role, setRole] = useState(null); 
  const [wordClicks, setWordClicks] = useState({
    '인공지능': 0, '머신러닝': 0, '데이터': 0, '알고리즘': 0, '딥러닝': 0
  });
  const [lectureTempo, setLectureTempo] = useState(50);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const handleWordClick = (word) => {
    setWordClicks(prev => ({ ...prev, [word]: prev[word] + 1 }));
    setLastActivity(Date.now()); 
  };

  const handleTempoChange = (value) => {
    setLectureTempo(value);
  };

  // 초기 상태: 역할 선택 UI 로드
  if (!role) {
    return <RoleSelection onSelect={setRole} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* 네비게이션 헤더 */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm p-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Vibe <span className="text-indigo-600">Bridge</span></h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full shadow-inner">
            {role === 'student' ? '👨‍🎓 학생 모드' : role === 'teacher' ? '👨‍🏫 교수 모드' : '🚀 통합 시뮬레이터'}
          </span>
          <button 
            onClick={() => setRole(null)} 
            className="text-sm bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 px-4 py-1.5 rounded-lg transition-all"
          >
            역할 변경
          </button>
        </div>
      </nav>

      {/* 라우팅 영역: 선택된 역할(Role)에 따라 모듈화된 View 컴포넌트를 주입(Inject)합니다. */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {role === 'student' && (
              <StudentView 
                onWordClick={handleWordClick} 
                lastActivity={lastActivity}
                onTempoChange={handleTempoChange}
                lectureTempo={lectureTempo}
              />
            )}
            
            {role === 'teacher' && (
              <TeacherDashboard 
                wordClicks={wordClicks} 
                lectureTempo={lectureTempo} 
              />
            )}

            {role === 'simulator' && (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 lg:border-r border-slate-200 lg:pr-8">
                  <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">👨‍🎓 학생 인터페이스</h2>
                  <StudentView 
                    onWordClick={handleWordClick} 
                    lastActivity={lastActivity}
                    onTempoChange={handleTempoChange}
                    lectureTempo={lectureTempo}
                  />
                </div>
                <div className="flex-1 lg:pl-4">
                  <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">👨‍🏫 교수 대시보드</h2>
                  <TeacherDashboard 
                    wordClicks={wordClicks} 
                    lectureTempo={lectureTempo} 
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
