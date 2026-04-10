import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// pdf.js 워커 설정 (동적 버전 관리)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate, studentCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [analyzedSummary, setAnalyzedSummary] = useState(null);

  const misunderstandingRatio = studentCount > 0 ? Math.round((misunderstandingCount / studentCount) * 100) : 0;

  // STT 로직 (기존 유지)
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

  // [수리] PDF 텍스트 추출 최적화
  const extractTextFromPDF = async (data) => {
    try {
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      let fullText = "";
      // 최대 10페이지만 분석 (크기 제한 방지)
      const maxPages = Math.min(pdf.numPages, 10);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(" ") + "\n";
      }
      return fullText;
    } catch (err) {
      throw new Error("PDF 읽기 실패: 파일이 암호화되어 있거나 손상되었습니다.");
    }
  };

  // [수리] 스마트 API 호출 및 상세 에러 처리
  const callAnalyzeAPI = async (textContent) => {
    try {
      // 본문 크기를 7000자로 제한하여 전송
      const trimmedText = textContent.substring(0, 7000);
      
      const response = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textContent: trimmedText })
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "서버 응답 오류");
      }
      
      return result;
    } catch (err) {
      // 로컬 개발 환경(Vite)에서 서버리스 함수 미작동 시 안내
      if (err.message.includes("Unexpected token") || err.message.includes("404")) {
        throw new Error("서버리스 함수(/analyze)를 찾을 수 없습니다. Cloudflare 배포 환경에서 테스트하거나 API 설정을 확인하세요.");
      }
      throw err;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadFileName(file.name);
    setIsUploading(true);
    setAnalysisProgress(10);

    try {
      let textContent = "";
      if (file.type === "application/pdf") {
        setAnalysisProgress(20);
        const arrayBuffer = await file.arrayBuffer();
        textContent = await extractTextFromPDF(arrayBuffer);
      } else {
        textContent = await file.text();
      }

      setAnalysisProgress(50);
      const summary = await callAnalyzeAPI(textContent);
      
      setAnalyzedSummary(summary);
      setAnalysisProgress(100);
      setIsUploading(false);
      setIsAnalyzed(true);

    } catch (err) {
      alert(`[AI 분석 오류]\n${err.message}`);
      setIsUploading(false);
      setAnalysisProgress(0);
    }
  };

  const handleStartLecture = () => {
    if (!analyzedSummary) return;
    localStorage.setItem('vibe_bridge_lecture_data', JSON.stringify(analyzedSummary));
    onStart({ title: analyzedSummary.topic, summary: analyzedSummary });
  };

  if (!isStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center overflow-hidden">
        <AnimatePresence mode="wait">
          {!isUploading && !isAnalyzed ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-3xl">📂</div>
              <h2 className="text-2xl font-bold text-slate-800">지능형 강의 분석</h2>
              <p className="text-slate-500 text-sm">PDF나 텍스트를 올리면 AI가 요약본을 생성합니다.<br/>(권장: 5MB 이하 파일)</p>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all shadow-lg">
                자료 선택
                <input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileChange} />
              </label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full space-y-8">
              <h2 className="text-xl font-bold text-slate-800">AI가 문서를 정밀 분석 중...</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" />
              </div>
              <p className="text-xs text-slate-400 font-medium">진행률: {analysisProgress}% (서버 응답 대기 중)</p>
            </motion.div>
          ) : (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }} className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✨</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">분석 완료</h2>
                <p className="text-sm text-slate-500 font-black">주제: {analyzedSummary?.topic}</p>
              </div>
              <button onClick={handleStartLecture} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all">
                요약본 배포 및 강의 시작
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-8">
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Listening</span><span className="text-xs font-black text-emerald-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> 실시간 분석 중</span></div>
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audience</span><span className="text-xs font-black text-slate-700">{studentCount}명 접속</span></div>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-black tracking-tight">AI 요약 모드 활성</div>
      </div>
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">용어 히트맵</h3>
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
          <div className="text-[10px] text-rose-500 font-bold">도움 요청: {misunderstandingCount}명</div>
        </section>
        <section className="flex-[4] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 tracking-[0.2em]">AI Smart Mediation</h3>
          <div className="flex-1 overflow-y-auto space-y-4">
            {misunderstandingCount >= 1 ? (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-5 rounded-2xl bg-white/5 border-l-4 border-rose-500">
                <h4 className="text-[10px] font-black mb-2 text-rose-300 uppercase">보충 설명 제안</h4>
                <p className="text-[11px] leading-relaxed text-slate-300 font-medium">현재 분석된 주제와 관련하여 학생들이 어려움을 느끼고 있습니다. 이전 단락의 핵심 키워드를 다시 한 번 짚어주세요.</p>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-10">
                <span className="text-3xl mb-4">🧠</span>
                <p className="text-[10px] font-medium uppercase tracking-tighter">AI Monitoring...</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
