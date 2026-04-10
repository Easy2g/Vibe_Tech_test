import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordExplanationModal } from './SharedUI';

/**
 * 학생 화면: 대형 실시간 자막 창과 피드백 버튼 제공
 */
export default function StudentView({ onWordClick, lastActivity, onTempoChange, lectureTempo, onMisunderstand, liveText, lectureContext }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(Date.now());
  const scrollRef = useRef(null);

  // [수리] 자막 업데이트 시 자동 스크롤 최하단 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveText]);

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
    <div className="flex gap-6 h-full overflow-hidden">
      
      {/* [좌측] 메인 강의 섹션 (자막 + 피드백) */}
      <div className="flex-[7] flex flex-col gap-4 overflow-hidden">
        
        {/* [1] 대형 실시간 자막 창: 화면의 높은 가독성 제공 */}
        <div className="flex-[6] bg-white rounded-3xl border border-slate-100 p-8 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              AI Live Context Subtitles
            </h3>
            <span className="text-[10px] font-bold text-slate-300">Speech-to-Text Active</span>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 scroll-smooth">
            <p className="text-xl md:text-2xl text-slate-700 font-semibold leading-[2.2] break-keep">
              {liveText || "강의가 시작되면 이곳에 교수님의 음성이 실시간 자막으로 변환되어 표시됩니다."}
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

        {/* [2] 하단 피드백 섹션 */}
        <div className="flex-[4] flex flex-col gap-4 min-h-0 overflow-hidden">
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onMisunderstand}
            className="w-full py-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 group transition-all hover:bg-rose-100 shadow-sm"
          >
            <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">🤔</span>
            <div className="text-center">
              <p className="text-xl font-black text-rose-600 tracking-tight">전체적인 맥락이 이해가 안 돼요</p>
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-1">Send immediate signal to teacher</p>
            </div>
          </motion.button>

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
      </div>

      {/* [우측] 강의 맥락 요약 패널 (Summary Box) */}
      <div className="flex-[3] bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl p-8 flex flex-col gap-6 overflow-hidden">
        <div className="flex-shrink-0">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            Lecture Summary
          </h3>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Current Topic</p>
            <p className="text-lg font-black text-slate-800 leading-tight">
              {lectureContext?.summary?.topic || "강의 자료 분석 중..."}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Core Keywords</p>
            <div className="flex flex-wrap gap-2">
              {(lectureContext?.summary?.keywords || ['분석 대기', '데이터 매핑', '맥락 추출']).map((kw, i) => (
                <span key={i} className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 shadow-sm">
                  # {kw}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 bg-indigo-600 rounded-3xl text-white space-y-2 shadow-lg shadow-indigo-100">
            <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">AI Mediation Insight</p>
            <p className="text-[11px] font-medium leading-relaxed">
              현재 주제는 앞서 배운 '데이터 통계' 개념과 연계됩니다. 용어가 어려울 경우 텍스트의 파란 버튼을 클릭해 보세요.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">🤖</div>
          <div>
            <p className="text-[10px] font-black text-slate-800">Context Assistant</p>
            <p className="text-[9px] font-bold text-slate-400 italic">Connected & Syncing...</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedWord && (
          <WordExplanationModal 
            word={selectedWord} 
            lectureContext={lectureContext} 
            onClose={() => setSelectedWord(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
