import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 교수 대시보드: 스크롤 없이 한 화면에 모든 정보를 3:2 비율로 배치합니다.
 */
export default function TeacherDashboard({ wordClicks, lectureTempo }) {
  
  // 데이터 분석 기반 AI 가이드 생성
  const aiInsights = useMemo(() => {
    const list = [];
    Object.entries(wordClicks).forEach(([word, count]) => {
      if (count >= 10) list.push({ type: 'warning', title: `이해도 부족: ${word}`, desc: '많은 학생이 클릭했습니다. 쉬운 비유로 설명해 주세요.' });
    });
    if (lectureTempo >= 75) list.push({ type: 'danger', title: '강의 속도 빠름', desc: '학생들이 진도를 따라가기 힘들어합니다. 속도를 늦춰주세요.' });
    else if (lectureTempo <= 25) list.push({ type: 'info', title: '강의 속도 느림', desc: '학생들이 지루해할 수 있습니다. 조금 더 빠르게 진행해 보세요.' });
    return list;
  }, [wordClicks, lectureTempo]);

  const sortedWords = Object.entries(wordClicks).sort((a, b) => b[1] - a[1]);
  const maxClicks = Math.max(...Object.values(wordClicks), 1);

  return (
    // h-full과 overflow-hidden을 사용하여 스크롤을 방지합니다.
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      
      {/* 상단 요약 바 (고정 높이) */}
      <div className="grid grid-cols-3 gap-4 h-20 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">전체 도움 요청</span>
          <span className="text-xl font-bold text-slate-800">{Object.values(wordClicks).reduce((a, b) => a + b, 0)}회</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">최다 질문 단어</span>
          <span className="text-xl font-bold text-indigo-600 truncate">{sortedWords[0][0]}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">강의 속도 지수</span>
          <span className={`text-xl font-bold ${lectureTempo > 70 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {lectureTempo > 70 ? '빠름' : lectureTempo < 30 ? '느림' : '적당'}
          </span>
        </div>
      </div>

      {/* 메인 데이터 영역 (남은 공간 모두 차지) */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* 왼쪽: 키워드 히트맵 및 템포 가이드 (3:2 비율 중 3) */}
        <div className="flex-[3] flex flex-col gap-4 min-w-0">
          {/* 히트맵 섹션 */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
              실시간 키워드 히트맵
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {sortedWords.map(([word, count], i) => (
                <div key={word} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>{i + 1}. {word}</span>
                    <span>{count}회</span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxClicks) * 100}%` }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 템포 가이드 섹션 (작은 고정 영역) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 h-24 flex-shrink-0">
            <h3 className="text-sm font-bold text-slate-800 mb-2">실시간 강의 속도</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 bg-slate-50 rounded-full relative">
                <motion.div 
                  animate={{ left: `${lectureTempo}%` }}
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full shadow-md"
                />
              </div>
              <span className="text-sm font-bold text-indigo-600">{lectureTempo}%</span>
            </div>
          </div>
        </div>

        {/* 오른쪽: AI 가이드 패널 (3:2 비율 중 2) */}
        <div className="flex-[2] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <span className="text-indigo-400">✦</span> AI 중재 가이드
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            <AnimatePresence mode="popLayout">
              {aiInsights.length === 0 ? (
                <p className="text-slate-500 text-xs italic text-center mt-10">충분한 데이터가 쌓이기를 기다리고 있습니다.</p>
              ) : (
                aiInsights.map((ins) => (
                  <motion.div 
                    key={ins.title}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-xl border-l-4 ${
                      ins.type === 'danger' ? 'bg-rose-500/10 border-rose-500' : 
                      ins.type === 'warning' ? 'bg-amber-500/10 border-amber-500' : 'bg-indigo-500/10 border-indigo-500'
                    }`}
                  >
                    <h4 className={`text-xs font-bold mb-1 ${ins.type === 'danger' ? 'text-rose-400' : ins.type === 'warning' ? 'text-amber-400' : 'text-indigo-400'}`}>{ins.title}</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">{ins.desc}</p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
