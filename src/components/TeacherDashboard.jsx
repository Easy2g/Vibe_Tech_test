import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// 파일 읽기 일꾼 설정 (PDF 분석용)
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate, studentCount, liveText }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [analyzedSummary, setAnalyzedSummary] = useState(null);
  const [sttStatus, setSttStatus] = useState('idle'); // 마이크 상태 시각화용
  
  const [aiInsights, setAiInsights] = useState([]);
  const transcriptBuffer = useRef(""); 
  const scrollRef = useRef(null); // 자막 자동 스크롤용

  const misunderstandingRatio = studentCount > 0 ? Math.round((misunderstandingCount / studentCount) * 100) : 0;

  // 자막 창 자동 스크롤 로직 (liveText가 변할 때마다 실행)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveText]);

  // [무한 루프 실시간 자막 시스템]
  useEffect(() => {
    if (!isStarted) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttStatus('error');
      console.error("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.");
      return;
    }

    let recognition = null;
    let isDestroyed = false; // cleanup 후 재시작 방지 플래그

    const startRecognition = () => {
      if (isDestroyed) return;

      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setSttStatus('listening');
      };

      recognition.onresult = (event) => {
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
            transcriptBuffer.current += ' ' + event.results[i][0].transcript;
          }
        }
        if (finalText.trim()) onLiveTextUpdate(finalText.trim());
      };

      recognition.onerror = (event) => {
        // no-speech, aborted는 정상 상황 — 조용히 재시작
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        setSttStatus('error');
        console.warn('STT 오류:', event.error);
      };

      recognition.onend = () => {
        if (isDestroyed) return;
        setSttStatus('idle');
        // 자동 재시작 (무한 루프 STT)
        setTimeout(() => startRecognition(), 300);
      };

      try {
        recognition.start();
      } catch (e) {
        // 이미 실행 중인 경우 무시
        console.warn('STT 시작 오류:', e);
      }
    };

    startRecognition();

    return () => {
      isDestroyed = true;
      if (recognition) {
        recognition.onend = null; // 재시작 방지
        recognition.stop();
      }
    };
  }, [isStarted, onLiveTextUpdate]);

  // [AI 실시간 맥락 최신화] 2분마다 실제 강의 내용을 분석하여 요약본 갱신
  useEffect(() => {
    if (!isStarted) return;

    const refreshContextFromSpeech = async () => {
      const currentSpeech = transcriptBuffer.current.trim();
      if (currentSpeech.length < 300) return; 

      try {
        const newSummary = await callAnalyzeAPI(currentSpeech);
        if (newSummary) {
          // Firebase 연동을 위해 부모로 전달 (향후 구현)
          setAnalyzedSummary(newSummary);
        }
      } catch (err) {}
    };

    const interval = setInterval(refreshContextFromSpeech, 120000);
    return () => clearInterval(interval);
  }, [isStarted]);

  const extractTextFromPDF = async (arrayBuffer) => {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, useSystemFonts: true });
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(" ") + "\n";
      setAnalysisProgress(Math.floor((i / Math.min(pdf.numPages, 20)) * 40) + 10);
    }
    return fullText;
  };

  const callAnalyzeAPI = async (textContent) => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) return null;

    const universalPrompt = `당신은 전 학문 분야의 강의 자료를 정교하게 구조화하는 범용 교육 조력자 AI입니다. 
    반드시 다음 JSON 형식으로만 응답하세요:
    { "topic": "강의 주제", "keyPoints": ["핵심1", "핵심2", "학술적근거1", "학술적근거2"], "summary": "구조적 3줄 요약" }
    [주의] 인사말이나 부연 설명은 절대 하지 말고 오직 { } 데이터만 출력하세요.`;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `${universalPrompt}\n\n내용:\n${textContent.substring(0, 12000)}` }] }] })
      });

      const data = await response.json();
      const aiResultText = data.candidates[0].content.parts[0].text;
      const jsonRegex = /\{[\s\S]*\}/;
      const match = aiResultText.match(jsonRegex);
      if (!match) throw new Error("JSON 추출 실패");
      return JSON.parse(match[0].trim());
    } catch (err) {
      return null;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      let textContent = file.type === "application/pdf" ? await extractTextFromPDF(await file.arrayBuffer()) : await file.text();
      setAnalysisProgress(60);
      const summary = await callAnalyzeAPI(textContent);
      if (summary) {
        setAnalyzedSummary(summary);
        setAnalysisProgress(100);
        setIsAnalyzed(true);
      }
      setIsUploading(false);
    } catch (err) {
      alert("자료 분석 중 오류 발생");
      setIsUploading(false);
    }
  };

  const handleStartLecture = () => {
    if (!analyzedSummary) return;
    onStart({ topic: analyzedSummary.topic, keyPoints: analyzedSummary.keyPoints, summary: analyzedSummary.summary });
  };

  if (!isStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center overflow-hidden shadow-sm">
        <AnimatePresence mode="wait">
          {!isUploading && !isAnalyzed ? (
            <motion.div key="upload" className="max-w-md space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-3xl">📊</div>
              <h2 className="text-2xl font-bold text-slate-800">강의 시스템 준비</h2>
              <p className="text-slate-500 text-sm">강의 자료를 분석하면 실시간 STT 및 AI 중계 기능이 활성화됩니다.</p>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 shadow-lg transition-all active:scale-[0.98]">
                강의 자료 선택 (PDF/TXT)
                <input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileChange} />
              </label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" className="max-w-md w-full space-y-8">
              <h2 className="text-xl font-bold text-slate-800">AI가 강의 맥락을 정밀 분석 중...</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" /></div>
            </motion.div>
          ) : (
            <motion.div key="complete" className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✨</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">분석 및 동기화 완료</h2>
                <p className="text-sm text-slate-500 font-bold">주제: {analyzedSummary?.topic}</p>
              </div>
              <button onClick={handleStartLecture} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all">실시간 강의 세션 열기</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* 상단 상태 바 */}
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mic Status</span>
            <div className="flex items-center">
              <span className={`text-xs font-black flex items-center gap-1.5 ${sttStatus === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                <span className={`w-2 h-2 rounded-full ${sttStatus === 'listening' ? 'bg-emerald-500 animate-pulse' : sttStatus === 'error' ? 'bg-rose-500' : 'bg-slate-300'}`}></span>
                {sttStatus === 'listening' ? 'Live Analyzing' : sttStatus === 'error' ? 'Mic Error' : 'Waiting...'}
              </span>
              {sttStatus === 'error' && (
                <span className="text-[9px] text-rose-400 font-medium ml-2">
                  Chrome + HTTPS 환경에서만 작동합니다
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audience</span><span className="text-xs font-black text-slate-700">{studentCount}명 접속 중</span></div>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-bold uppercase tracking-tighter">AI Lecture Monitoring Active</div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* 왼쪽: 키워드 히트맵 */}
        <section className="flex-[2.5] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">실시간 집중 키워드</h3>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {Object.entries(wordClicks).map(([word, count]) => (
              <div key={word} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600"><span>{word}</span><span>{count}회</span></div>
                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(count/Math.max(...Object.values(wordClicks), 1))*100}%` }} className="h-full bg-indigo-500" /></div>
              </div>
            ))}
          </div>
        </section>

        {/* 가운데: 실시간 자막 피드 (신설) */}
        <section className="flex-[4] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-8 -mt-8"></div>
          <h3 className="text-[10px] font-black text-indigo-500 uppercase mb-4 tracking-widest relative z-10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
            Real-time Subtitle Feed
          </h3>
          <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 scroll-smooth relative z-10">
            <p className="text-base font-bold text-slate-700 leading-relaxed break-keep">
              {liveText || <span className="text-slate-300 italic">음성 분석을 대기 중입니다...</span>}
            </p>
          </div>
        </section>

        {/* 오른쪽: 이해도 및 AI 인사이트 */}
        <div className="flex-[3.5] flex flex-col gap-4 min-h-0">
          <section className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col shrink-0 shadow-sm text-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">학생 이해도</h3>
            <div className="text-4xl font-black text-slate-800 mb-1">{misunderstandingRatio}%</div>
            <div className="text-[9px] text-rose-500 font-bold uppercase tracking-tighter">지원 요청: {misunderstandingCount}건</div>
          </section>

          <section className="flex-1 bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 tracking-[0.2em] relative z-10">AI Smart Insight</h3>
            <div className="flex-1 overflow-y-auto space-y-4 relative z-10 pr-1">
              <AnimatePresence mode="popLayout">
                {aiInsights.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-10">
                    <span className="text-3xl mb-4">🧠</span>
                    <p className="text-[10px] font-medium tracking-tight uppercase">교수님 발언과 학생 반응을 토대로<br/>AI 가이드를 실시간 생성합니다.</p>
                  </div>
                ) : (
                  aiInsights.map((ins, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`p-4 rounded-2xl border-l-4 bg-white/5 ${ins.type === 'danger' ? 'border-rose-500' : 'border-indigo-500'}`}>
                      <h4 className={`text-[9px] font-black mb-1 uppercase tracking-widest ${ins.type === 'danger' ? 'text-rose-300' : 'text-indigo-300'}`}>{ins.title}</h4>
                      <p className="text-[10px] leading-relaxed text-slate-300 font-medium">{ins.desc}</p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
