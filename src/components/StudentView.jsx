import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordExplanationModal } from './SharedUI';

/**
 * 학생 화면: 강의 자막과 속도 피드백, 그리고 전체적인 맥락 피드백 버튼을 제공합니다.
 */
export default function StudentView({ onWordClick, lastActivity, onTempoChange, lectureTempo, onMisunderstand }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      if ((now - lastActivity) / 1000 > 15 || (now - startTime) / 1000 > 30) {
        setShowFeedback(true);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [lastActivity, startTime]);

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
    <div className="flex flex-col gap-6 h-full pb-4">
      {/* 강의 자막 영역 */}
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
          실시간 강의 자막
        </h3>
        <div className="text-lg leading-relaxed text-slate-700">
          {scriptText.map((part, index) => (
            part.type === 'keyword' ? (
              <button 
                key={index} 
                onClick={() => { onWordClick(part.content); setSelectedWord(part.content); }}
                className="mx-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-500 hover:text-white transition-colors"
              >
                {part.content}
              </button>
            ) : <span key={index}>{part.content}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-6">
        {/* [Step 3 신규] 맥락 미이해 피드백 버튼: 크고 명확하게 배치 */}
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onMisunderstand}
          className="w-full py-10 bg-rose-50 border-2 border-rose-100 rounded-3xl flex flex-col items-center justify-center gap-2 group transition-all hover:bg-rose-100 hover:border-rose-200"
        >
          <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">🤔</span>
          <div className="text-center">
            <p className="text-xl font-black text-rose-600 tracking-tight">전체적인 맥락이 이해가 안 돼요</p>
            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-1">Click to send direct signal to teacher</p>
          </div>
        </motion.button>

        {/* 기존 속도 피드백 영역 */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-indigo-100 p-6 shadow-lg text-center">
              <p className="font-bold text-slate-800 mb-4 text-sm">현재 강의 속도가 적당한가요?</p>
              <div className="flex gap-2">
                <button onClick={() => { onTempoChange(20); setShowFeedback(false); }} className="flex-1 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl text-xs">너무 느려요</button>
                <button onClick={() => { onTempoChange(50); setShowFeedback(false); }} className="flex-1 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-xs">딱 좋아요</button>
                <button onClick={() => { onTempoChange(80); setShowFeedback(false); }} className="flex-1 py-3 bg-rose-50 text-rose-600 font-bold rounded-xl text-xs">조금 빨라요</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedWord && <WordExplanationModal word={selectedWord} onClose={() => setSelectedWord(null)} />}
      </AnimatePresence>
    </div>
  );
}
