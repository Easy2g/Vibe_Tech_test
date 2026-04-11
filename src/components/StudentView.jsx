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

  // 실시간 동기화 상태
  const [localSummary, setLocalSummary] = useState(null); // 자료 요약본
  const [liveInsight, setLiveInsight] = useState(null); // AI 실시간 조언

  useEffect(() => {
    const syncAllData = () => {
      // 1. 프로덕션 데이터 포맷 로드
      const savedSummary = localStorage.getItem('vibe_lecture_data');
      if (savedSummary) {
        try {
          const parsed = JSON.parse(savedSummary);
          setLocalSummary(parsed);
        } catch (e) {
          console.error("Summary Sync Error:", e);
        }
      }

      // 2. 실시간 AI 조언 로드
      const savedInsight = localStorage.getItem('vibe_bridge_live_insight');
      if (savedInsight) {
        try { setLiveInsight(JSON.parse(savedInsight)); } catch (e) {}
      }
    };

    syncAllData();

    // 데이터 고속도로 감지
    const handleStorage = (e) => {
      if (e.key === 'vibe_lecture_data' || e.key === 'vibe_bridge_live_insight') {
        syncAllData();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [liveText]);

  // [방어 코드] 강의 정보가 아예 없으면 로딩 화면 표시
  if (!lectureContext && !localSummary) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 shadow-sm p-12 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <span className="text-3xl">📡</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">강의 데이터를 연결 중입니다</h2>
        <p className="text-slate-500 font-medium">교수님이 세션을 시작하시면 자동으로 화면이 전환됩니다.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full overflow-hidden bg-slate-50">
      
      {/* [좌측] 자막 및 피드백 */}
      <div className="flex-[7] flex flex-col gap-4 overflow-hidden">
        <div className="flex-[6] bg-white rounded-3xl border border-slate-100 p-8 shadow-sm overflow-hidden flex flex-col relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              Live Broadcast Subtitles
            </h3>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 scroll-smooth relative z-10">
            <div className="flex flex-wrap gap-x-2 gap-y-3 items-baseline py-4">
              {liveText ? (
                String(liveText).split(' ').map((word, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.1, color: '#4f46e5' }}
                    onClick={() => {
                      const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
                      onWordClick(cleanWord);
                      setSelectedWord(cleanWord);
                    }}
                    className="text-xl md:text-2xl text-slate-700 font-bold leading-none break-keep transition-colors"
                  >
                    {word}
                  </motion.button>
                ))
              ) : (
                <p className="text-xl text-slate-400 font-medium italic">
                  강의가 시작되면 교수님의 음성이 실시간으로 자막 처리됩니다.
                </p>
              )}
            </div>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onMisunderstand} className="flex-[4] bg-rose-50 border border-rose-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 group shadow-sm">
          <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">🤔</span>
          <div className="text-center">
            <p className="text-xl font-black text-rose-600 tracking-tight">설명이 너무 어려워요</p>
            <p className="text-[10px] text-rose-400 font-bold uppercase mt-1 tracking-tighter">익명으로 교수님께 신호를 보냅니다</p>
          </div>
        </motion.button>
      </div>

      {/* [우측] AI 강의 요약 패널 */}
      <div className="flex-[3] bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl p-8 flex flex-col gap-6 overflow-hidden relative">
        <div className="flex-shrink-0">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Lecture Summary</h3>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Today's Topic</p>
            <p className="text-lg font-black text-slate-800 leading-tight">
              {(localSummary || lectureContext)?.topic || "데이터를 수신 중입니다..."}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Core Keywords</p>
            <div className="flex flex-col gap-2">
              {(localSummary || lectureContext)?.keyPoints?.length > 0 ? (
                (localSummary || lectureContext).keyPoints.map((kp, i) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="p-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 shadow-sm">
                    # {kp}
                  </motion.div>
                ))
              ) : (
                <div className="py-10 text-center opacity-30"><p className="text-xs italic font-medium">Waiting for data...</p></div>
              )}
            </div>
          </div>
          
          {/* 요약본 표시 */}
          {(localSummary || lectureContext)?.summary && (
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-800 text-[11px] leading-relaxed font-medium">
              {(localSummary || lectureContext).summary}
            </div>
          )}

          <AnimatePresence mode="wait">
            {liveInsight && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={liveInsight.desc} className="p-5 bg-slate-900 rounded-3xl text-white shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">🤖</span>
                  <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">AI Live Assistant</p>
                </div>
                <p className="text-[11px] font-bold leading-relaxed text-slate-200">{liveInsight.desc}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs">✨</div>
          <div>
            <p className="text-[10px] font-black text-slate-800">Connection Status</p>
            <p className="text-[9px] font-bold text-emerald-500 italic">Secure & Live</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedWord && <WordExplanationModal word={selectedWord} lectureContext={{ topic: (localSummary || lectureContext)?.topic }} onClose={() => setSelectedWord(null)} />}
      </AnimatePresence>
    </div>
  );
}
