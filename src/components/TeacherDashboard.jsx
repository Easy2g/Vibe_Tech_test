import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 교수 대시보드: 실시간 음성 분석 및 고도화된 AI 중재 가이드 제공
 */
export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate, studentCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  // [수리] 0으로 나누기 방지 및 정확한 변수 참조
  const misunderstandingRatio = studentCount > 0 
    ? Math.round((misunderstandingCount / studentCount) * 100) 
    : 0;

  // [STT 수리] Web Speech API를 활용한 실시간 음성 인식 및 데이터 전달
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
      if (currentText.trim()) {
        onLiveTextUpdate(currentText);
      }
    };

    recognition.onend = () => {
      if (isStarted) recognition.start();
    };

    recognition.start();
    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [isStarted, onLiveTextUpdate]);

  const aiInsights = useMemo(() => {
    const list = [];
    if (misunderstandingCount >= 5) {
      list.push({ 
        type: 'danger', 
        title: '맥락 괴리(Context Gap) 경고', 
        desc: `설명의 논리적 비약이 심해 학생의 ${misunderstandingRatio}%가 혼란스러워합니다. 보충 설명이 필요합니다.` 
      });
    }

    const mostClickedWord = Object.entries(wordClicks).sort((a, b) => b[1] - a[1])[0];
    if (mostClickedWord && mostClickedWord[1] >= 8) {
      list.push({ 
        type: 'warning', 
        title: `용어 집중 클릭: ${mostClickedWord[0]}`, 
        desc: `'${mostClickedWord[0]}' 개념에 대한 보충 설명이 1분간 필요합니다.` 
      });
    }
    return list;
  }, [wordClicks, misunderstandingCount, misunderstandingRatio]);

  const sortedWords = Object.entries(wordClicks).sort((a, b) => b[1] - a[1]);
  const maxClicks = Math.max(...Object.values(wordClicks), 1);

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

  // [확인] 강의가 시작되지 않았을 때만 업로드 창 노출
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
              <h2 className="text-xl font-bold text-slate-800">AI 맥락 분석 중... ({analysisProgress}%)</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }} className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
              <h2 className="text-2xl font-bold text-slate-800">분석 완료 ({uploadFileName})</h2>
              <button 
                onClick={() => onStart({ 
                  title: 'AI 실시간 분석 강의',
                  summary: {
                    topic: '인공지능의 기본 원리와 현대적 응용',
                    keywords: ['신경망 구조', '매개변수 최적화', '데이터 전처리', '모델 평가 지표']
                  }
                })} 
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all"
              >
                음성 인식 및 강의 시작
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white rounded-2xl border border-slate-100">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Listening Status</span>
            <span className="text-xs font-black text-emerald-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> AI 분석 중...
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Audience</span>
            <span className="text-xs font-black text-slate-700">{studentCount}명 연결됨</span>
          </div>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-black">Speed {lectureTempo}%</div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">Term Bottleneck</h3>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {sortedWords.map(([word, count]) => (
              <div key={word} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>{word}</span>
                  <span className={count > 5 ? 'text-indigo-600' : 'text-slate-400'}>{count}회</span>
                </div>
                <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(count/maxClicks)*100}%` }} className="h-full bg-indigo-500 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>

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
              <p className="text-2xl font-black text-rose-700">{misunderstandingCount} / {studentCount}</p>
            </div>
          </div>
        </section>

        <section className="flex-[4] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl relative overflow-hidden">
          <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 tracking-[0.2em]">AI Smart Mediation</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            <AnimatePresence mode="popLayout">
              {aiInsights.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 py-20 text-center">
                  <span className="text-4xl mb-4">🤖</span>
                  <p className="text-[11px] italic font-medium leading-relaxed uppercase">Analyzing Speech & Data...</p>
                </div>
              ) : (
                aiInsights.map((ins) => (
                  <motion.div key={ins.title} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-5 rounded-2xl border-l-4 bg-white/5 border-indigo-500">
                    <h4 className="text-[10px] font-black mb-2 text-indigo-300 uppercase">{ins.title}</h4>
                    <p className="text-[11px] leading-relaxed text-slate-300">{ins.desc}</p>
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
