import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * 교수 대시보드: 실제 Gemini AI를 사용하여 강의 자료를 분석합니다.
 */
export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate, studentCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [analyzedSummary, setAnalyzedSummary] = useState(null);

  // [수리] 실시간 접속자 및 미이해 비율 계산
  const misunderstandingRatio = studentCount > 0 ? Math.round((misunderstandingCount / studentCount) * 100) : 0;

  // [STT 수리] 음성 인식 로직 (기존 유지)
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

  /**
   * [신규] 실제 Gemini API를 사용하여 텍스트 분석
   */
  const analyzeWithGemini = async (textContent) => {
    try {
      // API 키 설정 (나중에 .env 파일에 VITE_GEMINI_API_KEY 이름으로 저장하세요)
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
      
      if (API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        console.warn("Gemini API 키가 설정되지 않았습니다. 시뮬레이션 모드로 작동합니다.");
        return {
          topic: "인공지능의 미래 (샘플)",
          keyPoints: ["데이터의 중요성", "모델 최적화", "윤리적 문제"]
        };
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        다음 강의 자료 텍스트를 분석해서 학생들에게 보여줄 요약본을 만들어줘.
        반드시 JSON 형식으로만 응답해줘. 
        형식: { "topic": "주제 문자열", "keyPoints": ["핵심내용1", "핵심내용2", "핵심내용3", "핵심내용4"] }
        
        자료 내용:
        ${textContent.substring(0, 5000)} // 최대 5000자 분석
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSON 응답 추출 (AI가 마크다운 기호를 붙일 수 있으므로 제거)
      const cleanJson = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);

    } catch (error) {
      console.error("Gemini 분석 중 오류 발생:", error);
      throw error;
    }
  };

  /**
   * [신규] 파일 읽기 및 분석 프로세스 시작
   */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadFileName(file.name);
    setIsUploading(true);
    setAnalysisProgress(10);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      setAnalysisProgress(40);

      try {
        // 실제 AI 분석 호출
        const summary = await analyzeWithGemini(content);
        setAnalysisProgress(90);
        setAnalyzedSummary(summary);
        setAnalysisProgress(100);
        setIsUploading(false);
        setIsAnalyzed(true);
      } catch (err) {
        alert("AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        setIsUploading(false);
      }
    };

    // 텍스트 파일로 읽기 (PDF의 경우 추후 별도 라이브러리 필요)
    reader.readAsText(file);
  };

  const handleStartLecture = () => {
    if (!analyzedSummary) return;

    // 가상 서버(localStorage)에 실제 분석된 데이터 배포
    localStorage.setItem('vibe_bridge_lecture_data', JSON.stringify(analyzedSummary));
    
    // 강의 시작 상태 전환
    onStart({ 
      title: analyzedSummary.topic, 
      summary: analyzedSummary 
    });
  };

  if (!isStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center overflow-hidden">
        <AnimatePresence mode="wait">
          {!isUploading && !isAnalyzed ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-3xl">🤖</div>
              <h2 className="text-2xl font-bold text-slate-800">실제 AI 강의 분석</h2>
              <p className="text-slate-500 text-sm">자료(텍스트/MD)를 올리면 Gemini가 실시간으로 분석합니다.</p>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all shadow-lg">
                자료 선택하여 분석하기
                <input type="file" className="hidden" accept=".txt,.md,.json" onChange={handleFileChange} />
              </label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full space-y-8">
              <h2 className="text-xl font-bold text-slate-800">Gemini AI가 맥락을 파악 중입니다...</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" />
              </div>
              <p className="text-xs text-slate-400 font-medium">문서의 핵심 키워드를 추출하고 있습니다 ({analysisProgress}%)</p>
            </motion.div>
          ) : (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }} className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">분석 완료</h2>
                <p className="text-sm text-slate-500 font-medium">"{analyzedSummary?.topic}" 주제를 찾았습니다.</p>
              </div>
              <button onClick={handleStartLecture} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all">
                분석 데이터 공유 및 강의 시작
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 강의 진행 중 대시보드 UI (기존 동일)
  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-8">
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Listening</span><span className="text-xs font-black text-emerald-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> STT 활성</span></div>
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audience</span><span className="text-xs font-black text-slate-700">{studentCount}명 연결됨</span></div>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-black">AI 맥락 분석 가동 중</div>
      </div>
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">실시간 용어 히트맵</h3>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {Object.entries(wordClicks).map(([word, count]) => (
              <div key={word} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600"><span>{word}</span><span>{count}회</span></div>
                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(count/Math.max(...Object.values(wordClicks), 1))*100}%` }} className="h-full bg-indigo-500" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm text-center justify-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">학생 이해도</h3>
          <div className="text-5xl font-black text-slate-800 mb-2">{misunderstandingRatio}%</div>
          <div className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter">도움이 필요한 학생: {misunderstandingCount}명</div>
        </section>
        <section className="flex-[4] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 tracking-[0.2em] relative z-10">AI Smart Insight</h3>
          <div className="flex-1 overflow-y-auto space-y-4 relative z-10">
            {misunderstandingCount >= 3 ? (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-5 rounded-2xl bg-white/5 border-l-4 border-rose-500">
                <h4 className="text-[10px] font-black mb-2 text-rose-300 uppercase italic">맥락 이탈 감지</h4>
                <p className="text-[11px] leading-relaxed text-slate-300">현재 학생들의 이해도가 급격히 떨어졌습니다. 방금 하신 설명을 더 쉬운 예시로 1분간 보충해 보세요.</p>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-10">
                <span className="text-3xl mb-4">✨</span>
                <p className="text-[10px] font-medium tracking-tight uppercase">Data Syncing...</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
