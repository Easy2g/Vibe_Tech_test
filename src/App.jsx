import React, { useState, useCallback } from 'react';
import { RoleSelection } from './components/SharedUI';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * 중앙 상태 관리자: 앱의 모든 실시간 데이터(STT, 클릭, 미이해 등)를 통합 관리합니다.
 */
export default function App() {
  const [role, setRole] = useState(null); 
  const [isConnected, setIsConnected] = useState(false);
  const [lectureCode, setLectureCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  
  // 강의 세션 상태
  const [isLectureStarted, setIsLectureStarted] = useState(false);
  const [lectureContext, setLectureContext] = useState(null);

  // [Step 5 신규] 실시간 음성 인식 자막 데이터
  const [liveText, setLiveText] = useState('');

  // 학생 피드백 데이터
  const [misunderstandingCount, setMisunderstandingCount] = useState(0);
  const [wordClicks, setWordClicks] = useState({
    '인공지능': 0, '머신러닝': 0, '데이터': 0, '알고리즘': 0, '딥러닝': 0
  });

  const [lectureTempo, setLectureTempo] = useState(50);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // 역할 선택 및 접속
  const handleRoleSelect = (selectedRole, data) => {
    setRole(selectedRole);
    if (data) {
      if (data.code) setLectureCode(data.code);
      if (data.name) setTeacherName(data.name);
      setIsConnected(true);
    }
  };

  // 강의 시작
  const handleStartLecture = (context) => {
    setLectureContext(context);
    setIsLectureStarted(true);
  };

  // [Step 5 신규] 실시간 자막 업데이트 핸들러
  const handleLiveTextUpdate = useCallback((text) => {
    setLiveText(prev => (prev.length > 500 ? text : prev + ' ' + text));
  }, []);

  // 단어 클릭
  const handleWordClick = (word) => {
    setWordClicks(prev => ({ ...prev, [word]: prev[word] + 1 }));
    setLastActivity(Date.now()); 
  };

  // 맥락 미이해
  const handleMisunderstanding = () => {
    setMisunderstandingCount(prev => prev + 1);
  };

  // 강의 속도
  const handleTempoChange = (value) => {
    setLectureTempo(value);
  };

  // 나가기 (초기화)
  const handleExit = () => {
    setRole(null);
    setIsConnected(false);
    setIsLectureStarted(false);
    setLectureContext(null);
    setMisunderstandingCount(0);
    setLiveText('');
  };

  if (!role) {
    return <RoleSelection onSelect={handleRoleSelect} lectureCode={lectureCode} />;
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      
      <nav className="h-16 bg-white border-b border-slate-100 px-6 flex justify-between items-center flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-800">Vibe Bridge</h1>
          {isConnected && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              <span className="text-[10px] font-black text-indigo-400 uppercase">Code</span>
              <span className="text-sm font-black text-indigo-600 tracking-widest">{lectureCode}</span>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Session Info</p>
            <p className="text-xs font-bold text-slate-700">
              {role === 'teacher' ? `👨‍🏫 ${teacherName} 교수` : role === 'student' ? '👨‍🎓 학생' : '🚀 시뮬레이터'}
            </p>
          </div>
          <button onClick={handleExit} className="text-[11px] font-bold bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 px-4 py-2 rounded-xl transition-all">나가기</button>
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={role} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            {role === 'student' && (
              <StudentView 
                onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={handleTempoChange} 
                lectureTempo={lectureTempo} onMisunderstand={handleMisunderstanding}
                liveText={liveText}
              />
            )}
            
            {role === 'teacher' && (
              <TeacherDashboard 
                wordClicks={wordClicks} lectureTempo={lectureTempo} isStarted={isLectureStarted}
                onStart={handleStartLecture} misunderstandingCount={misunderstandingCount}
                onLiveTextUpdate={handleLiveTextUpdate}
              />
            )}

            {role === 'simulator' && (
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                <div className="flex-1 lg:border-r border-slate-200 lg:pr-6 overflow-y-auto">
                  <h2 className="text-[10px] font-bold text-slate-300 mb-4 uppercase tracking-tighter">Student Interface</h2>
                  <StudentView 
                    onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={handleTempoChange} 
                    lectureTempo={lectureTempo} onMisunderstand={handleMisunderstanding}
                    liveText={liveText}
                  />
                </div>
                <div className="flex-1 lg:pl-2 min-h-0 overflow-hidden">
                  <h2 className="text-[10px] font-bold text-slate-300 mb-4 uppercase tracking-tighter">Teacher Dashboard</h2>
                  <TeacherDashboard 
                    wordClicks={wordClicks} lectureTempo={lectureTempo} isStarted={isLectureStarted}
                    onStart={handleStartLecture} misunderstandingCount={misunderstandingCount}
                    onLiveTextUpdate={handleLiveTextUpdate}
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
