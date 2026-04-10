import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordExplanationModal } from './SharedUI';

/**
 * 학생 화면: 대형 실시간 자막 창과 피드백 버튼 제공
 */
export default function StudentView({ onWordClick, lastActivity, onTempoChange, lectureTempo, onMisunderstand, liveText }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(Date.now());

  // 15초간 무반응 시 속도 조절 팝업 노출
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      if ((now - lastActivity) / 1000 > 15 || (now - startTime) / 1000 > 30) {
        setShowFeedback(true);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [lastActivity, startTime]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      
      {/* [1] 대형 실시간 자막 창: 화면의 약 50%를 차지하며 높은 가독성 제공 */}
      <div className="flex-[5] bg-white rounded-3xl border border-slate-100 p-10 shadow-sm overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            AI Live Context Subtitles
          </h3>
          <span className="text-[10px] font-bold text-slate-300">Speech-to-Text Active</span>
        </div>
        
        {/* 자막 영역: 큰 폰트와 넓은 줄 간격으로 최적화 */}
        <div className="flex-1 overflow-y-auto pr-2">
          <p className="text-xl md:text-2xl text-slate-700 font-semibold leading-[2.2] break-keep">
            {liveText || "강의가 시작되면 이곳에 교수님의 음성이 실시간 자막으로 변환되어 표시됩니다."}
            {/* 키워드 클릭 샘플 (실제로는 STT 텍스트 내 키워드 매칭 로직으로 확장 가능) */}
            <span className="inline-flex gap-2 ml-4">
              {['인공지능', '머신러닝', '딥러닝'].map(word => (
                <button 
                  key={word} 
                  onClick={() => { onWordClick(word); setSelectedWord(word); }}
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold border border-indigo-100 hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                >
                  {word}
                </button>
              ))}
            </span>
          </p>
        </div>
      </div>

      {/* [2] 하단 피드백 섹션: 이해도 신호 및 속도 조절 */}
      <div className="flex-[4] flex flex-col gap-4 min-h-0 overflow-hidden">
        
        {/* '이해가 안 돼요' 대형 버튼: 학생들이 즉각적으로 도움을 요청할 수 있도록 설계 */}
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onMisunderstand}
          className="w-full py-10 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 group transition-all hover:bg-rose-100 shadow-sm"
        >
          <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">🤔</span>
          <div className="text-center">
            <p className="text-xl font-black text-rose-600 tracking-tight">전체적인 맥락이 이해가 안 돼요</p>
            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-1">Send immediate signal to teacher</p>
          </div>
        </motion.button>

        {/* 속도 피드백 (필요 시 노출) */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl text-center text-white"
            >
              <p className="font-bold text-sm mb-4">현재 설명 속도가 따라오기 적당한가요?</p>
              <div className="flex gap-2">
                <button onClick={() => { onTempoChange(20); setShowFeedback(false); }} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-all">느려요</button>
                <button onClick={() => { onTempoChange(50); setShowFeedback(false); }} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-black transition-all">딱 좋아요</button>
                <button onClick={() => { onTempoChange(80); setShowFeedback(false); }} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-all">조금 빨라요</button>
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
