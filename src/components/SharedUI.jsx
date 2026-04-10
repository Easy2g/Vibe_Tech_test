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
    else onSelect('simulator', { code: '123456', name: '시뮬레이터' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full space-y-8 border border-slate-100 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Vibe Bridge</h1>
          <p className="text-slate-500 text-sm">데이터로 소통하는 인공지능 교육 중재 솔루션</p>
        </div>
        <div className="space-y-4 pt-4">
          <button onClick={() => handleRoleClick('student')} className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-indigo-500 transition-all">👨‍🎓 학생으로 시작하기</button>
          <button onClick={() => handleRoleClick('teacher')} className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-indigo-500 transition-all">👨‍🏫 교수 대시보드 입장</button>
          <button onClick={() => handleRoleClick('simulator')} className="w-full py-4 bg-indigo-600 rounded-2xl font-bold text-white shadow-lg">🚀 통합 시뮬레이터 실행</button>
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
    } else alert('비밀번호가 틀렸습니다. (기본: 1234)');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.form 
        onSubmit={handleSubmit} 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm space-y-6 relative border border-white/20"
      >
        <button 
          type="button" 
          onClick={handleClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-indigo-600 transition-all duration-300 hover:rotate-90"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800">교수 인증</h2>
          <p className="text-[11px] text-slate-400 font-medium">관리자 권한으로 세션을 생성합니다.</p>
        </div>

        <div className="space-y-4">
          <input type="text" placeholder="성함" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
          <input type="password" placeholder="비밀번호" required value={pw} onChange={e => setPw(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all" />
        </div>
        <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98]">입장하기</button>
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
    
    // [가상 서버] localStorage에서 현재 활성화된 강의 정보 확인
    const savedLecture = localStorage.getItem('lectureData');
    
    if (!savedLecture) {
      alert('현재 생성된 강의가 없거나 아직 강의가 시작되지 않았습니다. 교수님의 시작을 기다려주세요.');
      return;
    }

    try {
      const data = JSON.parse(savedLecture);
      
      // 1. 강의 코드 일치 여부 확인
      if (inputCode !== data.code) {
        alert('강의 코드가 일치하지 않습니다. 다시 확인해주세요.');
        return;
      }

      // 2. 강의 시작 여부 확인 (교수가 '강의 시작' 버튼을 눌렀는지)
      if (!data.isStarted) {
        alert('교수님이 아직 강의를 시작하지 않았습니다. 잠시만 대기해주세요.');
        return;
      }

      // 모든 조건 만족 시 입장
      onEntry();
      
    } catch (err) {
      alert('강의 정보를 읽어오는 중 오류가 발생했습니다.');
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
        <button 
          type="button" 
          onClick={handleClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-indigo-600 transition-all duration-300 hover:rotate-90"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800">강의 참여</h2>
          <p className="text-[11px] text-slate-400 font-medium">교수님께 받은 6자리 코드를 입력해주세요.</p>
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
        <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98]">참여하기</button>
      </motion.form>
    </div>
  );
}

/**
 * 단어 설명 모달: 레벨 선택을 삭제하고, AI 분석 기반의 세부적인 전문 설명을 노출합니다.
 */
export function WordExplanationModal({ word, onClose, lectureContext }) {
  const explanations = {
    '인공지능': '인간의 지능적 행위를 컴퓨터 프로그램으로 모방하는 광범위한 기술 체계입니다. 추론, 학습, 인식을 포함하며 현대 지능형 시스템의 근간이 됩니다.',
    '머신러닝': '명시적인 프로그래밍 없이 데이터의 통계적 구조를 학습하여 성능을 최적화하는 알고리즘 연구 분야입니다. 손실 함수 최소화를 목표로 가중치를 갱신합니다.',
    '데이터': '알고리즘의 입력값으로 사용되는 정형/비정형 정보의 집합입니다. 피처 엔지니어링을 통해 모델이 학습 가능한 형태로 가공된 원천 재료를 의미합니다.',
    '알고리즘': '주어진 입력으로부터 원하는 출력을 도출하기 위해 정의된 유한한 절차의 집합입니다. 시간 복잡도와 공간 복잡도 분석을 통한 효율성 검증이 필수적입니다.',
    '딥러닝': '인간 뇌의 생물학적 신경망 구조를 모방한 다층 퍼셉트론(MLP) 기반의 심화 학습 기술입니다. 역전파 알고리즘을 통해 수백만 개의 파라미터를 최적화합니다.'
  };

  // 강의 맥락(오늘의 주제)에 따른 부가 설명 생성
  const contextInjectedText = lectureContext?.summary?.topic 
    ? `[${lectureContext.summary.topic}] 강의 맥락 내 분석: ${explanations[word] || '준비 중입니다.'}`
    : explanations[word] || '분석된 강의 자료를 바탕으로 상세 설명을 준비 중입니다.';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
      >
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
          <h4 className="font-bold text-lg text-slate-800">지능형 상세 사전: {word}</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        
        <div className="p-8">
          <p className="text-slate-700 font-semibold leading-relaxed text-sm">
            {contextInjectedText}
          </p>
        </div>
        
        <div className="bg-indigo-50/50 py-3 text-center border-t border-indigo-100">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest italic">AI Analysis Based Context</span>
        </div>
      </motion.div>
    </div>
  );
}
