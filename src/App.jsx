import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RoleSelection } from './components/SharedUI';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * 가상 서버 데이터 키 정의 (수리 및 통일 버전)
 */
const STORAGE_KEYS = {
  LECTURE_DATA: 'lectureData',      // [수리] 강의 정보 및 요약본 키 통일
  LIVE_TRANSCRIPT: 'liveTranscript', 
  FEEDBACK: 'vibe_feedback_data',   
  STUDENTS: 'vibe_student_list',    
};

export default function App() {
  const [role, setRole] = useState(null); 
  const [isConnected, setIsConnected] = useState(false);
  const [lectureCode, setLectureCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [studentCount, setStudentCount] = useState(0);
  const [isLectureStarted, setIsLectureStarted] = useState(false);
  const [lectureContext, setLectureContext] = useState(null);
  const [liveText, setLiveText] = useState('');
  const [misunderstandingCount, setMisunderstandingCount] = useState(0);
  const [wordClicks, setWordClicks] = useState({
    '인공지능': 0, '머신러닝': 0, '데이터': 0, '알고리즘': 0, '딥러닝': 0
  });
  const [lectureTempo, setLectureTempo] = useState(50);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // [수리] 가상 서버 실시간 데이터 수신 및 일관성 보장
  useEffect(() => {
    const handleStorageSync = (e) => {
      if (!e.newValue) {
        if (e.key === STORAGE_KEYS.LECTURE_DATA) {
          setIsLectureStarted(false);
          setLectureContext(null);
        }
        return;
      }

      try {
        const data = JSON.parse(e.newValue);

        switch (e.key) {
          case STORAGE_KEYS.LECTURE_DATA:
            // 교수가 보낸 lectureData를 즉시 수신하여 상태 반영
            setLectureCode(data.code || lectureCode);
            setLectureContext(data.context || data); 
            setIsLectureStarted(true);
            break;
          
          case STORAGE_KEYS.LIVE_TRANSCRIPT:
            if (role === 'student') {
              setLiveText(prev => (prev.length > 1000 ? data.text : prev + ' ' + data.text));
            }
            break;

          case STORAGE_KEYS.FEEDBACK:
            setMisunderstandingCount(data.misunderstandingCount);
            setWordClicks(data.wordClicks);
            break;

          case STORAGE_KEYS.STUDENTS:
            setStudentCount(data.length);
            break;
        }
      } catch (err) {
        console.error("동기화 파싱 오류:", err);
      }
    };

    window.addEventListener('storage', handleStorageSync);
    
    // 초기 로드 시 기존 데이터 복원
    const saved = localStorage.getItem(STORAGE_KEYS.LECTURE_DATA);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setLectureContext(data.context || data);
        setIsLectureStarted(true);
      } catch(e) {}
    }

    return () => window.removeEventListener('storage', handleStorageSync);
  }, [role, lectureCode]);

  // 역할 선택 및 접속
  const handleRoleSelect = (selectedRole, data) => {
    setRole(selectedRole);
    if (data) {
      if (data.code) setLectureCode(data.code);
      if (data.name) setTeacherName(data.name);
      
      if (selectedRole === 'student') {
        const currentStudents = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
        const newStudentList = [...currentStudents, `std_${Date.now()}`];
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(newStudentList));
        setStudentCount(newStudentList.length);
      }
      setIsConnected(true);
    }
  };

  // 강의 시작 (교수 전용) - lectureData 키로 표준화된 데이터 저장
  const handleStartLecture = (context) => {
    const lectureData = { code: lectureCode, context, isStarted: true };
    localStorage.setItem(STORAGE_KEYS.LECTURE_DATA, JSON.stringify(lectureData));
    setLectureContext(context);
    setIsLectureStarted(true);
  };

  const handleLiveTextUpdate = useCallback((text) => {
    if (role === 'teacher') {
      setLiveText(prev => (prev.length > 500 ? text : prev + ' ' + text));
      localStorage.setItem(STORAGE_KEYS.LIVE_TRANSCRIPT, JSON.stringify({ text, timestamp: Date.now() }));
    }
  }, [role]);

  const handleWordClick = (word) => {
    const newClicks = { ...wordClicks, [word]: wordClicks[word] + 1 };
    setWordClicks(newClicks);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify({ misunderstandingCount, wordClicks: newClicks }));
  };

  const handleMisunderstanding = () => {
    const newCount = misunderstandingCount + 1;
    setMisunderstandingCount(newCount);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify({ misunderstandingCount: newCount, wordClicks }));
  };

  const handleExit = () => {
    if (role === 'teacher') {
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    }
    setRole(null);
    setIsConnected(false);
    setIsLectureStarted(false);
    setLectureContext(null);
    setLiveText('');
  };

  if (!role) return <RoleSelection onSelect={handleRoleSelect} lectureCode={lectureCode} />;

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
            <p className="text-xs font-bold text-slate-700">{role === 'teacher' ? `👨‍🏫 ${teacherName} 교수` : role === 'student' ? '👨‍🎓 학생' : '🚀 시뮬레이터'}</p>
          </div>
          <button onClick={handleExit} className="text-[11px] font-bold bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 px-4 py-2 rounded-xl transition-all">나가기</button>
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={role} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            {role === 'student' && <StudentView onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={v => setLectureTempo(v)} lectureTempo={lectureTempo} onMisunderstand={handleMisunderstanding} liveText={liveText} lectureContext={lectureContext} />}
            {role === 'teacher' && <TeacherDashboard wordClicks={wordClicks} lectureTempo={lectureTempo} isStarted={isLectureStarted} onStart={handleStartLecture} misunderstandingCount={misunderstandingCount} onLiveTextUpdate={handleLiveTextUpdate} studentCount={studentCount} />}
            {role === 'simulator' && (
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                <div className="flex-1 lg:border-r border-slate-200 lg:pr-6 overflow-y-auto">
                  <h2 className="text-[10px] font-bold text-slate-300 mb-4 uppercase tracking-tighter">Student Interface</h2>
                  <StudentView onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={v => setLectureTempo(v)} lectureTempo={lectureTempo} onMisunderstand={handleMisunderstanding} liveText={liveText} lectureContext={lectureContext} />
                </div>
                <div className="flex-1 lg:pl-2 min-h-0 overflow-hidden">
                  <h2 className="text-[10px] font-bold text-slate-300 mb-4 uppercase tracking-tighter">Teacher Dashboard</h2>
                  <TeacherDashboard wordClicks={wordClicks} lectureTempo={lectureTempo} isStarted={isLectureStarted} onStart={handleStartLecture} misunderstandingCount={misunderstandingCount} onLiveTextUpdate={handleLiveTextUpdate} studentCount={studentCount} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
