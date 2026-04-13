import React, { useState, useCallback, useEffect } from 'react';
import { RoleSelection } from './components/SharedUI';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import { AnimatePresence, motion } from 'framer-motion';
import { db, ref, set, onValue, push, remove } from './firebase';

export default function App() {
  const [role, setRole] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lectureCode, setLectureCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [studentCount, setStudentCount] = useState(0);
  const [students, setStudents] = useState({}); // 학생 객체 상태 추가
  const [isLectureStarted, setIsLectureStarted] = useState(false);
  const [lectureContext, setLectureContext] = useState(null);
  const [liveText, setLiveText] = useState('');
  const [misunderstandingCount, setMisunderstandingCount] = useState(0);
  const [wordClicks, setWordClicks] = useState({});
  const [lectureTempo, setLectureTempo] = useState({ value: '적당' });
  const [lastActivity, setLastActivity] = useState(Date.now());

  // 교수 세션 상태 (localStorage 복원)
  const [teacherSession, setTeacherSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("teacherSession") || "null"); }
    catch { return null; }
  });

  useEffect(() => {
    if (!lectureCode) return;
    const sessionPath = `sessions/${lectureCode}`;
    const unsubs = [];
    unsubs.push(onValue(ref(db, `${sessionPath}/status`), (snap) => {
      if (snap.exists()) setIsLectureStarted(snap.val().isStarted);
    }));
    unsubs.push(onValue(ref(db, `${sessionPath}/lectureData`), (snap) => {
      if (snap.exists()) setLectureContext(snap.val());
    }));
    unsubs.push(onValue(ref(db, `${sessionPath}/subtitle`), (snap) => {
      if (snap.exists() && role === 'student') {
        const incoming = snap.val().text || '';
        setLiveText(prev => {
          const combined = prev ? prev + ' ' + incoming : incoming;
          return combined.length > 3000 ? combined.slice(-2000) : combined;
        });
      }
    }));
    unsubs.push(onValue(ref(db, `${sessionPath}/feedback`), (snap) => {
      if (snap.exists() && role === 'teacher') {
        const data = snap.val();
        setMisunderstandingCount(data.misunderstandingCount ?? 0);
        setWordClicks(data.wordClicks ?? {});
        setLectureTempo(data.lectureTempo ?? { value: '적당' });
      }
    }));
    // 학생도 lectureTempo 상태를 알아야 하이라이트 가능하므로 추가 리스너
    unsubs.push(onValue(ref(db, `${sessionPath}/feedback/lectureTempo`), (snap) => {
      if (snap.exists()) setLectureTempo(snap.val());
    }));
    unsubs.push(onValue(ref(db, `${sessionPath}/students`), (snap) => {
      const data = snap.val() || {};
      setStudents(data);
      setStudentCount(Object.keys(data).length);
    }));
    return () => unsubs.forEach(unsub => unsub());
  }, [lectureCode, role]);

  const handleRoleSelect = (selectedRole, data) => {
    setRole(selectedRole);
    if (data) {
      if (selectedRole === 'teacher') {
        // TeacherAuthModal 성공 시 넘어오는 데이터 (teacherId, teacherName, teacherCode)
        setTeacherSession(data);
        setTeacherName(data.teacherName);
        // 교수 로그인 시 6자리 랜덤 강의코드를 자동 생성하여 대시보드 진입
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        setLectureCode(randomCode);
      } else {
        if (data.code) setLectureCode(data.code);
        const studentId = `std_${Date.now()}`;
        set(ref(db, `sessions/${data.code}/students/${studentId}`), { joinedAt: Date.now() });
      }
      setIsConnected(true);
    }
  };

  const handleTeacherLogout = () => {
    localStorage.removeItem("teacherSession");
    setTeacherSession(null);
    handleExit();
  };

  const handleStartLecture = (context) => {
    const fullContext = { ...context, code: lectureCode };
    set(ref(db, `sessions/${lectureCode}/status`), { isStarted: true });
    set(ref(db, `sessions/${lectureCode}/lectureData`), fullContext);
    
    // 학생 구독을 위한 강의 정보 저장
    set(ref(db, `sessions/${lectureCode}/info`), {
      teacherId: teacherSession?.teacherId || "unknown",
      teacherName: teacherSession?.teacherName || "교수",
      teacherCode: teacherSession?.teacherCode || "",
      topic: fullContext.topic || "강의 진행 중",
      isActive: true,
      startedAt: Date.now(),
    });

    setLectureContext(fullContext);
    setIsLectureStarted(true);
  };

  const handleLiveTextUpdate = useCallback((text) => {
    if (!lectureCode) return;
    setLiveText(prev => {
      const combined = prev ? prev + ' ' + text : text;
      return combined.length > 3000 ? combined.slice(-2000) : combined;
    });
    set(ref(db, `sessions/${lectureCode}/subtitle`), {
      text,
      timestamp: Date.now()
    });
  }, [lectureCode]);

  const broadcastFeedback = (updates) => {
    if (!lectureCode) return;
    const current = { misunderstandingCount, wordClicks, lectureTempo, ...updates };
    set(ref(db, `sessions/${lectureCode}/feedback`), current);
  };

  const handleWordClick = (word) => {
    // wordClicks가 push() 구조로 저장되도록 수정 (요청 사양 반영)
    const clickRef = ref(db, `sessions/${lectureCode}/feedback/wordClicks`);
    push(clickRef, { word, timestamp: Date.now() });
    
    setLastActivity(Date.now());
  };

  const handleMisunderstanding = () => {
    const newCount = misunderstandingCount + 1;
    setMisunderstandingCount(newCount);
    broadcastFeedback({ misunderstandingCount: newCount });
  };

  const handleExit = async () => {
    if (role === 'teacher' && lectureCode) {
      // 강의 종료 시 isActive false 처리 후 데이터 삭제 (또는 유지)
      await set(ref(db, `sessions/${lectureCode}/info/isActive`), false);
      remove(ref(db, `sessions/${lectureCode}`));
    }
    setRole(null);
    setIsConnected(false);
    setIsLectureStarted(false);
    setLectureContext(null);
    setLiveText('');
    setLectureCode('');
  };

  if (!role) return <RoleSelection onSelect={handleRoleSelect} lectureCode={lectureCode} />;

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      <nav className="h-16 bg-white border-b border-slate-100 px-6 flex justify-between items-center flex-shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-black text-slate-800 tracking-tight">
            Vibe<span className="text-indigo-500">-Tech</span>
          </h1>
          {isConnected && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              <span className="text-[10px] font-black text-indigo-400 uppercase">Live Code</span>
              <span className="text-sm font-black text-indigo-600 tracking-widest">{lectureCode}</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {teacherSession && role === 'teacher' && (
            <div className="flex items-center gap-3 border-r border-slate-100 pr-4 mr-2">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-700">{teacherSession.teacherName} 교수님</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  교수코드: <span className="font-black text-indigo-500 tracking-widest">{teacherSession.teacherCode}</span>
                </p>
              </div>
              <button
                onClick={handleTeacherLogout}
                className="text-[10px] font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Session User</p>
            <p className="text-xs font-bold text-slate-700">{role === 'teacher' ? '👨‍🏫 교수 대시보드' : '👨‍🎓 학생 View'}</p>
          </div>
          <button onClick={handleExit} className="text-[11px] font-bold bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 px-4 py-2 rounded-xl transition-all active:scale-[0.98]">강의 종료</button>
        </div>
      </nav>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={role} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            {role === 'student' && <StudentView onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={v => { setLectureTempo(v); broadcastFeedback({ lectureTempo: v }); }} lectureTempo={lectureTempo} onMisunderstand={handleMisunderstanding} liveText={liveText} lectureContext={lectureContext} />}
            {role === 'teacher' && (
              <TeacherDashboard 
                wordClicks={wordClicks} 
                lectureTempo={lectureTempo} 
                isStarted={isLectureStarted} 
                onStart={handleStartLecture} 
                misunderstandingCount={misunderstandingCount} 
                onLiveTextUpdate={handleLiveTextUpdate} 
                studentCount={studentCount} 
                students={students}
                liveText={liveText} 
                lectureData={lectureContext}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}