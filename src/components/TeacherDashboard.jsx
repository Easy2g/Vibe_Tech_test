import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 교수 모니터링 시스템 (Teacher Dashboard)
// ==========================================
export default function TeacherDashboard({ wordClicks, lectureTempo }) {
  // [시계열 버퍼] 최근 1분간의 총 클릭수를 5초마다 기록하는 큐(Queue)
  const [timeline, setTimeline] = useState(Array(12).fill(0)); // 12칸 * 5초 = 60초
  const totalClicks = Object.values(wordClicks).reduce((sum, count) => sum + count, 0);

  // 타임라인 샘플링 로직 (5초 주기 샘플 & 홀드)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeline(prev => {
        const newTimeline = [...prev.slice(1), totalClicks]; // FIFO Shift
        return newTimeline;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [totalClicks]);

  // AI 중재 가이드 로직 생성 (조건부 트리거)
  const aiInsights = useMemo(() => {
    const insights = [];
    Object.entries(wordClicks).forEach(([word, count]) => {
      if (count >= 10) {
        insights.push({
          type: 'warning',
          title: `집중 보충 필요: ${word}`,
          desc: `학생들이 이 개념을 매우 어려워합니다. 비유를 섞어 1분간 보충 설명 후 넘어가세요.`
        });
      }
    });

    if (lectureTempo > 70) {
      insights.push({
        type: 'danger', title: '강의 속도 위험', desc: '학생 다수가 내용이 너무 빠르다고 느낍니다. 즉시 속도를 늦추세요.'
      });
    } else if (lectureTempo < 30) {
      insights.push({
        type: 'info', title: '강의 템포 여유', desc: '설명이 느린 편입니다. 핵심 위주로 속도를 높여도 좋습니다.'
      });
    }
    return insights;
  }, [wordClicks, lectureTempo]);

  // 정렬 및 스케일링 연산
  const sortedWords = Object.entries(wordClicks).sort((a, b) => b[1] - a[1]);
  const maxClicks = Math.max(...Object.values(wordClicks), 1);
  const maxTimeline = Math.max(...timeline, totalClicks, 1); // 스케일 하한선 1 보장

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 뷰포트 1: 메인 히트맵 및 지표 */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-800">실시간 키워드 히트맵</h3>
            <span className="flex items-center gap-2 text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full animate-pulse uppercase tracking-widest">Live Sync</span>
          </div>
          
          <div className="space-y-6">
            <AnimatePresence>
              {sortedWords.map(([word, count], i) => (
                <motion.div 
                  key={word} 
                  layout // 레이아웃 순서 변경 시 부드럽게 재배치 (Sorting Animation)
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-700">{i+1}. {word}</span>
                    <motion.span 
                      key={count} 
                      initial={{ scale: 1.5, color: '#f43f5e' }} 
                      animate={{ scale: 1, color: '#94a3b8' }} 
                      className="text-slate-400"
                    >
                      {count}회 도움 요청
                    </motion.span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden relative">
                    {/* 데이터 인가 시 스프링 물리 모델을 통해 그래프가 튕기는 듯한 제어 응답을 보여줍니다. */}
                    <motion.div 
                      className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600" 
                      initial={{ width: 0 }}
                      animate={{ width: `${(count/maxClicks)*100}%` }}
                      transition={{ type: "spring", bounce: 0.5, damping: 12, stiffness: 100 }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 뷰포트 2: 시계열 타임라인 그래프 (최근 1분) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">단어 클릭 타임라인 (최근 1분)</h3>
            <span className="text-xs font-bold text-slate-400">Total: {totalClicks}</span>
          </div>
          <div className="h-24 flex items-end gap-2">
            {timeline.map((val, idx) => {
              const heightPct = Math.max((val / maxTimeline) * 100, 5); // 최소 5% 높이 유지
              return (
                <div key={idx} className="flex-1 bg-slate-50 rounded-t-md relative flex items-end justify-center group">
                  <motion.div 
                    layout
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ type: "spring", bounce: 0.2 }}
                    className="w-full bg-indigo-200 rounded-t-md hover:bg-indigo-400 transition-colors"
                  />
                  {/* Tooltip */}
                  <span className="absolute -top-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
            <span>60초 전</span>
            <span>현재</span>
          </div>
        </div>

        {/* 뷰포트 3: 강의 템포 가이드 그래프 */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6">강의 템포 가이드 (실시간 피드백)</h3>
          <div className="flex items-center gap-6">
            <div className="flex-1 h-20 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden flex items-center px-8">
              {/* 속도 포인터 (실시간 이동) - Spring 물리 모델 적용 */}
              <motion.div 
                className="absolute top-0 bottom-0 w-1 bg-indigo-500 shadow-lg shadow-indigo-500/50 z-10" 
                animate={{ left: `${lectureTempo}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white"></div>
              </motion.div>
              <div className="w-full flex justify-between text-[10px] font-bold text-slate-300">
                <span>느림 (LO)</span>
                <span>적당함 (MID)</span>
                <span>빠름 (HI)</span>
              </div>
            </div>
            <div className="text-center w-24">
              <p className="text-xs font-bold text-slate-400 uppercase">현재 지수</p>
              <motion.p 
                key={lectureTempo}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className={`text-3xl font-black ${lectureTempo > 70 ? 'text-rose-600' : 'text-indigo-600'}`}
              >
                {lectureTempo}
              </motion.p>
            </div>
          </div>
        </div>
      </div>

      {/* 뷰포트 4: AI 중재 가이드 패널 */}
      <div className="space-y-6">
        <div className="bg-slate-900 rounded-3xl shadow-2xl p-8 text-white min-h-[400px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="text-indigo-400">✦</span> AI 중재 가이드
          </h3>
          
          <div className="space-y-4">
            <AnimatePresence>
              {aiInsights.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-40 flex flex-col items-center justify-center text-slate-500 text-sm italic"
                >
                  <p>현재 강의가 원활하게 진행 중입니다.</p>
                  <p>데이터 분석을 대기하고 있습니다.</p>
                </motion.div>
              ) : (
                aiInsights.map((ins, i) => (
                  <motion.div 
                    key={ins.title}
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.1 }}
                    className={`p-5 rounded-2xl border-l-4 ${
                      ins.type === 'danger' ? 'bg-rose-500/10 border-rose-500' : 
                      ins.type === 'warning' ? 'bg-amber-500/10 border-amber-500' : 'bg-indigo-500/10 border-indigo-500'
                    }`}
                  >
                    <h4 className={`text-sm font-bold mb-2 ${
                      ins.type === 'danger' ? 'text-rose-400' : 
                      ins.type === 'warning' ? 'text-amber-400' : 'text-indigo-400'
                    }`}>{ins.title}</h4>
                    <p className="text-xs leading-relaxed text-slate-300 font-medium">{ins.desc}</p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Smart Suggestions</p>
            <div className="space-y-2">
              <div className="bg-white/5 p-3 rounded-xl text-xs text-slate-400">💡 3분 뒤 '이해도 체크'를 실행할까요?</div>
              <div className="bg-white/5 p-3 rounded-xl text-xs text-slate-400">💡 '머신러닝'과 '데이터'의 관계를 다시 짚어주세요.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
