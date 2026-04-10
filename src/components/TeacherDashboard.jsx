import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 교수 대시보드: 강의 자료 업로드 및 실시간 데이터 시각화
 */
export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  // AI 분석 시뮬레이션 로직: 자료 업로드 시 실시간으로 진행률이 오르는 효과를 줍니다.
  const startAnalysis = (fileName) => {
    setUploadFileName(fileName);
    setIsUploading(true);
    setAnalysisProgress(0);
    
    // 3초간의 분석 시뮬레이션
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

  // 강의 시작 전: 업로드 화면 노출
  if (!isStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center overflow-hidden">
        <AnimatePresence mode="wait">
          {!isUploading && !isAnalyzed ? (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-md space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-3xl">📄</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">강의 자료 업로드</h2>
                <p className="text-slate-500 text-sm leading-relaxed">PDF 또는 텍스트 파일을 업로드하면 AI가 핵심 키워드를 분석하여 대시보드를 구성합니다.</p>
              </div>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                파일 선택하기
                <input type="file" className="hidden" onChange={(e) => startAnalysis(e.target.files[0]?.name || '강의자료.pdf')} />
              </label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-md w-full space-y-8">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-800">AI 키워드 분석 중...</h2>
                <p className="text-sm text-slate-400 italic">"{uploadFileName}" 자료를 읽고 있습니다.</p>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-400">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 animate-pulse">주제 추출 중</div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 animate-pulse">용어 사전 생성 중</div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">분석 완료</h2>
                <p className="text-sm text-slate-500 font-medium">강의 주제: <span className="text-indigo-600 underline">인공지능의 기초 및 활용</span></p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {['인공지능', '머신러닝', '알고리즘', '딥러닝'].map(tag => (
                    <span key={tag} className="text-[10px] font-bold bg-indigo-50 text-indigo-500 px-3 py-1 rounded-full border border-indigo-100"># {tag}</span>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => onStart({ title: '인공지능 기초', fileName: uploadFileName })}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                강의 시작하기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 강의 시작 후: 기존 대시보드 노출
  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
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

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-[3] flex flex-col gap-4 min-w-0">
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
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxClicks) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 p-6 h-24 flex-shrink-0">
            <h3 className="text-sm font-bold text-slate-800 mb-2">실시간 강의 속도</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 bg-slate-50 rounded-full relative">
                <motion.div animate={{ left: `${lectureTempo}%` }} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full shadow-md" />
              </div>
              <span className="text-sm font-bold text-indigo-600">{lectureTempo}%</span>
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
                <p className="text-slate-500 text-xs italic text-center mt-10">데이터가 쌓이면 AI 분석이 시작됩니다.</p>
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
