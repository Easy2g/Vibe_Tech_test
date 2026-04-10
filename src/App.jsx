import React, { useState } from 'react';
import { RoleSelection } from './components/SharedUI';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * 중앙 상태 관리자: 앱의 모든 실시간 데이터를 중앙에서 제어합니다.
 */
export default function App() {
  const [role, setRole] = useState(null); 
  const [isConnected, setIsConnected] = useState(false);
  const [lectureCode, setLectureCode] = useState('');
  const [teacherName, setTeacherName] = useState('');

  // 학생들의 단어 클릭 수를 저장하는 상태
  const [wordClicks, setWordClicks] = useState({
    '인공지능': 0, '머신러닝': 0, '데이터': 0, '알고리즘': 0, '딥러닝': 0
  });

  // 강의 속도 피드백 수치 (기본값 50: 적당함)
  const [lectureTempo, setLectureTempo] = useState(50);

  // 학생의 마지막 클릭 시간을 기록하여 무반응 체크에 활용
  const [lastActivity, setLastActivity] = useState(Date.now());

  // 역할 선택 및 접속 핸들러: 로그인 데이터 수신 시 상태를 업데이트합니다.
  const handleRoleSelect = (selectedRole, data) => {
    setRole(selectedRole);
    if (data) {
      if (data.code) setLectureCode(data.code);
      if (data.name) setTeacherName(data.name);
      setIsConnected(true);
    }
  };

  // 단어 클릭 시 호출되는 핸들러
  const handleWordClick = (word) => {
    setWordClicks(prev => ({ ...prev, [word]: prev[word] + 1 }));
    setLastActivity(Date.now()); 
  };

  // 강의 속도 변경 시 호출되는 핸들러
  const handleTempoChange = (value) => {
    setLectureTempo(value);
  };

  // 로그아웃/나가기: 모든 상태를 초기화하고 초기 화면으로 돌아갑니다.
  const handleExit = () => {
    setRole(null);
    setIsConnected(false);
    // 선택 사항: 세션 데이터 초기화가 필요하다면 여기서 수행
  };

  // 앱 진입 시 역할 선택 화면 노출 (강의 코드를 전달하여 학생 입장 시 대조 가능하게 함)
  if (!role) {
    return <RoleSelection onSelect={handleRoleSelect} lectureCode={lectureCode} />;
  }

  return (
    // h-screen과 overflow-hidden으로 브라우저 스크롤을 완전히 차단합니다.
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      
      {/* 내비게이션 바 (고정 높이) */}
      <nav className="h-16 bg-white border-b border-slate-100 px-6 flex justify-between items-center flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-800">Vibe Bridge</h1>
          {isConnected && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100"
            >
              <span className="text-[10px] font-black text-indigo-400 uppercase">Code</span>
              <span className="text-sm font-black text-indigo-600 tracking-widest">{lectureCode}</span>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current Session</p>
            <p className="text-xs font-bold text-slate-700">
              {role === 'teacher' ? `👨‍🏫 ${teacherName} 교수` : role === 'student' ? '👨‍🎓 학생' : '🚀 시뮬레이터'}
            </p>
          </div>
          <button 
            onClick={handleExit} 
            className="text-[11px] font-bold bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 px-4 py-2 rounded-xl transition-all"
          >
            나가기
          </button>
        </div>
      </nav>

      {/* 메인 콘텐츠 (남은 높이 100% 활용) */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            key={role}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            {role === 'student' && (
              <StudentView onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={handleTempoChange} lectureTempo={lectureTempo} />
            )}
            
            {role === 'teacher' && (
              <TeacherDashboard wordClicks={wordClicks} lectureTempo={lectureTempo} />
            )}

            {role === 'simulator' && (
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                <div className="flex-1 lg:border-r border-slate-200 lg:pr-6 overflow-y-auto">
                  <h2 className="text-[10px] font-bold text-slate-300 mb-4 uppercase tracking-tighter">Student Interface</h2>
                  <StudentView onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={handleTempoChange} lectureTempo={lectureTempo} />
                </div>
                <div className="flex-1 lg:pl-2 min-h-0 overflow-hidden">
                  <h2 className="text-[10px] font-bold text-slate-300 mb-4 uppercase tracking-tighter">Teacher Dashboard</h2>
                  <TeacherDashboard wordClicks={wordClicks} lectureTempo={lectureTempo} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
