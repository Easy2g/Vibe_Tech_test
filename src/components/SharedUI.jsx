import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 공통 컴포넌트: 역할 선택 (Role Selection)
// ==========================================
export function RoleSelection({ onSelect }) {
  // 제어 공학 관점에서, 사용자의 선택 입력(Input)을 받아 시스템 상태를 천이(Transition)시키는 초기 노드입니다.
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 max-w-md w-full space-y-8 border border-white/50 text-center"
      >
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Vibe Bridge</h1>
          <p className="text-slate-500 font-medium text-sm">데이터로 잇는 언어의 벽, AI 중재 솔루션</p>
        </div>
        <div className="space-y-4 pt-4">
          <motion.button 
            whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('student')} 
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 font-semibold py-4 rounded-2xl transition-colors"
          >
            👨‍🎓 학생으로 시작하기
          </motion.button>
          <motion.button 
            whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('teacher')} 
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-700 font-semibold py-4 rounded-2xl transition-colors"
          >
            👨‍🏫 교수 대시보드 입장
          </motion.button>
          <div className="relative py-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div><div className="relative flex justify-center text-xs text-slate-400"><span className="bg-white px-2 uppercase">Development Only</span></div></div>
          <motion.button 
            whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgb(79 70 229 / 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('simulator')} 
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-xl shadow-indigo-600/20"
          >
            🚀 통합 시뮬레이터 실행
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 공통 컴포넌트: 3단계 설명 모달 (Word Dictionary Modal)
// ==========================================
export function WordExplanationModal({ word, onClose }) {
  // 모달 컴포넌트는 AnimatePresence에 의해 마운트/언마운트 시 감쇠 진동(Damped oscillation)을 보이며 나타납니다.
  const [level, setLevel] = useState('intro');
  const explanations = {
    '인공지능': { intro: '기계가 지능을 갖게 하는 기술', deep: '추론/학습의 소프트웨어적 구현', master: 'AGI와 ANI를 포괄하는 광범위한 분야' },
    '머신러닝': { intro: '데이터로 스스로 규칙을 찾는 기술', deep: '명시적 프로그래밍 없는 패턴 학습', master: '확률/통계 기반의 가중치 최적화' },
    '데이터': { intro: '인공지능의 학습 재료', deep: '정형/비정형 정보의 집합', master: '모델 성능을 결정하는 피처와 라벨' },
    '알고리즘': { intro: '문제를 해결하는 요리 레시피', deep: '입력에서 출력을 내는 유한한 연산', master: '시공간 복잡도가 최적화된 수학 모델' },
    '딥러닝': { intro: '인간의 뇌를 모방한 심화 학습', deep: '다층 신경망(ANN) 구조의 학습', master: '역전파를 통한 심층 가중치 갱신' }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h4 className="text-xl font-bold">사전: <span className="text-indigo-600">{word}</span></h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex bg-slate-100 rounded-xl p-1 shadow-inner relative">
            {['intro', 'deep', 'master'].map(lv => (
              <button 
                key={lv} 
                onClick={() => setLevel(lv)} 
                className={`relative flex-1 text-xs font-bold py-2 rounded-lg transition-all z-10 ${level === lv ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {/* 선택된 탭 배경을 Framer Motion의 layoutId로 부드럽게 이동(Sliding) 시킵니다. */}
                {level === lv && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10" 
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                {lv === 'intro' ? '🌱 입문' : lv === 'deep' ? '🌿 심화' : '🌳 마스터'}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div 
              key={level}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-[100px] flex items-center justify-center bg-slate-50 rounded-2xl p-4 text-center text-slate-700 font-medium"
            >
              {explanations[word]?.[level] || '준비 중인 설명입니다.'}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="bg-indigo-50 p-3 text-center text-[10px] font-bold text-indigo-700 uppercase tracking-widest">
          Anonymous Data Sent to Teacher
        </div>
      </motion.div>
    </motion.div>
  );
}
