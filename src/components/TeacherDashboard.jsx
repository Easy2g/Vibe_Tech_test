import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 교수 대시보드: 강의 자료를 업로드하고 학생들에게 요약본을 배포합니다.
 */
export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate, studentCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  // 학생들의 미이해 비율 계산
  const misunderstandingRatio = studentCount > 0 
    ? Math.round((misunderstandingCount / studentCount) * 100) 
    : 0;

  // 음성 인식 실시간 방송 로직
  useEffect(() => {
    if (!isStarted || !('webkitSpeechRecognition' in window)) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;     
    recognition.interimResults = true; 
    recognition.lang = 'ko-KR';
    recognition.onresult = (event) => {
      let currentText = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) currentText += event.results[i][0].transcript;
      }
      if (currentText.trim()) onLiveTextUpdate(currentText);
    };
    recognition.onend = () => { if (isStarted) recognition.start(); };
    recognition.start();
    return () => { recognition.onend = null; recognition.stop(); };
  }, [isStarted, onLiveTextUpdate]);

  // AI 분석 가이드 생성
  const aiInsights = useMemo(() => {
    const list = [];
    if (misunderstandingCount >= 5) {
      list.push({ type: 'danger', title: '설명 보충 필요', desc: `학생의 ${misunderstandingRatio}%가 현재 맥락을 어려워합니다.` });
    }
    return list;
  }, [misunderstandingCount, misunderstandingRatio]);

  // [수리] 강의 시작 및 데이터 배포 로직
  const handleStartLecture = () => {
    // 1. 통일된 데이터 구조 생성
    const lectureSummary = {
      topic: '인공지능의 기본 원리와 현대적 응용',
      keyPoints: ['신경망 구조의 이해', '매개변수 최적화 기법', '데이터 전처리 중요성', '모델 성능 평가']
    };

    // 2. 가상 서버(localStorage)에 배포 (문자열 변환 필수)
    localStorage.setItem('vibe_bridge_lecture_data', JSON.stringify(lectureSummary));

    // 3. 앱 상태 반영
    onStart({ title: 'AI 실시간 분석 강의', summary: lectureSummary });
  };

  const startAnalysis = (fileName) => {
    setUploadFileName(fileName);
    setIsUploading(true);
    setAnalysisProgress(0);
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setIsUploading(false); setIsAnalyzed(true); return 100; }
        return prev + 10;
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
              <h2 className="text-2xl font-bold text-slate-800">강의 자료 업로드</h2>
              <p className="text-slate-500 text-sm">업로드된 자료를 AI가 분석하여 요약본을 생성합니다.</p>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all">
                파일 선택 (PDF/Text)
                <input type="file" className="hidden" onChange={(e) => startAnalysis(e.target.files[0]?.name)} />
              </label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full space-y-8">
              <h2 className="text-xl font-bold text-slate-800">AI가 자료를 분석하고 있습니다...</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" />
              </div>
            </motion.div>
          ) : (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }} className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
              <h2 className="text-2xl font-bold text-slate-800">분석 완료 ({uploadFileName})</h2>
              <button onClick={handleStartLecture} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all">
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
      {/* 헤더 및 통계 섹션 (기존 동일) */}
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white rounded-2xl border border-slate-100">
        <div className="flex gap-8">
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Listening</span><span className="text-xs font-black text-emerald-500">AI 분석 중...</span></div>
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audience</span><span className="text-xs font-black text-slate-700">{studentCount}명 연결됨</span></div>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-black">속도 {lectureTempo}%</div>
      </div>
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">용어별 클릭수</h3>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {Object.entries(wordClicks).map(([word, count]) => (
              <div key={word} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600"><span>{word}</span><span>{count}회</span></div>
                <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(count/Math.max(...Object.values(wordClicks), 1))*100}%` }} className="h-full bg-indigo-500" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm text-center justify-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">미이해 학생 비율</h3>
          <div className="text-4xl font-black text-slate-800 mb-2">{misunderstandingRatio}%</div>
          <div className="text-[10px] text-rose-500 font-bold uppercase">{misunderstandingCount} / {studentCount} 명</div>
        </section>
        <section className="flex-[4] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl overflow-hidden">
          <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 tracking-[0.2em]">AI 중재 가이드</h3>
          <div className="flex-1 overflow-y-auto space-y-4">
            {aiInsights.map((ins, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/5 border-l-4 border-indigo-500">
                <h4 className="text-[10px] font-black mb-2 text-indigo-300 uppercase">{ins.title}</h4>
                <p className="text-[11px] leading-relaxed text-slate-300">{ins.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
