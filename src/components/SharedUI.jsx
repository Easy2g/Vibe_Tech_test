import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 공통 컴포넌트: 역할 선택 (Role Selection)
// ==========================================
export function RoleSelection({ onSelect, lectureCode }) {
  const [showTeacherLogin, setShowTeacherLogin] = useState(false);
  const [showStudentEntry, setShowStudentEntry] = useState(false);

  const handleRoleClick = (role) => {
    if (role === 'teacher') setShowTeacherLogin(true);
    else if (role === 'student') setShowStudentEntry(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full space-y-8 border border-slate-100 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Vibe Bridge <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">PRO</span></h1>
          <p className="text-slate-500 text-sm">데이터로 소통하는 인공지능 교육 중재 솔루션</p>
        </div>
        <div className="space-y-4 pt-4">
          <button onClick={() => handleRoleClick('student')} className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-indigo-500 transition-all shadow-sm">👨‍🎓 학생으로 참여하기</button>
          <button onClick={() => handleRoleClick('teacher')} className="w-full py-4 bg-indigo-600 rounded-2xl font-bold text-white hover:bg-indigo-700 transition-all shadow-lg">👨‍🏫 교수 대시보드 열기</button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showTeacherLogin && <TeacherLoginModal onClose={() => setShowTeacherLogin(false)} onLogin={(data) => onSelect('teacher', data)} />}
        {showStudentEntry && <StudentEntryModal validCode={lectureCode} onClose={() => setShowStudentEntry(false)} onEntry={() => onSelect('student', { code: lectureCode })} />}
      </AnimatePresence>
    </div>
  );
}

function TeacherLoginModal({ onClose, onLogin }) {
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  
  const handleClose = () => {
    setName('');
    setPw('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pw === '1234') {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      onLogin({ name, code: randomCode });
    } else alert('비밀번호가 일치하지 않습니다.');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.form 
        onSubmit={handleSubmit} 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm space-y-6 relative border border-white/20"
      >
        <button type="button" onClick={handleClose} className="absolute top-6 right-6 text-slate-400 hover:text-indigo-600 transition-all duration-300 hover:rotate-90" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800">교수 인증</h2>
          <p className="text-[11px] text-slate-400 font-medium">실시간 강의 세션을 활성화합니다.</p>
        </div>

        <div className="space-y-4">
          <input type="text" placeholder="성함" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
          <input type="password" placeholder="비밀번호 (기본: 1234)" required value={pw} onChange={e => setPw(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
        </div>
        <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98]">세션 열기</button>
      </motion.form>
    </div>
  );
}

function StudentEntryModal({ validCode, onClose, onEntry }) {
  const [inputCode, setInputCode] = useState('');

  const handleClose = () => {
    setInputCode('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // [프로덕션] 상태 점검: 진행 중인 강의가 있는지 확인
    const savedStatus = localStorage.getItem('vibe_lecture_status');
    const savedLecture = localStorage.getItem('vibe_lecture_data');
    
    if (!savedStatus || !JSON.parse(savedStatus).isStarted) {
      alert('현재 진행 중인 강의가 없습니다. 교수님이 [실시간 세션 시작하기] 버튼을 누르셨는지 확인해주세요.');
      return;
    }

    try {
      const lectureData = JSON.parse(savedLecture);
      // 저장된 데이터의 code와 입력한 코드를 문자열로 변환하여 비교
      if (String(inputCode).trim() !== String(lectureData.code).trim()) {
        alert(`강의 코드가 일치하지 않습니다.\n입력하신 코드: ${inputCode}\n교실 코드: ${lectureData.code}`);
        return;
      }
      onEntry();
    } catch (err) {
      console.error("Entry Error:", err);
      alert('입장 중 시스템 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.form 
        onSubmit={handleSubmit} 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm space-y-6 text-center relative border border-white/20"
      >
        <button type="button" onClick={handleClose} className="absolute top-6 right-6 text-slate-400 hover:text-indigo-600 transition-all duration-300 hover:rotate-90" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800">강의실 입장</h2>
          <p className="text-[11px] text-slate-400 font-medium">교실 화면에 표시된 6자리 코드를 입력하세요.</p>
        </div>

        <input 
          type="text" 
          placeholder="000000" 
          maxLength={6} 
          required 
          value={inputCode} 
          onChange={e => setInputCode(e.target.value)} 
          className="w-full px-4 py-5 text-center text-4xl font-black rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all tracking-widest placeholder:text-slate-100" 
        />
        <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98]">입장하기</button>
      </motion.form>
    </div>
  );
}

export function WordExplanationModal({ word, onClose, lectureContext }) {
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExplanation = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, topic: lectureContext?.topic })
        });
        if (response.ok) {
          const data = await response.json();
          setExplanation(data.explanation);
        } else {
          throw new Error('설명을 가져오지 못했습니다.');
        }
      } catch (err) {
        setExplanation(`${word}에 대한 상세 정보를 실시간으로 분석할 수 없습니다. 잠시 후 다시 시도해주세요.`);
      } finally {
        setIsLoading(false);
      }
    };

    if (word) fetchExplanation();
  }, [word, lectureContext]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
      >
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Contextual Dictionary</span>
            <h4 className="font-bold text-lg text-slate-800">{word}</h4>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl transition-colors">✕</button>
        </div>
        <div className="p-8 min-h-[160px] flex flex-col justify-center">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-slate-100 rounded-full animate-pulse w-full"></div>
              <div className="h-4 bg-slate-100 rounded-full animate-pulse w-5/6"></div>
              <div className="h-4 bg-slate-100 rounded-full animate-pulse w-4/6"></div>
            </div>
          ) : (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-slate-700 font-semibold leading-relaxed text-sm whitespace-pre-line"
            >
              {explanation}
            </motion.p>
          )}
        </div>
        <div className="bg-indigo-50/50 py-3 text-center border-t border-indigo-100">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest italic flex items-center justify-center gap-2">
            {isLoading ? <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></span> : "✨"} 
            AI Contextual Analysis Complete
          </span>
        </div>
      </motion.div>
    </div>
  );
}
