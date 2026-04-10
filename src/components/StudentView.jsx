import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordExplanationModal } from './SharedUI';

/**
 * 학생 화면: 강의 자막과 속도 피드백 버튼을 제공합니다.
 */
export default function StudentView({ onWordClick, lastActivity, onTempoChange, lectureTempo }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(Date.now());

  // 15초간 무반응이거나 시작 30초 후 피드백 버튼을 노출합니다.
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
    <div className="flex flex-col gap-6">
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

      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-indigo-100 p-6 shadow-lg text-center"
          >
            <p className="font-bold text-slate-800 mb-4">강의 속도가 적당한가요?</p>
            <div className="flex gap-2">
              <button onClick={() => { onTempoChange(20); setShowFeedback(false); }} className="flex-1 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-100 transition-colors">너무 느려요</button>
              <button onClick={() => { onTempoChange(50); setShowFeedback(false); }} className="flex-1 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-100 transition-colors">딱 좋아요</button>
              <button onClick={() => { onTempoChange(80); setShowFeedback(false); }} className="flex-1 py-3 bg-rose-50 text-rose-600 font-bold rounded-xl text-sm hover:bg-rose-100 transition-colors">조금 빨라요</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedWord && <WordExplanationModal word={selectedWord} onClose={() => setSelectedWord(null)} />}
      </AnimatePresence>
    </div>
  );
}
