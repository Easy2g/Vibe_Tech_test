import React, { useState, useCallback, useEffect } from 'react';
import { RoleSelection } from './components/SharedUI';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * 가상 서버 데이터 키 정의
 */
const STORAGE_KEYS = {
  LECTURE: 'vibe_lecture_info',    // 강의 코드 및 맥락
  FEEDBACK: 'vibe_feedback_data',  // 클릭 및 미이해 데이터
  STUDENTS: 'vibe_student_list',   // 접속 중인 학생 리스트
};

/**
 * 중앙 상태 관리자: 앱의 모든 실시간 데이터(STT, 클릭, 미이해 등)를 통합 관리합니다.
 * localStorage 기반의 '가상 서버' 로직을 통해 브라우저 탭 간 실시간 동기화를 지원합니다.
 */
export default function App() {
  const [role, setRole] = useState(null); 
  const [isConnected, setIsConnected] = useState(false);
  const [lectureCode, setLectureCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  
  // [신규] 실시간 접속 학생 수 상태
  const [studentCount, setStudentCount] = useState(0);

  // 강의 세션 상태
  const [isLectureStarted, setIsLectureStarted] = useState(false);
  const [lectureContext, setLectureContext] = useState(null);

  // 실시간 음성 인식 자막 데이터
  const [liveText, setLiveText] = useState('');

  // 학생 피드백 데이터
  const [misunderstandingCount, setMisunderstandingCount] = useState(0);
  const [wordClicks, setWordClicks] = useState({
    '인공지능': 0, '머신러닝': 0, '데이터': 0, '알고리즘': 0, '딥러닝': 0
  });

  const [lectureTempo, setLectureTempo] = useState(50);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // [가상 서버] 타 탭에서 변경된 데이터 실시간 수신 및 동기화
  useEffect(() => {
    const handleStorageSync = (e) => {
      if (!e.newValue) {
        // 데이터가 삭제된 경우 (강의 종료 등)
        if (e.key === STORAGE_KEYS.LECTURE) {
          setIsLectureStarted(false);
          setLectureContext(null);
        }
        if (e.key === STORAGE_KEYS.STUDENTS) setStudentCount(0);
        return;
      }

      const data = JSON.parse(e.newValue);

      switch (e.key) {
        case STORAGE_KEYS.LECTURE:
          setLectureCode(data.code);
          setLectureContext(data.context);
          setIsLectureStarted(data.isStarted);
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
    };

    window.addEventListener('storage', handleStorageSync);
    
    // 초기 로드 시 기존 세션 동기화 (학생 탭이 새로고침되었을 때 등)
    const savedLecture = localStorage.getItem(STORAGE_KEYS.LECTURE);
    if (savedLecture) {
      const data = JSON.parse(savedLecture);
      setLectureCode(data.code);
      setLectureContext(data.context);
      setIsLectureStarted(data.isStarted);
    }

    const savedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (savedStudents) setStudentCount(JSON.parse(savedStudents).length);

    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // 역할 선택 및 접속
  const handleRoleSelect = (selectedRole, data) => {
    setRole(selectedRole);
    if (data) {
      if (data.code) setLectureCode(data.code);
      if (data.name) setTeacherName(data.name);
      
      // 학생 입장 시 가상 서버에 학생 정보 등록 및 카운트 업데이트
      if (selectedRole === 'student') {
        const currentStudents = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
        const studentId = `std_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newStudentList = [...currentStudents, studentId];
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(newStudentList));
        setStudentCount(newStudentList.length);
      }
      
      setIsConnected(true);
    }
  };

  // 강의 시작 (교수 전용: localStorage에 강의 정보 브로드캐스트)
  const handleStartLecture = (context) => {
    const lectureData = { code: lectureCode, context, isStarted: true };
    localStorage.setItem(STORAGE_KEYS.LECTURE, JSON.stringify(lectureData));
    setLectureContext(context);
    setIsLectureStarted(true);
  };

  // 피드백 데이터 통합 브로드캐스트 함수
  const broadcastFeedback = (updates) => {
    const currentFeedback = {
      misunderstandingCount,
      wordClicks,
      lectureTempo,
      ...updates
    };
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(currentFeedback));
  };

  // 실시간 자막 업데이트 핸들러
  const handleLiveTextUpdate = useCallback((text) => {
    setLiveText(prev => (prev.length > 500 ? text : prev + ' ' + text));
  }, []);

  // 단어 클릭 처리 (피드백 브로드캐스트 포함)
  const handleWordClick = (word) => {
    const newClicks = { ...wordClicks, [word]: wordClicks[word] + 1 };
    setWordClicks(newClicks);
    setLastActivity(Date.now());
    broadcastFeedback({ wordClicks: newClicks });
  };

  // 맥락 미이해 처리 (피드백 브로드캐스트 포함)
  const handleMisunderstanding = () => {
    const newCount = misunderstandingCount + 1;
    setMisunderstandingCount(newCount);
    broadcastFeedback({ misunderstandingCount: newCount });
  };

  // 강의 속도 조절 처리 (피드백 브로드캐스트 포함)
  const handleTempoChange = (value) => {
    setLectureTempo(value);
    broadcastFeedback({ lectureTempo: value });
  };

  // 나가기 (데이터 초기화 및 가상 서버 세션 종료)
  const handleExit = () => {
    if (role === 'teacher') {
      // 교수가 나가면 가상 서버의 모든 강의 데이터 파기 (전체 세션 종료)
      localStorage.removeItem(STORAGE_KEYS.LECTURE);
      localStorage.removeItem(STORAGE_KEYS.FEEDBACK);
      localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    } else if (role === 'student') {
      // 학생이 나가면 가상 서버 학생 리스트에서 한 명 제거
      const currentStudents = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
      if (currentStudents.length > 0) {
        currentStudents.pop(); 
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(currentStudents));
      }
    }
    
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
                liveText={liveText} lectureContext={lectureContext}
              />
            )}
            
            {role === 'teacher' && (
              <TeacherDashboard 
                wordClicks={wordClicks} lectureTempo={lectureTempo} isStarted={isLectureStarted}
                onStart={handleStartLecture} misunderstandingCount={misunderstandingCount}
                onLiveTextUpdate={handleLiveTextUpdate} studentCount={studentCount}
              />
            )}

            {role === 'simulator' && (
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                <div className="flex-1 lg:border-r border-slate-200 lg:pr-6 overflow-y-auto">
                  <h2 className="text-[10px] font-bold text-slate-300 mb-4 uppercase tracking-tighter">Student Interface</h2>
                  <StudentView 
                    onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={handleTempoChange} 
                    lectureTempo={lectureTempo} onMisunderstand={handleMisunderstanding}
                    liveText={liveText} lectureContext={lectureContext}
                  />
                </div>
                <div className="flex-1 lg:pl-2 min-h-0 overflow-hidden">
                  <h2 className="text-[10px] font-bold text-slate-300 mb-4 uppercase tracking-tighter">Teacher Dashboard</h2>
                  <TeacherDashboard 
                    wordClicks={wordClicks} lectureTempo={lectureTempo} isStarted={isLectureStarted}
                    onStart={handleStartLecture} misunderstandingCount={misunderstandingCount}
                    onLiveTextUpdate={handleLiveTextUpdate} studentCount={studentCount}
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
