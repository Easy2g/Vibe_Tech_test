import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordExplanationModal } from './SharedUI';

/**
 * 학생 화면: 실시간 자막과 지능형 요약 패널을 안전하게 렌더링합니다.
 */
export default function StudentView({ onWordClick, lastActivity, onTempoChange, lectureTempo, onMisunderstand, liveText, lectureContext }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(Date.now());
  const scrollRef = useRef(null);

  // 로컬 요약 정보 관리 (초기값 null)
  const [localSummary, setLocalSummary] = useState(null);

  useEffect(() => {
    // 1. 초기 로드 시 가상 서버 데이터 확인
    const syncData = () => {
      const savedData = localStorage.getItem('vibe_bridge_lecture_data');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // 데이터 구조 표준화 (topic, keyPoints 보장)
          setLocalSummary({
            topic: parsed.topic || parsed.title || "강의 주제 분석 완료",
            keyPoints: parsed.keyPoints || parsed.summary?.keyPoints || []
          });
        } catch (e) {
          console.error("데이터 동기화 실패");
        }
      }
    };

    syncData();

    // 2. 실시간 동기화 감지
    const handleStorage = (e) => {
      if (e.key === 'vibe_bridge_lecture_data') syncData();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 자막 자동 스크롤
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
              Live Broadcast Subtitles
            </h3>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 scroll-smooth">
            <p className="text-xl md:text-2xl text-slate-700 font-bold leading-[2.2] break-keep">
              {liveText || "강의가 시작되면 교수님의 음성이 이곳에 자막으로 나타납니다."}
              <span className="inline-flex gap-2 ml-4">
                {['인공지능', '머신러닝', '데이터'].map(word => (
                  <button key={word} onClick={() => { onWordClick(word); setSelectedWord(word); }} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold border border-indigo-100">
                    {word}
                  </button>
                ))}
              </span>
            </p>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onMisunderstand} className="flex-[4] bg-rose-50 border border-rose-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-3">
          <span className="text-4xl">🤔</span>
          <div className="text-center">
            <p className="text-xl font-black text-rose-600">설명이 너무 어려워요</p>
            <p className="text-[10px] text-rose-400 font-bold uppercase mt-1 tracking-tighter">교수님께 익명 신호를 보냅니다</p>
          </div>
        </motion.button>
      </div>

      {/* [우측] 요약 패널 - 수리 완료 */}
      <div className="flex-[3] bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl p-8 flex flex-col gap-6 overflow-hidden">
        <div className="flex-shrink-0">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Lecture Summary</h3>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Current Topic</p>
            <p className="text-lg font-black text-slate-800 leading-tight">
              {localSummary ? localSummary.topic : "교수님이 강의를 준비 중입니다."}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Core Keywords</p>
            <div className="flex flex-wrap gap-2">
              {localSummary && localSummary.keyPoints ? (
                localSummary.keyPoints.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 shadow-sm"># {kw}</span>
                ))
              ) : (
                <span className="text-xs text-slate-300 italic">분석 데이터 대기 중...</span>
              )}
            </div>
          </div>
          <div className="p-5 bg-indigo-600 rounded-3xl text-white shadow-lg">
            <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">AI Assistant</p>
            <p className="text-[11px] font-medium leading-relaxed">모르는 단어가 나오면 자막 위의 파란색 버튼을 눌러보세요.</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedWord && <WordExplanationModal word={selectedWord} lectureContext={{ summary: localSummary }} onClose={() => setSelectedWord(null)} />}
      </AnimatePresence>
    </div>
  );
}
