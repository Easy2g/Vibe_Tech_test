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
  const [isLectureStarted, setIsLectureStarted] = useState(false);
  const [lectureContext, setLectureContext] = useState(null);
  const [liveText, setLiveText] = useState('');
  const [misunderstandingCount, setMisunderstandingCount] = useState(0);
  const [wordClicks, setWordClicks] = useState({
    '인공지능': 0, '머신러닝': 0, '데이터': 0, '알고리즘': 0, '딥러닝': 0
  });
  const [lectureTempo, setLectureTempo] = useState(50);
  const [lastActivity, setLastActivity] = useState(Date.now());

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
        setLectureTempo(data.lectureTempo ?? 50);
      }
    }));
    unsubs.push(onValue(ref(db, `${sessionPath}/students`), (snap) => {
      setStudentCount(snap.exists() ? Object.keys(snap.val()).length : 0);
    }));
    return () => unsubs.forEach(unsub => unsub());
  }, [lectureCode, role]);

  const handleRoleSelect = (selectedRole, data) => {
    setRole(selectedRole);
    if (data) {
      if (data.code) setLectureCode(data.code);
      if (data.name) setTeacherName(data.name);
      if (selectedRole === 'student' && data.code) {
        const studentId = `std_${Date.now()}`;
        set(ref(db, `sessions/${data.code}/students/${studentId}`), { joinedAt: Date.now() });
      }
      setIsConnected(true);
    }
  };

  const handleStartLecture = (context) => {
    const fullContext = { ...context, code: lectureCode };
    set(ref(db, `sessions/${lectureCode}/status`), { isStarted: true });
    set(ref(db, `sessions/${lectureCode}/lectureData`), fullContext);
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
    const newClicks = { ...wordClicks, [word]: (wordClicks[word] || 0) + 1 };
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
    if (role === 'teacher' && lectureCode) {
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
            Vibe Bridge{' '}
            <span className="text-xs font-bold text-indigo-500 ml-2 bg-indigo-50 px-2 py-0.5 rounded-md">PRO</span>
          </h1>
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
            {role === 'student' && <StudentView onWordClick={handleWordClick} lastActivity={lastActivity} onTempoChange={v => { setLectureTempo(v); broadcastFeedback({ lectureTempo: v }); }} lectureTempo={lectureTempo} onMisunderstand={handleMisunderstanding} liveText={liveText} lectureContext={lectureContext} />}
            {role === 'teacher' && <TeacherDashboard wordClicks={wordClicks} lectureTempo={lectureTempo} isStarted={isLectureStarted} onStart={handleStartLecture} misunderstandingCount={misunderstandingCount} onLiveTextUpdate={handleLiveTextUpdate} studentCount={studentCount} liveText={liveText} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}