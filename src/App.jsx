import React, { useState, useCallback, useEffect } from 'react';
import { RoleSelection } from './components/SharedUI';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * 실전 프로덕션 모드: 가상 서버 키 (데이터 고속도로)
 */
const STORAGE_KEYS = {
  LECTURE_STATUS: 'vibe_lecture_status', // 강의 진행 상태
  LECTURE_DATA: 'vibe_lecture_data',     // { topic, keyPoints, summary }
  LIVE_TRANSCRIPT: 'vibe_live_transcript',// 실시간 자막 방송
  FEEDBACK: 'vibe_feedback_data',        // 클릭, 미이해 데이터
  STUDENTS: 'vibe_student_list',         // 접속자 명단
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

  // [실시간 데이터 고속도로] 0.1초 내외 동기화
  useEffect(() => {
    const handleStorageSync = (e) => {
      if (!e.newValue) {
        if (e.key === STORAGE_KEYS.LECTURE_STATUS) {
          setIsLectureStarted(false);
          setLectureContext(null);
        }
        return;
      }

      try {
        const data = JSON.parse(e.newValue);

        switch (e.key) {
          case STORAGE_KEYS.LECTURE_STATUS:
            setIsLectureStarted(data.isStarted);
            break;
          case STORAGE_KEYS.LECTURE_DATA:
            setLectureContext(data);
            break;
          case STORAGE_KEYS.LIVE_TRANSCRIPT:
            if (role === 'student') {
              setLiveText(prev => (prev.length > 2000 ? data.text : prev + ' ' + data.text));
            }
            break;
          case STORAGE_KEYS.FEEDBACK:
            setMisunderstandingCount(data.misunderstandingCount);
            setWordClicks(data.wordClicks);
            setLectureTempo(data.lectureTempo);
            break;
          case STORAGE_KEYS.STUDENTS:
            setStudentCount(data.length);
            break;
        }
      } catch (err) {
        console.error("데이터 동기화 파싱 오류");
      }
    };

    window.addEventListener('storage', handleStorageSync);
    
    // 초기 로드 시 기존 세션 복원
    const savedStatus = localStorage.getItem(STORAGE_KEYS.LECTURE_STATUS);
    if (savedStatus) setIsLectureStarted(JSON.parse(savedStatus).isStarted);
    
    const savedData = localStorage.getItem(STORAGE_KEYS.LECTURE_DATA);
    if (savedData) setLectureContext(JSON.parse(savedData));

    return () => window.removeEventListener('storage', handleStorageSync);
  }, [role]);

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

  const handleStartLecture = (context) => {
    const fullContext = { ...context, code: lectureCode };
    localStorage.setItem(STORAGE_KEYS.LECTURE_STATUS, JSON.stringify({ isStarted: true }));
    localStorage.setItem(STORAGE_KEYS.LECTURE_DATA, JSON.stringify(fullContext));
    setLectureContext(fullContext);
    setIsLectureStarted(true);
  };

  const handleLiveTextUpdate = useCallback((text) => {
    // 텍스트가 너무 길어지면 성능을 위해 앞부분을 자름
    setLiveText(prev => {
      const combined = prev ? prev + ' ' + text : text;
      return combined.length > 3000 ? combined.slice(-2000) : combined;
    });
  }, []);

  const broadcastFeedback = (updates) => {
    const currentFeedback = { misunderstandingCount, wordClicks, lectureTempo, ...updates };
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(currentFeedback));
  };

  const handleWordClick = (word) => {
    const newClicks = { ...wordClicks, [word]: wordClicks[word] + 1 };
    setWordClicks(newClicks);
    setLastActivity(Date.now());
    broadcastFeedback({ wordClicks: newClicks });
  };

  const handleMisunderstanding = () => {
    const newCount = misunderstandingCount + 1;
    setMisunderstandingCount(newCount);
    broadcastFeedback({ misunderstandingCount: newCount });
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

  // 시뮬레이터(통합뷰) 렌더링 제거, 프로덕션 1:1 뷰 적용
  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      <nav className="h-16 bg-white border-b border-slate-100 px-6 flex justify-between items-center flex-shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-black text-slate-800 tracking-tight">Vibe Bridge <span className="text-xs font-bold text-indigo-500 ml-2 bg-indigo-50 px-2 py-0.5 rounded-md">PRO</span></h1>
          {isConnected && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              <span className="text-[10px] font-black text-indigo-400 uppercase">Live Code</span>
              <span className="text-sm font-black text-indigo-600 tracking-widest">{lectureCode}</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Session User</p>
            <p className="text-xs font-bold text-slate-700">{role === 'teacher' ? `👨‍🏫 ${teacherName} 교수` : '👨‍🎓 학생'}</p>
          </div>
          <button onClick={handleExit} className="text-[11px] font-bold bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 px-4 py-2 rounded-xl transition-all">강의 종료</button>
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={role} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            {role === 'student' && <StudentView onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={v => {setLectureTempo(v); broadcastFeedback({lectureTempo: v})}} lectureTempo={lectureTempo} onMisunderstand={handleMisunderstanding} liveText={liveText} lectureContext={lectureContext} />}
            {role === 'teacher' && <TeacherDashboard wordClicks={wordClicks} lectureTempo={lectureTempo} isStarted={isLectureStarted} onStart={handleStartLecture} misunderstandingCount={misunderstandingCount} onLiveTextUpdate={handleLiveTextUpdate} studentCount={studentCount} liveText={liveText} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
