import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 교수 대시보드: 강의 자료 업로드 및 실시간 데이터 시각화
 */
export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  const startAnalysis = (fileName) => {
    setUploadFileName(fileName);
    setIsUploading(true);
    setAnalysisProgress(0);
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setIsAnalyzed(true);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const aiInsights = useMemo(() => {
    const list = [];
    
    // [Step 3 신규] 맥락 미이해 수치가 높을 때의 알림
    if (misunderstandingCount >= 5) {
      list.push({ type: 'danger', title: '맥락 이해도 위기', desc: `${misunderstandingCount}명의 학생이 전체 흐름을 놓치고 있습니다. 현재 단원을 잠시 멈추고 요약 설명이 필요합니다.` });
    }

    Object.entries(wordClicks).forEach(([word, count]) => {
      if (count >= 10) list.push({ type: 'warning', title: `용어 미숙지: ${word}`, desc: '학생들이 용어 자체를 어려워합니다. 사전에 정의된 상세 내용을 읽어주세요.' });
    });
    
    if (lectureTempo >= 75) list.push({ type: 'danger', title: '템포 가속화', desc: '속도가 매우 빠릅니다. 학생들의 리듬에 맞춰주세요.' });
    else if (lectureTempo <= 25) list.push({ type: 'info', title: '템포 정체', desc: '조금 더 속도감 있게 진행하셔도 좋습니다.' });
    
    return list;
  }, [wordClicks, lectureTempo, misunderstandingCount]);

  const sortedWords = Object.entries(wordClicks).sort((a, b) => b[1] - a[1]);
  const maxClicks = Math.max(...Object.values(wordClicks), 1);

  if (!isStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center overflow-hidden">
        <AnimatePresence mode="wait">
          {!isUploading && !isAnalyzed ? (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-md space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-3xl">📄</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">강의 자료 업로드</h2>
                <p className="text-slate-500 text-sm leading-relaxed">PDF 파일을 업로드하면 AI가 핵심 맥락을 추출합니다.</p>
              </div>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all">
                파일 선택하기
                <input type="file" className="hidden" onChange={(e) => startAnalysis(e.target.files[0]?.name || '강의자료.pdf')} />
              </label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-md w-full space-y-8">
              <h2 className="text-xl font-bold text-slate-800">AI 정밀 분석 중...</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
              <h2 className="text-2xl font-bold text-slate-800">맥락 분석 완료</h2>
              <button onClick={() => onStart({ title: '인공지능 기초' })} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl">강의 시작하기</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* 상단 요약 바 */}
      <div className="grid grid-cols-4 gap-4 h-20 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">도움 요청</span>
          <span className="text-xl font-bold text-slate-800">{Object.values(wordClicks).reduce((a, b) => a + b, 0)}회</span>
        </div>
        {/* [Step 3 신규] 맥락 미이해 실시간 카운트 표시 */}
        <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">맥락 미이해</span>
          <span className="text-xl font-bold text-rose-600">{misunderstandingCount}명</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">최다 질문</span>
          <span className="text-xl font-bold text-indigo-600 truncate">{sortedWords[0][0]}</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">속도 지수</span>
          <span className={`text-xl font-bold ${lectureTempo > 70 ? 'text-rose-500' : 'text-emerald-500'}`}>{lectureTempo}%</span>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-[3] flex flex-col gap-4 min-w-0">
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0">
            <h3 className="text-sm font-bold text-slate-800 mb-4">실시간 키워드 히트맵</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {sortedWords.map(([word, count], i) => (
                <div key={word} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>{i + 1}. {word}</span>
                    <span>{count}회</span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxClicks) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-[2] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <span className="text-indigo-400">✦</span> AI 중재 가이드
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            <AnimatePresence mode="popLayout">
              {aiInsights.length === 0 ? (
                <p className="text-slate-500 text-xs italic text-center mt-10">실시간 분석 대기 중</p>
              ) : (
                aiInsights.map((ins) => (
                  <motion.div key={ins.title} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className={`p-4 rounded-xl border-l-4 ${ins.type === 'danger' ? 'bg-rose-500/10 border-rose-500' : ins.type === 'warning' ? 'bg-amber-500/10 border-amber-500' : 'bg-indigo-500/10 border-indigo-500'}`}>
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
