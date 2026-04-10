import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordExplanationModal } from './SharedUI';

/**
 * 학생 화면: 실시간 자막과 함께 교수님이 공유한 강의 요약본을 보여줍니다.
 */
export default function StudentView({ onWordClick, lastActivity, onTempoChange, lectureTempo, onMisunderstand, liveText, lectureContext }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(Date.now());
  const scrollRef = useRef(null);

  // [수리] 로컬 상태로 요약 정보 관리 (초기값: 교수님 대기 중)
  const [localSummary, setLocalSummary] = useState(null);

  // [수리] 데이터 수신 및 실시간 감지 로직
  useEffect(() => {
    // 1. 페이지 처음 로드 시 기존에 저장된 강의 자료가 있는지 확인
    const savedData = localStorage.getItem('vibe_bridge_lecture_data');
    if (savedData) {
      try {
        setLocalSummary(JSON.parse(savedData));
      } catch (e) {
        console.error("강의 자료를 읽어오지 못했습니다.");
      }
    }

    // 2. 교수님이 다른 탭에서 자료를 업데이트(저장)하면 즉시 감지하여 화면 갱신
    const handleStorageUpdate = (e) => {
      if (e.key === 'vibe_bridge_lecture_data') {
        if (e.newValue) {
          setLocalSummary(JSON.parse(e.newValue));
        } else {
          setLocalSummary(null); // 자료가 삭제된 경우
        }
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  // 자막 창 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [liveText]);

  // 무반응 감지 로직 (기존 동일)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      if ((now - lastActivity) / 1000 > 15 || (now - startTime) / 1000 > 30) setShowFeedback(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [lastActivity, startTime]);

  return (
    <div className="flex gap-6 h-full overflow-hidden">
      
      {/* [좌측] 메인 강의 섹션 (자막 + 피드백) */}
      <div className="flex-[7] flex flex-col gap-4 overflow-hidden">
        <div className="flex-[6] bg-white rounded-3xl border border-slate-100 p-8 shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              AI 실시간 자막 방송
            </h3>
            <span className="text-[10px] font-bold text-slate-300">STT 연결됨</span>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 scroll-smooth">
            <p className="text-xl md:text-2xl text-slate-700 font-semibold leading-[2.2] break-keep">
              {liveText || "교수님의 목소리가 이곳에 자막으로 나타납니다."}
              <span className="inline-flex gap-2 ml-4">
                {['인공지능', '머신러닝', '딥러닝'].map(word => (
                  <button key={word} onClick={() => { onWordClick(word); setSelectedWord(word); }} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold border border-indigo-100 hover:bg-indigo-500 hover:text-white transition-all shadow-sm">
                    {word}
                  </button>
                ))}
              </span>
            </p>
          </div>
        </div>

        {/* 하단 피드백 버튼 (기존 동일) */}
        <div className="flex-[4] flex flex-col gap-4 min-h-0 overflow-hidden">
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onMisunderstand} className="w-full py-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 transition-all hover:bg-rose-100">
            <span className="text-4xl">🤔</span>
            <div className="text-center">
              <p className="text-xl font-black text-rose-600">이해가 안 돼요</p>
              <p className="text-[10px] text-rose-400 font-bold uppercase mt-1">교수님께 익명으로 신호를 보냅니다</p>
            </div>
          </motion.button>
          <AnimatePresence>
            {showFeedback && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl text-center text-white">
                <p className="font-bold text-sm mb-4">현재 설명 속도가 적당한가요?</p>
                <div className="flex gap-2">
                  <button onClick={() => { onTempoChange(20); setShowFeedback(false); }} className="flex-1 py-3 bg-white/10 rounded-xl text-xs font-black">느려요</button>
                  <button onClick={() => { onTempoChange(50); setShowFeedback(false); }} className="flex-1 py-3 bg-indigo-600 rounded-xl text-xs font-black">좋아요</button>
                  <button onClick={() => { onTempoChange(80); setShowFeedback(false); }} className="flex-1 py-3 bg-white/10 rounded-xl text-xs font-black">빨라요</button>
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
            강의 요약 정보
          </h3>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">오늘의 주제</p>
            <p className="text-lg font-black text-slate-800 leading-tight">
              {/* [수리] 데이터 유무에 따른 조건부 렌더링 */}
              {localSummary ? localSummary.topic : "교수님이 강의를 준비 중입니다."}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">핵심 키워드</p>
            <div className="flex flex-wrap gap-2">
              {localSummary ? localSummary.keyPoints.map((kw, i) => (
                <span key={i} className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 shadow-sm">
                  # {kw}
                </span>
              )) : (
                <span className="text-xs text-slate-300 italic">분석 중...</span>
              )}
            </div>
          </div>

          <div className="p-5 bg-indigo-600 rounded-3xl text-white space-y-2 shadow-lg shadow-indigo-100">
            <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">AI 맞춤 가이드</p>
            <p className="text-[11px] font-medium leading-relaxed">
              모르는 단어가 나오면 자막의 버튼을 눌러보세요. 현재 주제에 맞는 상세 설명을 제공합니다.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">🤖</div>
          <div>
            <p className="text-[10px] font-black text-slate-800">Context Assistant</p>
            <p className="text-[9px] font-bold text-slate-400 italic">실시간 맥락 동기화 중...</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedWord && <WordExplanationModal word={selectedWord} lectureContext={{ summary: localSummary }} onClose={() => setSelectedWord(null)} />}
      </AnimatePresence>
    </div>
  );
}
