import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordExplanationModal } from './SharedUI';

/**
 * 학생 화면: 실시간 분석 요약본과 AI Assistant 가이드를 함께 제공합니다.
 */
export default function StudentView({ onWordClick, lastActivity, onTempoChange, lectureTempo, onMisunderstand, liveText, lectureContext }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(Date.now());
  const scrollRef = useRef(null);

  // [수리] 실시간 동기화 상태들
  const [localSummary, setLocalSummary] = useState(null); // 자료 요약본
  const [liveInsight, setLiveInsight] = useState(null); // AI 실시간 조언

  useEffect(() => {
    const syncAllData = () => {
      // 1. 자료 요약본 로드
      const savedSummary = localStorage.getItem('vibe_bridge_lecture_data');
      if (savedSummary) {
        try {
          const parsed = JSON.parse(savedSummary);
          setLocalSummary({
            topic: parsed.topic || "분석된 주제",
            keyPoints: parsed.keyPoints || []
          });
        } catch (e) {}
      }

      // 2. 최근 AI 조언 로드
      const savedInsight = localStorage.getItem('vibe_bridge_live_insight');
      if (savedInsight) {
        try { setLiveInsight(JSON.parse(savedInsight)); } catch (e) {}
      }
    };

    syncAllData();

    // [수리] 가상 서버 이벤트 감지
    const handleStorage = (e) => {
      if (e.key === 'vibe_bridge_lecture_data' || e.key === 'vibe_bridge_live_insight') {
        syncAllData();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [liveText]);

  return (
    <div className="flex gap-6 h-full overflow-hidden bg-slate-50">
      
      {/* [좌측] 자막 및 피드백 */}
      <div className="flex-[7] flex flex-col gap-4 overflow-hidden">
        <div className="flex-[6] bg-white rounded-3xl border border-slate-100 p-8 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              AI Live Stream
            </h3>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 scroll-smooth">
            <p className="text-xl md:text-2xl text-slate-700 font-bold leading-[2.2] break-keep">
              {liveText || "강의가 시작되면 자막이 표시됩니다."}
              <span className="inline-flex gap-2 ml-4">
                {['인공지능', '머신러닝', '딥러닝'].map(word => (
                  <button key={word} onClick={() => { onWordClick(word); setSelectedWord(word); }} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold border border-indigo-100">
                    {word}
                  </button>
                ))}
              </span>
            </p>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onMisunderstand} className="flex-[4] bg-rose-50 border border-rose-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 group">
          <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">🤔</span>
          <div className="text-center">
            <p className="text-xl font-black text-rose-600">이해가 잘 안 돼요</p>
            <p className="text-[10px] text-rose-400 font-bold uppercase mt-1">도움이 필요하다는 신호를 보냅니다</p>
          </div>
        </motion.button>
      </div>

      {/* [우측] AI 강의 요약 및 실시간 조언 패널 */}
      <div className="flex-[3] bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl p-8 flex flex-col gap-6 overflow-hidden relative">
        <div className="flex-shrink-0">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Current Context</h3>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Today's Topic</p>
            <p className="text-lg font-black text-slate-800 leading-tight">
              {localSummary ? localSummary.topic : "교수님이 자료를 분석 중입니다."}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* 핵심 요약 리스트 */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Key Summary</p>
            <div className="flex flex-col gap-2">
              {localSummary && localSummary.keyPoints.length > 0 ? (
                localSummary.keyPoints.map((kp, i) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="p-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 shadow-sm">
                    {kp}
                  </motion.div>
                ))
              ) : (
                <div className="py-10 text-center opacity-20"><p className="text-xs italic font-medium">No Data Yet</p></div>
              )}
            </div>
          </div>

          {/* [신규] 실시간 AI Assistant 조언 영역 */}
          <AnimatePresence mode="wait">
            {liveInsight && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={liveInsight.desc} className="p-5 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">🤖</span>
                  <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">AI Live Assistant</p>
                </div>
                <p className="text-[11px] font-bold leading-relaxed">{liveInsight.desc}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs">✨</div>
          <div>
            <p className="text-[10px] font-black text-slate-800">Context Assistant</p>
            <p className="text-[9px] font-bold text-slate-400 italic">Actual AI Synced</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedWord && <WordExplanationModal word={selectedWord} lectureContext={{ summary: localSummary }} onClose={() => setSelectedWord(null)} />}
      </AnimatePresence>
    </div>
  );
}
