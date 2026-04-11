import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// 파일 읽기 일꾼 설정 (PDF 분석용)
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate, studentCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [analyzedSummary, setAnalyzedSummary] = useState(null);
  const [sttStatus, setSttStatus] = useState('idle'); // 마이크 상태 시각화용
  
  const [aiInsights, setAiInsights] = useState([]);
  const transcriptBuffer = useRef(""); 
  const scrollRef = useRef(null); // 자막 자동 스크롤용

  const misunderstandingRatio = studentCount > 0 ? Math.round((misunderstandingCount / studentCount) * 100) : 0;

  // [탭 간 실시간 통신] 자막 전용 브로드캐스트 채널 (이지훈 회장님 지시 사항 적용)
  const subtitleChannel = useMemo(() => new BroadcastChannel('vibe_subtitle_channel'), []);

  // [무한 루프 실시간 자막 시스템]
  // 브라우저 내장 Web Speech API를 사용하여 서버 없이 가장 빠르고 안정적으로 음성을 인식합니다.
  useEffect(() => {
    if (!isStarted || !('webkitSpeechRecognition' in window)) return;

    // 다른 탭에서 방송된 자막이 있을 경우 내 화면에도 함께 표시
    subtitleChannel.onmessage = (event) => {
      const { text, isFinal } = event.data;
      if (text && isFinal) onLiveTextUpdate(text);
    };

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;    // 대화가 끊겨도 인식을 중단하지 않음
    recognition.interimResults = true; // 사용자가 말하는 도중에도 즉시 텍스트화
    recognition.lang = 'ko-KR';       // 한국어 표준 인식 모드

    recognition.onstart = () => {
      setSttStatus('listening'); // 마이크 표시등 '녹색' 전환
      console.log("🎤 Vibe Bridge 음성 분석 시스템 가동 중...");
    };

    recognition.onresult = (event) => {
      let currentText = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript;
          currentText += text;
          transcriptBuffer.current += " " + text;
          
          // [실시간 공유 1] BroadcastChannel을 통해 다른 모든 탭으로 자막 방송
          subtitleChannel.postMessage({ text, isFinal: true, timestamp: Date.now() });

          // [실시간 공유 2] localStorage에 저장하여 학생 화면 강제 동기화
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
      // 침묵(no-speech)이나 일시적 네트워크 단절 등은 에러 팝업 없이 처리
      if (event.error === 'no-speech') return; 
      
      console.error("음성 인식 일시 에러:", event.error);
      setSttStatus('error'); // 에러 발생 시 표시등 '적색' 전환
      
      // 심각한 에러 시 1.5초 후 자동 부활 로직 가동
      setTimeout(() => {
        if (isStarted) try { recognition.start(); } catch(e) {}
      }, 1500);
    };

    recognition.onend = () => { 
      // 강의가 종료되지 않았다면 엔진이 꺼질 때마다 무조건 다시 실행 (무한 루프)
      if (isStarted) {
        setSttStatus('idle');
        try { recognition.start(); } catch(e) {}
      } 
    };

    recognition.start();

    return () => { 
      recognition.onend = null; 
      recognition.stop(); 
      subtitleChannel.close(); // 컴포넌트 종료 시 통신 채널 안전하게 닫기
    };
  }, [isStarted, onLiveTextUpdate, subtitleChannel]);

  // [AI 실시간 맥락 최신화] 2분마다 실제 강의 내용을 분석하여 요약본 갱신
  useEffect(() => {
    if (!isStarted) return;

    const refreshContextFromSpeech = async () => {
      const currentSpeech = transcriptBuffer.current.trim();
      if (currentSpeech.length < 300) return; 

      try {
        console.log("📝 [Vibe Bridge] 실제 강의 음성을 분석하여 맥락을 최신화합니다.");
        const newSummary = await callAnalyzeAPI(currentSpeech);
        if (newSummary) {
          localStorage.setItem('vibe_lecture_data', JSON.stringify(newSummary));
          setAnalyzedSummary(newSummary);
        }
      } catch (err) {}
    };

    const interval = setInterval(refreshContextFromSpeech, 120000);
    return () => clearInterval(interval);
  }, [isStarted]);

  // 자막 창 자동 스크롤 로직
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [wordClicks]);

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
   * [범용 학술 분석 엔진: Gemini 3.1 Flash-Lite]
   * 모든 전공의 자료를 분석하여 { topic, keyPoints, summary } 구조로 반환합니다.
   */
  const callAnalyzeAPI = async (textContent) => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) return null;

    // [지시문] 전 학문 분야를 아우르는 범용 교육 조력자 프롬프트
    const universalPrompt = `당신은 전 학문 분야의 강의 자료를 정교하게 구조화하는 범용 교육 조력자 AI입니다. 
    제공된 자료에서 핵심 개념 정의, 논리적 인과관계, 주요 사례를 추출하여 반드시 다음 JSON 형식으로만 응답하세요.
    인사말이나 부연 설명은 절대 하지 말고 오직 { } 데이터만 출력하세요.
    
    { "topic": "강의 주제", "keyPoints": ["핵심1", "핵심2", "학술적근거1", "학술적근거2"], "summary": "구조적 3줄 요약" }`;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${API_KEY}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `${universalPrompt}\n\n분석할 내용:\n${textContent.substring(0, 12000)}` }] }] })
      });

      const data = await response.json();
      const aiResultText = data.candidates[0].content.parts[0].text;
      
      // [정규식 기반 순수 데이터 추출] AI의 인사말을 걷어내고 JSON만 안전하게 파싱
      const jsonRegex = /\{[\s\S]*\}/;
      const match = aiResultText.match(jsonRegex);
      if (!match) throw new Error("JSON 추출 실패");
      return JSON.parse(match[0].trim());
    } catch (err) {
      console.error("AI 분석 오류:", err);
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
        localStorage.setItem('vibe_lecture_data', JSON.stringify(summary));
        setAnalyzedSummary(summary);
        setAnalysisProgress(100);
        setIsAnalyzed(true);
      }
      setIsUploading(false);
    } catch (err) {
      alert("자료 분석 중 오류 발생: " + err.message);
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
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mic Status</span>
            <span className={`text-xs font-black flex items-center gap-1.5 ${sttStatus === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
              <span className={`w-2 h-2 rounded-full ${sttStatus === 'listening' ? 'bg-emerald-500 animate-pulse' : sttStatus === 'error' ? 'bg-rose-500' : 'bg-slate-300'}`}></span>
              {sttStatus === 'listening' ? 'Live Analyzing' : sttStatus === 'error' ? 'Mic Error' : 'Waiting...'}
            </span>
          </div>
          <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audience</span><span className="text-xs font-black text-slate-700">{studentCount}명 접속 중</span></div>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-bold uppercase tracking-tighter">AI Lecture Monitoring System Active</div>
      </div>
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">실시간 강의 키워드</h3>
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
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">청강 학생 이해도</h3>
          <div className="text-5xl font-black text-slate-800 mb-2">{misunderstandingRatio}%</div>
          <div className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter">실시간 지원 요청: {misunderstandingCount}건</div>
        </section>
        <section className="flex-[4] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-6 tracking-[0.2em] relative z-10">AI Smart Insight (Live)</h3>
          <div className="flex-1 overflow-y-auto space-y-4 relative z-10">
            <AnimatePresence mode="popLayout">
              {aiInsights.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-10">
                  <span className="text-3xl mb-4">🧠</span>
                  <p className="text-[10px] font-medium tracking-tight uppercase">교수님 발언과 학생 반응을 토대로<br/>AI 가이드를 실시간 생성합니다.</p>
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
