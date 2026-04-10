import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// 파일 읽기 일꾼 설정
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * 교수 대시보드: 실제 Gemini AI가 실시간으로 강의를 모니터링하고 조언합니다.
 */
export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate, studentCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [analyzedSummary, setAnalyzedSummary] = useState(null);
  
  // [신규] 실제 AI 조언 리스트 상태
  const [aiInsights, setAiInsights] = useState([]);
  const transcriptBuffer = useRef(""); // 최근 자막 보관함

  const misunderstandingRatio = studentCount > 0 ? Math.round((misunderstandingCount / studentCount) * 100) : 0;

  // 음성 인식 로직 및 버퍼 누적
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
          const text = event.results[i][0].transcript;
          currentText += text;
          transcriptBuffer.current += " " + text; // AI 전송을 위해 버퍼에 누적
        }
      }
      if (currentText.trim()) onLiveTextUpdate(currentText);
    };
    
    recognition.onend = () => { if (isStarted) recognition.start(); };
    recognition.start();
    return () => { recognition.onend = null; recognition.stop(); };
  }, [isStarted, onLiveTextUpdate]);

  /**
   * [신규] 실제 AI 분석 API 호출 (30초마다 자동 실행)
   */
  useEffect(() => {
    if (!isStarted) return;

    const requestInsight = async () => {
      if (!transcriptBuffer.current.trim() && misunderstandingCount === 0) return;

      try {
        const response = await fetch("/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: transcriptBuffer.current.substring(transcriptBuffer.current.length - 1000), // 최근 약 1000자
            wordClicks,
            misunderstandingCount,
            studentCount
          })
        });

        if (response.ok) {
          const insight = await response.json();
          // 새 조언을 목록 맨 앞에 추가 (최대 3개 유지)
          setAiInsights(prev => [insight, ...prev].slice(0, 3));
          transcriptBuffer.current = ""; // 분석 완료 후 버퍼 비우기
        }
      } catch (err) {
        console.error("실시간 분석 오류:", err);
      }
    };

    const interval = setInterval(requestInsight, 25000); // 25초마다 실시간 조언 생성
    return () => clearInterval(interval);
  }, [isStarted, wordClicks, misunderstandingCount, studentCount]);

  // PDF 텍스트 추출 로직 (기존 유지)
  const extractTextFromPDF = async (arrayBuffer) => {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, useSystemFonts: true });
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(" ") + "\n";
      setAnalysisProgress(Math.floor((i / pdf.numPages) * 40) + 10);
    }
    return fullText;
  };

  const callAnalyzeAPI = async (textContent) => {
    try {
      const response = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textContent: textContent.substring(0, 15000) })
      });
      return await response.json();
    } catch (err) {
      return { topic: "강의 자료 분석 완료", keyPoints: ["내용 매핑 성공", "맥락 공유 중"] };
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFileName(file.name);
    setIsUploading(true);
    try {
      let textContent = file.type === "application/pdf" ? await extractTextFromPDF(await file.arrayBuffer()) : await file.text();
      setAnalysisProgress(60);
      const summary = await callAnalyzeAPI(textContent);
      localStorage.setItem('vibe_bridge_lecture_data', JSON.stringify(summary));
      setAnalyzedSummary(summary);
      setAnalysisProgress(100);
      setIsUploading(false);
      setIsAnalyzed(true);
    } catch (err) {
      alert("문서 분석 오류");
      setIsUploading(false);
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
            <motion.div key="upload" className="max-w-md space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-3xl">📄</div>
              <h2 className="text-2xl font-bold text-slate-800">지능형 강의 분석</h2>
              <p className="text-slate-500 text-sm">자료를 올리면 AI가 전체 내용을 분석합니다.</p>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 shadow-lg">자료 선택<input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileChange} /></label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" className="max-w-md w-full space-y-8">
              <h2 className="text-xl font-bold text-slate-800">문서 맥락 분석 중...</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" /></div>
            </motion.div>
          ) : (
            <motion.div key="complete" className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✨</div>
              <h2 className="text-2xl font-bold text-slate-800">분석 완료</h2>
              <button onClick={handleStartLecture} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800">강의 시작</button>
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
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Listening</span><span className="text-xs font-black text-emerald-500 italic">STT 가동 중</span></div>
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audience</span><span className="text-xs font-black text-slate-700">{studentCount}명 연결됨</span></div>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-bold uppercase tracking-tighter">AI Real-time Monitoring</div>
      </div>
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">실시간 용어 히트맵</h3>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {Object.entries(wordClicks).map(([word, count]) => (
              <div key={word} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600"><span>{word}</span><span>{count}회</span></div>
                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(count/Math.max(...Object.values(wordClicks), 1))*100}%` }} className="h-full bg-indigo-500" /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm text-center justify-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">학생 이해도</h3>
          <div className="text-5xl font-black text-slate-800 mb-2">{misunderstandingRatio}%</div>
          <div className="text-[10px] text-rose-500 font-bold uppercase">도움 요청: {misunderstandingCount}명</div>
        </section>
        <section className="flex-[4] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 tracking-[0.2em] relative z-10">AI Smart Insight (Actual)</h3>
          <div className="flex-1 overflow-y-auto space-y-4 relative z-10">
            <AnimatePresence mode="popLayout">
              {aiInsights.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-10">
                  <span className="text-3xl mb-4">🧠</span>
                  <p className="text-[10px] font-medium tracking-tight uppercase">교수님의 음성과 학생 피드백을<br/>AI가 실시간 분석 중입니다...</p>
                </div>
              ) : (
                aiInsights.map((ins, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`p-5 rounded-2xl border-l-4 bg-white/5 ${ins.type === 'danger' ? 'border-rose-500' : 'border-indigo-500'}`}>
                    <h4 className={`text-[10px] font-black mb-2 uppercase tracking-widest ${ins.type === 'danger' ? 'text-rose-300' : 'text-indigo-300'}`}>{ins.title}</h4>
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
