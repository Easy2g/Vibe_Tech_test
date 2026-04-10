import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 공통 컴포넌트: 역할 선택 (Role Selection)
// ==========================================
export function RoleSelection({ onSelect, lectureCode }) {
  const [showTeacherLogin, setShowTeacherLogin] = useState(false);
  const [showStudentEntry, setShowStudentEntry] = useState(false);

  // 역할 선택 핸들러: 각 역할에 맞는 인증 모달을 활성화합니다.
  const handleRoleClick = (role) => {
    if (role === 'teacher') setShowTeacherLogin(true);
    else if (role === 'student') setShowStudentEntry(true);
    else onSelect('simulator', { code: '123456', name: '시뮬레이터' }); // 시뮬레이터는 즉시 진입
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full space-y-8 border border-slate-100 text-center"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Vibe Bridge</h1>
          <p className="text-slate-500 text-sm">데이터로 소통하는 인공지능 교육 중재 솔루션</p>
        </div>
        <div className="space-y-4 pt-4">
          <button 
            onClick={() => handleRoleClick('student')} 
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 font-semibold py-4 rounded-2xl transition-all"
          >
            👨‍🎓 학생으로 시작하기
          </button>
          <button 
            onClick={() => handleRoleClick('teacher')} 
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 font-semibold py-4 rounded-2xl transition-all"
          >
            👨‍🏫 교수 대시보드 입장
          </button>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs text-slate-400"><span className="bg-white px-2">OR</span></div>
          </div>
          <button 
            onClick={() => handleRoleClick('simulator')} 
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-200"
          >
            🚀 통합 시뮬레이터 실행
          </button>
        </div>
      </motion.div>

      {/* 인증 모달들 */}
      <AnimatePresence>
        {showTeacherLogin && (
          <TeacherLoginModal 
            onClose={() => setShowTeacherLogin(false)} 
            onLogin={(data) => onSelect('teacher', data)} 
          />
        )}
        {showStudentEntry && (
          <StudentEntryModal 
            validCode={lectureCode}
            onClose={() => setShowStudentEntry(false)} 
            onEntry={() => onSelect('student', { code: lectureCode })} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 교수 전용 로그인 모달: 이름과 비밀번호를 확인합니다.
function TeacherLoginModal({ onClose, onLogin }) {
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pw === '1234') {
      // 랜덤 6자리 강의 코드 생성
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      onLogin({ name, code: randomCode });
    } else {
      alert('비밀번호가 틀렸습니다. (기본: 1234)');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.form 
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm space-y-6"
      >
        <h2 className="text-xl font-bold text-slate-800">교수 인증</h2>
        <div className="space-y-4">
          <input 
            type="text" placeholder="성함을 입력하세요" required value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input 
            type="password" placeholder="비밀번호 (1234)" required value={pw} onChange={e => setPw(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">취소</button>
          <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl">입장하기</button>
        </div>
      </motion.form>
    </div>
  );
}

// 학생 전용 강의 코드 입력 모달: 생성된 강의 코드와 일치해야 입장 가능합니다.
function StudentEntryModal({ validCode, onClose, onEntry }) {
  const [inputCode, setInputCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // 실제 연결 시뮬레이션을 위해, 교수가 생성한 코드 또는 기본 '123456'을 허용합니다.
    if (inputCode === (validCode || '123456')) {
      onEntry();
    } else {
      alert('강의 코드가 일치하지 않습니다. (교수 화면의 코드를 확인하세요)');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.form 
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm space-y-6 text-center"
      >
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">강의 참여</h2>
          <p className="text-sm text-slate-500">교수님께 받은 6자리 코드를 입력하세요.</p>
        </div>
        <input 
          type="text" placeholder="000000" maxLength={6} required 
          value={inputCode} onChange={e => setInputCode(e.target.value)}
          className="w-full px-4 py-4 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">취소</button>
          <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl">참여하기</button>
        </div>
      </motion.form>
    </div>
  );
}

/**
 * 단어 설명 모달: 화면 중앙에 고정되어 짤림 현상을 방지합니다.
 */
export function WordExplanationModal({ word, onClose }) {
  const [level, setLevel] = useState('intro');
  const explanations = {
    '인공지능': { intro: '기계가 지능을 갖게 하는 기술', deep: '추론/학습의 소프트웨어적 구현', master: 'AGI와 ANI를 포괄하는 광범위한 분야' },
    '머신러닝': { intro: '데이터로 스스로 규칙을 찾는 기술', deep: '명시적 프로그래밍 없는 패턴 학습', master: '확률/통계 기반의 가중치 최적화' },
    '데이터': { intro: '인공지능의 학습 재료', deep: '정형/비정형 정보의 집합', master: '모델 성능을 결정하는 피처와 라벨' },
    '알고리즘': { intro: '문제를 해결하는 요리 레시피', deep: '입력에서 출력을 내는 유한한 연산', master: '시공간 복잡도가 최적화된 수학 모델' },
    '딥러닝': { intro: '인간의 뇌를 모방한 심화 학습', deep: '다층 신경망(ANN) 구조의 학습', master: '역전파를 통한 심층 가중치 갱신' }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100"
      >
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
          <h4 className="font-bold text-lg text-slate-800">{word}</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex bg-slate-50 rounded-xl p-1 relative">
            {['intro', 'deep', 'master'].map(lv => (
              <button 
                key={lv} 
                onClick={() => setLevel(lv)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg z-10 transition-colors ${level === lv ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                {level === lv && <motion.div layoutId="tab" className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10" />}
                {lv === 'intro' ? '기초' : lv === 'deep' ? '심화' : '전문'}
              </button>
            ))}
          </div>
          
          <div className="min-h-[80px] flex items-center justify-center text-center">
            <p className="text-slate-600 font-medium leading-relaxed">
              {explanations[word]?.[level] || '설명 준비 중'}
            </p>
          </div>
        </div>
        
        <div className="bg-indigo-50/50 py-3 text-center">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">익명 데이터 전송 완료</span>
        </div>
      </motion.div>
    </div>
  );
}
