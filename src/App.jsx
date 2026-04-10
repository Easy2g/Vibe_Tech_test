import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RoleSelection } from './components/SharedUI';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * 가상 서버 데이터 키 정의 (수리 버전)
 */
const STORAGE_KEYS = {
  LECTURE_DATA: 'lectureData',      // 강의 정보 및 요약본
  LIVE_TRANSCRIPT: 'liveTranscript', // 실시간 자막 방송용
  FEEDBACK: 'vibe_feedback_data',   // 클릭 및 미이해 데이터
  STUDENTS: 'vibe_student_list',    // 접속 학생 리스트
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

  // [가상 서버 수리] 타 탭(교수/학생)에서 전송한 데이터 실시간 수신 및 예외 처리
  useEffect(() => {
    const handleStorageSync = (e) => {
      // 1. 데이터 삭제 시 초기화 (강의 종료 등)
      if (!e.newValue) {
        if (e.key === STORAGE_KEYS.LECTURE_DATA) {
          setIsLectureStarted(false);
          setLectureContext(null);
          setLiveText('');
        }
        return;
      }

      try {
        const data = JSON.parse(e.newValue);

        switch (e.key) {
          case STORAGE_KEYS.LECTURE_DATA:
            setLectureCode(data.code);
            setLectureContext(data.context || data); // 객체 구조 유연성 확보
            setIsLectureStarted(true);
            break;
          
          case STORAGE_KEYS.LIVE_TRANSCRIPT:
            // 학생 탭: 교수님이 보낸 자막을 실시간으로 누적(Append)
            if (role === 'student') {
              setLiveText(prev => (prev.length > 1000 ? data.text : prev + ' ' + data.text));
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
        console.error("데이터 동기화 구문 분석 오류:", err);
      }
    };

    window.addEventListener('storage', handleStorageSync);
    
    // 초기 로드 시 기존 강의 세션 복구
    const savedLecture = localStorage.getItem(STORAGE_KEYS.LECTURE_DATA);
    if (savedLecture) {
      try {
        const data = JSON.parse(savedLecture);
        setLectureCode(data.code || '');
        setLectureContext(data.context || data);
        setIsLectureStarted(true);
      } catch(e) {}
    }

    return () => window.removeEventListener('storage', handleStorageSync);
  }, [role]);

  // 역할 선택 및 접속
  const handleRoleSelect = (selectedRole, data) => {
    setRole(selectedRole);
    if (data) {
      if (data.code) setLectureCode(data.code);
      if (data.name) setTeacherName(data.name);
      
      if (selectedRole === 'student') {
        const currentStudents = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
        const studentId = `std_${Date.now()}`;
        const newStudentList = [...currentStudents, studentId];
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(newStudentList));
        setStudentCount(newStudentList.length);
      }
      setIsConnected(true);
    }
  };

  // 강의 시작: 교수님이 업로드한 요약 데이터를 가상 서버(localStorage)에 객체로 저장
  const handleStartLecture = (context) => {
    const lectureData = { code: lectureCode, context, isStarted: true };
    localStorage.setItem(STORAGE_KEYS.LECTURE_DATA, JSON.stringify(lectureData));
    setLectureContext(context);
    setIsLectureStarted(true);
  };

  // [STT 수리] 교수의 음성 인식 결과를 실시간으로 가상 서버에 방송
  const handleLiveTextUpdate = useCallback((text) => {
    if (role === 'teacher') {
      // 교수 본인 화면 업데이트
      setLiveText(prev => (prev.length > 500 ? text : prev + ' ' + text));
      // 가상 서버를 통해 학생들에게 전송
      localStorage.setItem(STORAGE_KEYS.LIVE_TRANSCRIPT, JSON.stringify({ text, timestamp: Date.now() }));
    }
  }, [role]);

  // 피드백 데이터 브로드캐스트
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

  const handleTempoChange = (value) => {
    setLectureTempo(value);
    broadcastFeedback({ lectureTempo: value });
  };

  const handleExit = () => {
    if (role === 'teacher') {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    } else if (role === 'student') {
      const currentStudents = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
      currentStudents.pop();
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(currentStudents));
    }
    setRole(null);
    setIsConnected(false);
    setIsLectureStarted(false);
    setLectureContext(null);
    setMisunderstandingCount(0);
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
            {role === 'student' && <StudentView onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={handleTempoChange} lectureTempo={lectureTempo} onMisunderstand={handleMisunderstanding} liveText={liveText} lectureContext={lectureContext} />}
            {role === 'teacher' && <TeacherDashboard wordClicks={wordClicks} lectureTempo={lectureTempo} isStarted={isLectureStarted} onStart={handleStartLecture} misunderstandingCount={misunderstandingCount} onLiveTextUpdate={handleLiveTextUpdate} studentCount={studentCount} />}
            {role === 'simulator' && (
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                <div className="flex-1 lg:border-r border-slate-200 lg:pr-6 overflow-y-auto">
                  <h2 className="text-[10px] font-bold text-slate-300 mb-4 uppercase tracking-tighter">Student Interface</h2>
                  <StudentView onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={handleTempoChange} lectureTempo={lectureTempo} onMisunderstand={handleMisunderstanding} liveText={liveText} lectureContext={lectureContext} />
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
