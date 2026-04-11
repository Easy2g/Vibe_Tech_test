import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// 파일 읽기 일꾼 설정
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate, studentCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [analyzedSummary, setAnalyzedSummary] = useState(null);
  
  const [aiInsights, setAiInsights] = useState([]);
  const transcriptBuffer = useRef(""); 

  const misunderstandingRatio = studentCount > 0 ? Math.round((misunderstandingCount / studentCount) * 100) : 0;

  // [프로덕션] 실제 교수 음성용 STT 엔진
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
          transcriptBuffer.current += " " + text;
          
          // [실시간 데이터 고속도로] 자막 즉시 방송
          localStorage.setItem('vibe_live_transcript', JSON.stringify({ 
            text, 
            timestamp: Date.now(),
            isFinal: true 
          }));
        }
      }
      if (currentText.trim()) onLiveTextUpdate(currentText);
    };
    
    recognition.onerror = (event) => {
      console.error("STT Error:", event.error);
      if (event.error === 'network') alert("네트워크 연결을 확인하세요.");
    };

    recognition.onend = () => { 
      if (isStarted) {
        try { recognition.start(); } catch(e) {}
      } 
    };
    
    recognition.start();
    return () => { 
      recognition.onend = null; 
      recognition.onerror = null;
      recognition.stop(); 
    };
  }, [isStarted, onLiveTextUpdate]);

  // 실시간 AI 조언 생성
  useEffect(() => {
    if (!isStarted) return;
    const requestInsight = async () => {
      const currentTranscript = transcriptBuffer.current.trim();
      if (!currentTranscript && misunderstandingCount === 0) return;
      
      try {
        const response = await fetch("/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: currentTranscript.substring(currentTranscript.length - 1500),
            wordClicks, 
            misunderstandingCount, 
            studentCount,
            topic: analyzedSummary?.topic
          })
        });
        if (response.ok) {
          const insight = await response.json();
          setAiInsights(prev => [insight, ...prev].slice(0, 3));
          localStorage.setItem('vibe_bridge_live_insight', JSON.stringify(insight));
          transcriptBuffer.current = currentTranscript.substring(currentTranscript.length - 200);
        }
      } catch (err) {}
    };
    const interval = setInterval(requestInsight, 30000); 
    return () => clearInterval(interval);
  }, [isStarted, wordClicks, misunderstandingCount, studentCount, analyzedSummary]);

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

  /**
   * [Gemini 3.1 Flash-Lite 단독 체제]
   * 최신 초고속 엔진을 사용하여 전 학문 분야의 강의 자료를 정밀 분석합니다.
   */
  const callAnalyzeAPI = async (textContent) => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("🚨 [Vibe Bridge] API 키를 찾을 수 없습니다.");
      alert("AI 설정을 위한 API 키가 등록되지 않았습니다.");
      return null;
    }

    // [범용 교육 조력자 프롬프트] 인문, 사회, 자연과학, 예술, 공학 전 분야 대응
    const universalPrompt = `당신은 전 학문 분야의 강의 자료를 정교하게 구조화하는 범용 교육 조력자 AI입니다. 
    제공된 강의 자료를 정밀 분석하여 학생들을 위한 구조적 요약본을 생성하세요. 
    - 자료에서 다루는 '핵심 개념의 정의'를 명확히 파악하세요.
    - 개념들 사이의 '논리적 인과관계'와 이를 뒷받침하는 '학술적 근거'를 추출하세요.
    - 반드시 다음 JSON 형식으로만 응답하세요: 
    { "topic": "강의의 핵심 주제", "keyPoints": ["핵심개념1", "핵심개념2", "학술적근거1", "학술적근거2"], "summary": "개념 정의와 논리적 인과관계가 포함된 구조적 3줄 요약" }`;

    try {
      // [안정적인 단일 엔드포인트 고정] gemini-3.1-flash-lite-preview 모델 전용
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${API_KEY}`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${universalPrompt}\n\n분석할 내용:\n${textContent.substring(0, 12000)}` }] }]
        })
      });

      if (!response.ok) throw new Error("API 호출 실패");

      const data = await response.json();
      const aiResultText = data.candidates[0].content.parts[0].text;
      const cleanJson = aiResultText.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
      
    } catch (err) {
      console.error("AI Analysis Failed:", err);
      alert("분석 서버와 연결할 수 없습니다. 네트워크 상태를 확인하세요.");
      return null;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setAnalysisProgress(10);
    
    try {
      let textContent = file.type === "application/pdf" ? await extractTextFromPDF(await file.arrayBuffer()) : await file.text();
      setAnalysisProgress(60);
      
      const summary = await callAnalyzeAPI(textContent);
      
      if (!summary) {
        setIsUploading(false);
        return;
      }
      
      // [데이터 실시간 동기화] vibe_lecture_data 키를 사용하여 학생 대시보드와 공유
      localStorage.setItem('vibe_lecture_data', JSON.stringify({
        topic: summary.topic,
        keyPoints: summary.keyPoints,
        summary: summary.summary
      }));
      
      setAnalyzedSummary(summary);
      setAnalysisProgress(100);
      setIsUploading(false);
      setIsAnalyzed(true);
    } catch (err) {
      alert("문서 읽기 오류: " + err.message);
      setIsUploading(false);
    }
  };

  const handleStartLecture = () => {
    if (!analyzedSummary) return;
    onStart({ 
      topic: analyzedSummary.topic, 
      keyPoints: analyzedSummary.keyPoints, 
      summary: analyzedSummary.summary 
    });
  };

  if (!isStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center overflow-hidden shadow-sm">
        <AnimatePresence mode="wait">
          {!isUploading && !isAnalyzed ? (
            <motion.div key="upload" className="max-w-md space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-3xl">📊</div>
              <h2 className="text-2xl font-bold text-slate-800">강의 자료 스마트 분석</h2>
              <p className="text-slate-500 text-sm">자료를 올리면 AI가 즉시 핵심 맥락을 추출하여 배포합니다.</p>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 shadow-lg transition-all active:scale-[0.98]">
                자료 선택 및 분석 시작
                <input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileChange} />
              </label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" className="max-w-md w-full space-y-8">
              <h2 className="text-xl font-bold text-slate-800">AI가 문맥을 파악하고 있습니다...</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" /></div>
            </motion.div>
          ) : (
            <motion.div key="complete" className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✨</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">분석 및 동기화 완료</h2>
                <p className="text-sm text-slate-500 font-bold">주제: {analyzedSummary?.topic}</p>
              </div>
              <button onClick={handleStartLecture} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all">실시간 세션 시작하기</button>
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
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Listening</span><span className="text-xs font-black text-emerald-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> STT Live</span></div>
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audience</span><span className="text-xs font-black text-slate-700">{studentCount}명 참여 중</span></div>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-bold uppercase tracking-tighter">AI Real-time Monitoring Active</div>
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
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">학생 이해도 현황</h3>
          <div className="text-5xl font-black text-slate-800 mb-2">{misunderstandingRatio}%</div>
          <div className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter">도움 필요 지표: {misunderstandingCount}건</div>
        </section>
        <section className="flex-[4] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 tracking-[0.2em] relative z-10">AI Smart Insight (Live)</h3>
          <div className="flex-1 overflow-y-auto space-y-4 relative z-10">
            <AnimatePresence mode="popLayout">
              {aiInsights.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-10">
                  <span className="text-3xl mb-4">🧠</span>
                  <p className="text-[10px] font-medium tracking-tight uppercase">교수님 음성과 피드백을 기반으로<br/>AI가 실시간 분석 중입니다.</p>
                </div>
              ) : (
                aiInsights.map((ins, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`p-5 rounded-2xl border-l-4 bg-white/5 ${ins.type === 'danger' ? 'border-rose-500' : 'border-indigo-500'}`}>
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
