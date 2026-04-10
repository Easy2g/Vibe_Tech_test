import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// [수리] 파일 읽기 일꾼(Worker) 설정: Vite 환경에서 가장 안전한 로컬 방식 사용
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * 교수 대시보드: 강의 자료 분석 및 AI 중재 기능 담당
 */
export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate, studentCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [analyzedSummary, setAnalyzedSummary] = useState(null);

  // 학생들의 이해도 계산
  const misunderstandingRatio = studentCount > 0 ? Math.round((misunderstandingCount / studentCount) * 100) : 0;

  // 음성 인식 로직
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
   * [수리] PDF 텍스트 추출 (타임아웃 및 에러 처리 강화)
   */
  const extractTextFromPDF = async (arrayBuffer) => {
    // 30초 타임아웃 설정 (무한 로딩 방지)
    const timeoutId = setTimeout(() => {
      setIsUploading(false);
      alert("파일 읽기 시간이 초과되었습니다.");
    }, 30000);

    try {
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        stopAtErrors: false
      });
      
      const pdf = await loadingTask.promise;
      clearTimeout(timeoutId); // 성공 시 타임아웃 해제

      let fullText = "";
      const totalPages = pdf.numPages;
      
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
        
        // 추출 진행률 표시
        setAnalysisProgress(Math.floor((i / totalPages) * 40) + 10);
      }

      if (!fullText.trim()) throw new Error("문서에서 글자를 읽을 수 없습니다. (이미지 위주의 파일일 수 있습니다)");
      return fullText;

    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  /**
   * [수리] AI 분석 요청 로직 (localStorage 즉시 반영)
   */
  const callAnalyzeAPI = async (textContent) => {
    try {
      const response = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textContent: textContent.substring(0, 15000) })
      });
      
      if (!response.ok) throw new Error("분석 서버가 응답하지 않습니다.");
      const data = await response.json();
      
      // 가상 서버(localStorage)에 즉시 저장하여 학생들과 공유 준비
      localStorage.setItem('vibe_bridge_lecture_data', JSON.stringify(data));
      
      return data;
    } catch (err) {
      throw new Error(`AI 분석 실패: ${err.message}`);
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
        const arrayBuffer = await file.arrayBuffer();
        textContent = await extractTextFromPDF(arrayBuffer);
      } else {
        textContent = await file.text();
      }

      setAnalysisProgress(60);
      const summary = await callAnalyzeAPI(textContent);
      
      setAnalyzedSummary(summary);
      setAnalysisProgress(100);
      setIsUploading(false);
      setIsAnalyzed(true);

    } catch (err) {
      // [수리] 에러 발생 시 상태 초기화 및 안내
      alert(`[오류 알림]\n${err.message}`);
      setIsUploading(false);
      setAnalysisProgress(0);
    }
  };

  const handleStartLecture = () => {
    if (!analyzedSummary) return;
    onStart({ title: analyzedSummary.topic, summary: analyzedSummary });
  };

  if (!isStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center overflow-hidden">
        <AnimatePresence mode="wait">
          {!isUploading && !isAnalyzed ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-3xl">📄</div>
              <h2 className="text-2xl font-bold text-slate-800">전체 강의 자료 분석</h2>
              <p className="text-slate-500 text-sm">PDF/텍스트를 올리면 AI가 전체 내용을 분석합니다.</p>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all shadow-lg">
                자료 선택하기
                <input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileChange} />
              </label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full space-y-8">
              <h2 className="text-xl font-bold text-slate-800">문서 {analysisProgress < 60 ? "글자를 추출" : "맥락을 분석"} 중...</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" />
              </div>
              <p className="text-xs text-slate-400 font-medium">진행률: {analysisProgress}% (잠시만 기다려주세요)</p>
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
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Listening</span><span className="text-xs font-black text-emerald-500">STT 가동 중</span></div>
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audience</span><span className="text-xs font-black text-slate-700">{studentCount}명 접속</span></div>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-black">AI 맥락 분석 모드</div>
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
          <div className="text-[10px] text-rose-500 font-bold uppercase">도움 요청 학생: {misunderstandingCount}명</div>
        </section>
        <section className="flex-[4] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 tracking-[0.2em]">AI Smart Mediation</h3>
          <div className="flex-1 overflow-y-auto space-y-4">
            {misunderstandingCount >= 1 ? (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-5 rounded-2xl bg-white/5 border-l-4 border-rose-500">
                <h4 className="text-[10px] font-black mb-2 text-rose-300 uppercase">학습 정체 구간 감지</h4>
                <p className="text-[11px] leading-relaxed text-slate-300 font-medium">학생들이 분석된 맥락을 따라오지 못하고 있습니다. 이전 페이지의 핵심을 다시 짚어주세요.</p>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-10">
                <span className="text-3xl mb-4">🤖</span>
                <p className="text-[10px] font-medium uppercase tracking-tighter">AI Monitoring Active</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
