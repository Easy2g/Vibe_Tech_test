import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// pdf.js 워커 설정
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate, studentCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [analyzedSummary, setAnalyzedSummary] = useState(null);

  const misunderstandingRatio = studentCount > 0 ? Math.round((misunderstandingCount / studentCount) * 100) : 0;

  // STT 로직
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
   * [수리] PDF 모든 페이지 추출 (장수 제한 제거)
   */
  const extractTextFromPDF = async (arrayBuffer) => {
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        stopAtErrors: false
      });
      
      const pdf = await loadingTask.promise;
      let fullText = "";
      
      // [변경] 모든 페이지를 순회합니다.
      const totalPages = pdf.numPages;
      
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
        
        // 추출 진행률 업데이트 시각화
        setAnalysisProgress(Math.floor((i / totalPages) * 40) + 10);
      }

      if (!fullText.trim()) {
        throw new Error("PDF에서 읽을 수 있는 텍스트를 찾지 못했습니다. (텍스트 레이어가 없는 이미지형 PDF일 수 있습니다)");
      }

      return fullText;
    } catch (err) {
      console.error("PDF 처리 상세 에러:", err);
      throw new Error(`PDF 분석 실패: ${err.message}`);
    }
  };

  /**
   * [수리] AI 분석 서버 호출 (데이터 용량 상향)
   */
  const callAnalyzeAPI = async (textContent) => {
    try {
      // 분석 범위를 15,000자로 대폭 상향하여 더 많은 정보를 분석하게 함
      const trimmedText = textContent.substring(0, 15000); 
      
      const response = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textContent: trimmedText })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "서버 응답 실패");
      }
      
      return await response.json();
    } catch (err) {
      throw new Error(`AI 분석 서버 오류: ${err.message}`);
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

      setAnalysisProgress(60); // 추출 완료 후 분석 시작 지점
      const summary = await callAnalyzeAPI(textContent);
      
      setAnalyzedSummary(summary);
      setAnalysisProgress(100);
      setIsUploading(false);
      setIsAnalyzed(true);

    } catch (err) {
      alert(`[파일 처리 오류]\n${err.message}`);
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
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-3xl">📄</div>
              <h2 className="text-2xl font-bold text-slate-800">전체 강의 자료 분석</h2>
              <p className="text-slate-500 text-sm">PDF 모든 페이지를 분석하여 요약본을 만듭니다.<br/>(대용량 문서 지원)</p>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all shadow-lg">
                파일 선택하여 시작
                <input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileChange} />
              </label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full space-y-8">
              <h2 className="text-xl font-bold text-slate-800">문서 {analysisProgress < 60 ? "텍스트를 추출" : "맥락을 분석"}하고 있습니다...</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" />
              </div>
              <p className="text-xs text-slate-400 font-medium">{analysisProgress}% 진행 중</p>
            </motion.div>
          ) : (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }} className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✨</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">분석 완료</h2>
                <p className="text-sm text-slate-500 font-black">"{analyzedSummary?.topic}"</p>
              </div>
              <button onClick={handleStartLecture} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all">
                분석 데이터 배포 및 강의 시작
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
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-black">전체 문서 분석 모드</div>
      </div>
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">핵심 키워드 히트맵</h3>
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
          <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 tracking-[0.2em]">AI Smart Insights</h3>
          <div className="flex-1 overflow-y-auto space-y-4">
            {misunderstandingCount >= 1 ? (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-5 rounded-2xl bg-white/5 border-l-4 border-rose-500">
                <h4 className="text-[10px] font-black mb-2 text-rose-300 uppercase">보충 설명 가이드</h4>
                <p className="text-[11px] leading-relaxed text-slate-300 font-medium">분석된 주제를 학생들이 어려워하고 있습니다. 전체적인 흐름을 다시 한 번 짚어주세요.</p>
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
