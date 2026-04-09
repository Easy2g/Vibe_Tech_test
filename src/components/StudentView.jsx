import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordExplanationModal } from './SharedUI';

// ==========================================
// 학생 노드 제어기 (Student View)
// ==========================================
export default function StudentView({ onWordClick, lastActivity, onTempoChange, lectureTempo }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [showActiveCheck, setShowActiveCheck] = useState(false);
  const [startTime] = useState(Date.now());

  // [인터럽트 타이머] 센서 무응답(Activity Timeout) 감지 로직
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const inactiveSeconds = (now - lastActivity) / 1000;
      const sessionSeconds = (now - startTime) / 1000;

      // 15초간 입력이 없거나 세션 시작 30초 후 팝업 인터럽트 발생
      if (inactiveSeconds > 15 || (sessionSeconds > 30 && !showActiveCheck)) {
        setShowActiveCheck(true);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [lastActivity, showActiveCheck]);

  // 스크립트 페이로드 (텍스트 및 키워드 노드)
  const scriptText = [
    { type: 'text', content: '이번 단원에서는 ' },
    { type: 'keyword', content: '인공지능' },
    { type: 'text', content: '의 학습 원리인 ' },
    { type: 'keyword', content: '머신러닝' },
    { type: 'text', content: '을 다룹니다. 양질의 ' },
    { type: 'keyword', content: '데이터' },
    { type: 'text', content: '가 입력되면 ' },
    { type: 'keyword', content: '알고리즘' },
    { type: 'text', content: '이 최적의 값을 찾고, 이를 심화한 형태가 ' },
    { type: 'keyword', content: '딥러닝' },
    { type: 'text', content: '입니다.' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
        <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
          실시간 자막 & 클릭 사전
        </h3>
        
        <div className="text-lg md:text-xl leading-loose text-slate-700 font-medium">
          {scriptText.map((part, index) => (
            part.type === 'keyword' ? (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                key={index} 
                onClick={() => { onWordClick(part.content); setSelectedWord(part.content); }}
                className="group relative inline-flex items-center justify-center font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-3 py-1 mx-1 rounded-xl transition-colors"
              >
                {part.content}
                <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border border-white"></span>
                </span>
              </motion.button>
            ) : <span key={index}>{part.content}</span>
          ))}
        </div>

        {/* AnimatePresence를 통해 모달의 마운트/언마운트 트랜지션을 관리합니다. */}
        <AnimatePresence>
          {selectedWord && <WordExplanationModal word={selectedWord} onClose={() => setSelectedWord(null)} />}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {/* 학생 피드백 제어기 (Slider Input) */}
        {showActiveCheck && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="bg-white border-2 border-indigo-200 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-xl">🤖</span> AI 중재자의 질문
                </h4>
                <p className="text-sm text-slate-500">학생님, 지금 강의 속도가 따라오기 적절하신가요?</p>
              </div>
              <button onClick={() => setShowActiveCheck(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-4">
              <input 
                type="range" min="0" max="100" value={lectureTempo} 
                onChange={(e) => onTempoChange(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>너무 느려요</span>
                <motion.span 
                  key={lectureTempo} // 값이 변할 때마다 애니메이션 트리거
                  initial={{ scale: 1.2, color: '#4f46e5' }}
                  animate={{ scale: 1, color: '#4f46e5' }}
                  className="bg-indigo-50 px-2 py-0.5 rounded"
                >
                  적당함 ({lectureTempo})
                </motion.span>
                <span>너무 빨라요</span>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowActiveCheck(false)} 
              className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              확인
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
