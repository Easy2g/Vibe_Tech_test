import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 교수 대시보드: 실시간 음성 분석 및 고도화된 AI 중재 가이드 제공
 */
export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  const totalStudents = 20; 
  const misunderstandingRatio = Math.round((misunderstandingCount / totalStudents) * 100);

  // [Step 5] Web Speech API를 활용한 실시간 음성 인식 및 데이터 전달
  useEffect(() => {
    if (!isStarted || !('webkitSpeechRecognition' in window)) return;

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';

    recognition.onresult = (event) => {
      let currentText = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentText += event.results[i][0].transcript;
        }
      }
      if (currentText) onLiveTextUpdate(currentText);
    };

    recognition.start();
    return () => recognition.stop();
  }, [isStarted, onLiveTextUpdate]);

  // [Step 5] 고도화된 AI 맥락 분석: 학생 피드백과 실시간 음성을 종합 분석
  const aiInsights = useMemo(() => {
    const list = [];
    
    // 맥락 이해도가 떨어졌을 때 구체적인 대응 전략 조언
    if (misunderstandingCount >= 5) {
      list.push({ 
        type: 'danger', 
        title: '맥락 괴리(Context Gap) 경고', 
        desc: `방금 하신 설명이 사전에 업로드된 자료의 범위를 벗어나거나 논리적 비약이 심해 학생의 ${misunderstandingRatio}%가 혼란스러워합니다. 구체적인 예시나 자료 3페이지 내용을 다시 인용해 주세요.` 
      });
    }

    const mostClickedWord = Object.entries(wordClicks).sort((a, b) => b[1] - a[1])[0];
    if (mostClickedWord && mostClickedWord[1] >= 8) {
      list.push({ 
        type: 'warning', 
        title: `용어 미숙지 지점 발견: ${mostClickedWord[0]}`, 
        desc: `'${mostClickedWord[0]}' 개념에 대한 클릭이 집중되고 있습니다. 학생들이 해당 단어의 정의를 강의 맥락 내에서 이해하지 못하고 있으니, 용어 사전에 기반해 1분간 보충해 주세요.` 
      });
    }
    
    return list;
  }, [wordClicks, misunderstandingCount, misunderstandingRatio]);

  const sortedWords = Object.entries(wordClicks).sort((a, b) => b[1] - a[1]);
  const maxClicks = Math.max(...Object.values(wordClicks), 1);

  // 파일 업로드 시뮬레이션
  const startAnalysis = (fileName) => {
    setUploadFileName(fileName);
    setIsUploading(true);
    setAnalysisProgress(0);
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setIsUploading(false); setIsAnalyzed(true); return 100; }
        return prev + 5;
      });
    }, 100);
  };

  if (!isStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center overflow-hidden">
        <AnimatePresence mode="wait">
          {!isUploading && !isAnalyzed ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-3xl">📄</div>
              <h2 className="text-2xl font-bold text-slate-800">강의 컨텍스트 업로드</h2>
              <p className="text-slate-500 text-sm">자료를 기반으로 AI가 음성을 실시간 분석합니다.</p>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all">
                파일 선택 (PDF/Text)
                <input type="file" className="hidden" onChange={(e) => startAnalysis(e.target.files[0]?.name)} />
              </label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full space-y-8">
              <h2 className="text-xl font-bold text-slate-800">AI 맥락 분석 및 모델 매핑 중...</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }} className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
              <h2 className="text-2xl font-bold text-slate-800">분석 완료</h2>
              <button onClick={() => onStart({ title: 'AI 실시간 분석 강의' })} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl">음성 인식 및 강의 시작</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      
      {/* 고정형 헤더 바 */}
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white rounded-2xl border border-slate-100">
        <div className="flex gap-8">
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Listening Status</span><span className="text-xs font-black text-emerald-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> AI 분석 중...</span></div>
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Audience</span><span className="text-xs font-black text-slate-700">{totalStudents}명 연결됨</span></div>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-black">Speed {lectureTempo}%</div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        
        {/* 패널 1: 히트맵 */}
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">Term Bottleneck</h3>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {sortedWords.map(([word, count], i) => (
              <div key={word} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600"><span>{word}</span><span className={count > 5 ? 'text-indigo-600' : 'text-slate-400'}>{count}회</span></div>
                <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(count/maxClicks)*100}%` }} className="h-full bg-indigo-500 rounded-full" /></div>
              </div>
            ))}
          </div>
        </section>

        {/* 패널 2: 미이해 시각화 */}
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">Context Confusion</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-50" />
                <motion.circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={402} animate={{ strokeDashoffset: 402 - (402 * misunderstandingRatio) / 100 }} className="text-rose-500" strokeLinecap="round" />
              </svg>
              <span className="absolute text-4xl font-black text-slate-800">{misunderstandingRatio}%</span>
            </div>
            <div className="w-full bg-rose-50 rounded-2xl p-5 border border-rose-100 text-center">
              <p className="text-[10px] font-bold text-rose-400 uppercase">Lost Students</p>
              <p className="text-2xl font-black text-rose-700">{misunderstandingCount} / {totalStudents}</p>
            </div>
          </div>
        </section>

        {/* 패널 3: AI 중재 가이드 */}
        <section className="flex-[4] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 tracking-[0.2em] relative z-10">AI Smart Mediation</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 relative z-10">
            <AnimatePresence mode="popLayout">
              {aiInsights.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 py-20 text-center">
                  <span className="text-4xl mb-4">🤖</span>
                  <p className="text-[11px] italic font-medium leading-relaxed uppercase tracking-tighter">Real-time Analyzing Speech & Data...</p>
                </div>
              ) : (
                aiInsights.map((ins) => (
                  <motion.div key={ins.title} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-5 rounded-2xl border-l-4 bg-white/5 border-indigo-500 shadow-xl">
                    <h4 className="text-[10px] font-black mb-2 text-indigo-300 uppercase tracking-widest">{ins.title}</h4>
                    <p className="text-[11px] leading-relaxed text-slate-300 font-medium">{ins.desc}</p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  );
}
