import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

// 파일 읽기 일꾼 설정 (PDF 분석용)
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount, onLiveTextUpdate, studentCount, students, liveText, lectureData }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [analyzedSummary, setAnalyzedSummary] = useState(null);
  const [sttStatus, setSttStatus] = useState('idle'); // 마이크 상태 시각화용
  
  const transcriptBuffer = useRef(""); 
  const scrollRef = useRef(null); // 자막 자동 스크롤용
  const recognitionRef = useRef(null);
  const isDestroyedRef = useRef(false);

  // [기획 반영] 학생 이해도 위험도 계산 로직
  const totalStudents = studentCount || 1;
  const totalWordClicks = Object.keys(wordClicks || {}).length;
  const misunderstandingRate = Math.min(Math.round((misunderstandingCount / totalStudents) * 100), 100);

  const getRiskLevel = () => {
    if (misunderstandingRate >= 50 || lectureTempo?.value === "빠름") {
      return { level: "위험", color: "text-rose-400", bg: "bg-rose-500", emoji: "🚨" };
    } else if (misunderstandingRate >= 25 || lectureTempo?.value === "느림") {
      return { level: "주의", color: "text-amber-400", bg: "bg-amber-500", emoji: "⚠️" };
    } else {
      return { level: "양호", color: "text-emerald-400", bg: "bg-emerald-500", emoji: "✅" };
    }
  };
  const risk = getRiskLevel();

  // [수정] wordClicks가 push() 객체 모음일 경우를 대비한 집계 로직
  const sortedKeywords = useMemo(() => {
    const keywordMap = {};
    Object.values(wordClicks || {}).forEach(item => {
      const word = typeof item === 'object' ? item.word : null; 
      if (!word) return;
      keywordMap[word] = (keywordMap[word] || 0) + 1;
    });
    return Object.entries(keywordMap).sort((a, b) => b[1] - a[1]);
  }, [wordClicks]);

  // [AI Smart Insight 고도화 로직]
  const lastInsightTimeRef = useRef(0);
  const [aiInsight, setAiInsight] = useState("");
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  useEffect(() => {
    if (!isStarted) return;

    const clickedWords = [...new Set(Object.values(wordClicks || {}).map((v) => v.word).filter(Boolean))];
    const shouldTrigger = (misunderstandingCount >= 2 || totalWordClicks >= 3 || lectureTempo?.value === "빠름") && 
                        (Date.now() - lastInsightTimeRef.current > 30000);

    if (!shouldTrigger) return;
    lastInsightTimeRef.current = Date.now();

    const fetchInsight = async () => {
      setIsInsightLoading(true);
      const prompt = `당신은 실시간 강의를 보조하는 교육 AI 중재자입니다. 아래 데이터는 지금 이 순간 강의실에서 수집된 학생 반응입니다.
[실시간 강의 데이터]
- 이해 어려움 표시 학생 수: ${misunderstandingCount}명 / 전체 ${totalStudents}명
- 학생들이 모르는 단어로 클릭한 키워드: ${clickedWords.length > 0 ? clickedWords.join(", ") : "없음"}
- 강의 속도에 대한 학생 반응: ${lectureTempo?.value || "응답 없음"}
- 현재 강의 주제: ${lectureData?.topic || "정보 없음"}

[지시사항]
위 데이터를 분석하여 교수자가 지금 당장 취해야 할 수업 전략을 아래 형식으로 한국어 2~3문장으로 제안하세요.
- 현재 상황 진단 1문장
- 즉각적인 행동 제안 1~2문장 (예: "~개념을 다시 설명해 주세요", "잠시 질문 시간을 가지세요")
절대 일반적인 조언을 하지 말고, 위 데이터에 근거한 구체적 제안만 하세요.`;

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "분석 결과를 가져올 수 없습니다.";
        setAiInsight(text);
      } catch (err) {
        setAiInsight("AI 분석 중 오류가 발생했습니다.");
      } finally {
        setIsInsightLoading(false);
      }
    };

    fetchInsight();
  }, [misunderstandingCount, wordClicks, lectureTempo, isStarted, totalStudents, lectureData]);

  // 자막 창 자동 스크롤 로직 (liveText가 변할 때마다 실행)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [liveText]);

  // [무한 루프 실시간 자막 시스템]
  useEffect(() => {
    if (!isStarted) return;
    isDestroyedRef.current = false;

    const startSTT = async () => {
      // 마이크 권한 먼저 명시적으로 요청
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        alert("마이크 권한이 필요합니다. 브라우저 주소창 왼쪽 자물쇠 아이콘에서 마이크를 허용해주세요.");
        console.error("마이크 권한 오류:", err);
        setSttStatus('error');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("이 브라우저는 음성인식을 지원하지 않습니다. Chrome을 사용해주세요.");
        setSttStatus('error');
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "ko-KR";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log("STT 시작됨");
          setSttStatus('listening');
        };

        recognition.onresult = (event) => {
          let finalText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const transcript = event.results[i][0].transcript;
              finalText += transcript;
              transcriptBuffer.current += ' ' + transcript;
            }
          }
          if (finalText.trim()) onLiveTextUpdate(finalText.trim());
        };

        recognition.onerror = (event) => {
          if (event.error === "no-speech" || event.error === "aborted") return;
          console.error("STT 오류:", event.error);
          setSttStatus('error');
          if (event.error === "not-allowed") {
            alert("마이크 접근이 차단되었습니다. 브라우저 설정에서 마이크를 허용해주세요.");
          }
        };

        recognition.onend = () => {
          if (!isDestroyedRef.current) {
            setSttStatus('idle');
            setTimeout(() => {
              if (!isDestroyedRef.current) {
                try {
                  recognition.start();
                } catch (e) {
                  console.warn("STT 재시작 실패:", e);
                }
              }
            }, 300);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("STT 초기화 실패:", err);
        alert("음성인식 초기화에 실패했습니다: " + err.message);
        setSttStatus('error');
      }
    };

    startSTT();

    return () => {
      isDestroyedRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
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
    const totalPages = pdf.numPages; // 페이지 제한 해제 (전체 페이지 대상)

    let sampledFullText = "";
    const imagePages = []; // 텍스트 부족한 페이지는 이미지로 최소 수집

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const pageText = content.items
        .map(item => item.str)
        .filter(str => str.trim().length > 0)
        .join(" ");

      // [스마트 샘플링] 페이지당 앞부분 300자만 추출하여 토큰 절약
      if (pageText.trim().length >= 20) {
        sampledFullText += `[${i}P] ${pageText.substring(0, 300)}...\n\n`;
      } else if (imagePages.length < 2) {
        // 텍스트가 거의 없는 '이미지 슬라이드'는 딱 2장까지만, 저해상도로 수집
        try {
          const viewport = page.getViewport({ scale: 0.6 }); // 해상도 낮춤
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          await page.render({ canvasContext: ctx, viewport }).promise;
          // 품질 0.5로 대폭 압축하여 토큰 소모 최소화
          const base64 = canvas.toDataURL("image/jpeg", 0.5).split(",")[1];
          imagePages.push({ pageNum: i, base64 });
          sampledFullText += `[${i}P: 이미지 슬라이드 분석 필요]\n`;
        } catch (err) {
          console.warn(`[PDF] ${i}페이지 이미지 렌더링 실패:`, err);
        }
      }

      setAnalysisProgress(Math.floor((i / totalPages) * 40) + 10);
    }

    return { fullText: sampledFullText, imagePages };
  };

  const callAnalyzeAPI = async (input) => {
    const { fullText, imagePages } = typeof input === 'string' 
      ? { fullText: input, imagePages: [] } 
      : input;

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) return null;

    // 이미 샘플링된 텍스트이므로 전체를 사용하되 안전하게 최대 15,000자로 제한
    const sampledText = fullText.length > 15000 ? fullText.substring(0, 15000) : fullText;

    const systemPrompt = `당신은 강의 자료를 분석하는 교육 AI입니다.
아래는 강의 자료 각 페이지에서 추출한 핵심 내용 샘플입니다. 전체 맥락을 파악하여 분석하세요.
반드시 다음 JSON 형식으로만 응답하고, 내용에 없는 것은 절대 추가하지 마세요.
{
  "topic": "강의 자료에서 파악한 핵심 주제 (1문장)",
  "keyPoints": ["핵심 개념 1", "핵심 개념 2", "핵심 개념 3", "핵심 개념 4"],
  "summary": "강의 자료 내용 기반 3줄 요약 (내용에 없는 것 추가 금지)"
}`;

    const parts = [
      { text: `${systemPrompt}\n\n[강의 자료 샘플링 텍스트]\n${sampledText}` }
    ];

    // 이미지는 딱 2장만 전송 (토큰 절약 극대화)
    const imagesToSend = imagePages.slice(0, 2);
    for (const { pageNum, base64 } of imagesToSend) {
      parts.push({ text: `\n[${pageNum}P 슬라이드 이미지]` });
      parts.push({ inline_data: { mime_type: "image/jpeg", data: base64 } });
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              maxOutputTokens: 500,
              temperature: 0.1
            }
          })
        });

        if (!response.ok) {
          console.warn(`[PDF 분석] API 오류 ${response.status} (시도 ${attempt}/2)`);
          if (attempt === 2) return null;
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        const data = await response.json();
        const aiResultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        const jsonRegex = /\{[\s\S]*\}/;
        const match = aiResultText.match(jsonRegex);
        if (!match) {
          if (attempt === 2) return null;
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

        const parsed = JSON.parse(match[0].trim());
        if (!parsed.topic || parsed.topic.trim().length < 2) {
          if (attempt === 2) return null;
          continue;
        }

        return parsed;

      } catch (err) {
        if (attempt === 2) return null;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return null;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setAnalysisProgress(10);

    try {
      let extractResult;

      if (file.type === "application/pdf") {
        extractResult = await extractTextFromPDF(await file.arrayBuffer());
      } else {
        // TXT/MD는 텍스트만 있으므로 동일 구조로 래핑
        const text = await file.text();
        extractResult = { fullText: text, imagePages: [] };
      }

      const { fullText, imagePages } = extractResult;

      // 텍스트 + 이미지 모두 없으면 경고
      if (fullText.trim().length < 50 && imagePages.length === 0) {
        alert("강의 자료에서 내용을 읽을 수 없습니다.\n보안 설정된 PDF이거나 완전한 이미지 파일일 수 있습니다.");
        setIsUploading(false);
        return;
      }

      setAnalysisProgress(60);
      const summary = await callAnalyzeAPI({ fullText, imagePages });

      if (summary) {
        setAnalyzedSummary(summary);
        setAnalysisProgress(100);
        setIsAnalyzed(true);
      } else {
        alert("AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error("[파일 분석] 오류:", err);
      alert("자료 분석 중 오류 발생: " + err.message);
    } finally {
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
              <button onClick={handleStartLecture} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all">실시간 강의 세션 열기</button>
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
          <div className="flex flex-col" title="교수님의 음성 인식 시스템 가동 상태를 나타냅니다.">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">마이크 상태</span>
            <div className="flex items-center">
              <span className={`text-xs font-black flex items-center gap-1.5 ${sttStatus === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                <span className={`w-2 h-2 rounded-full ${sttStatus === 'listening' ? 'bg-emerald-500 animate-pulse' : sttStatus === 'error' ? 'bg-rose-500' : 'bg-slate-300'}`}></span>
                {sttStatus === 'listening' ? '실시간 분석 중' : sttStatus === 'error' ? '마이크 오류' : '대기 중'}
              </span>
              {sttStatus === 'error' && (
                <span className="text-[9px] text-rose-400 font-medium ml-2">
                  Chrome + HTTPS 환경에서만 작동합니다
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col" title="학생들이 느끼는 전반적인 강의 속도 피드백입니다.">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">강의 속도</span>
            <span className={`text-xs font-black ${
              (lectureTempo?.value || lectureTempo) === '빠름' ? 'text-rose-500' : 
              (lectureTempo?.value || lectureTempo) === '느림' ? 'text-amber-500' : 'text-indigo-500'
            }`}>
              {(lectureTempo?.value || lectureTempo) || '적당'}
            </span>
          </div>
          <div className="flex flex-col" title="현재 강의 세션에 접속 중인 실시간 학생 수입니다.">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">수강 인원</span>
            <span className="text-xs font-black text-slate-700">{studentCount}명 접속 중</span>
          </div>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-xs font-bold uppercase tracking-tighter">AI 실시간 강의 모니터링 중</div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* 왼쪽: 키워드 히트맵 */}
        <section 
          className="flex-[2.5] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm"
          title="학생들이 자막에서 클릭하여 도움을 요청한 단어들의 빈도수입니다."
        >
          <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest">실시간 집중 키워드</h3>
          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {sortedKeywords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <span className="text-2xl mb-2">🔍</span>
                <p className="text-[9px] font-bold uppercase leading-tight">학생들이 클릭한<br/>단어가 아직 없습니다</p>
              </div>
            ) : (
              sortedKeywords.map(([word, count]) => (
                <div key={word} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>{word}</span>
                    <span className="text-indigo-500">{count}회</span>
                  </div>
                  <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(count / Math.max(...sortedKeywords.map(k => k[1]), 1)) * 100}%` }} 
                      className="h-full bg-indigo-500" 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 가운데: 실시간 자막 피드 */}
        <section 
          className="flex-[4] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm relative overflow-hidden"
          title="교수님의 음성이 실시간으로 텍스트화되어 표시되는 영역입니다."
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-8 -mt-8"></div>
          <h3 className="text-[10px] font-black text-indigo-500 uppercase mb-4 tracking-widest relative z-10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
            실시간 강의 자막
          </h3>
          <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 scroll-smooth relative z-10">
            <p className="text-base font-bold text-slate-700 leading-relaxed break-keep">
              {liveText || <span className="text-slate-300 italic">음성 분석을 대기 중입니다...</span>}
            </p>
          </div>
        </section>

        {/* 오른쪽: 이해도 및 AI 인사이트 */}
        <div className="flex-[3.5] flex flex-col gap-4 min-h-0">
          {/* 학생 이해도 분석 패널 */}
          <section 
            className="bg-slate-900 rounded-3xl border border-white/5 p-6 flex flex-col shrink-0 shadow-xl overflow-hidden relative"
            title="미이해 학생 수와 강의 속도 데이터를 바탕으로 계산된 현재 수업의 위험도입니다."
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">학생 이해도 분석</h3>
              <span className={`text-[10px] px-2.5 py-1 rounded-full ${risk.bg}/20 ${risk.color} font-black border border-white/5 flex items-center gap-1.5`}>
                {risk.emoji} {risk.level}
              </span>
            </div>

            <div className="mb-6 relative z-10">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">현재 수업 이해도</span>
                <span className="text-2xl font-black text-white">{100 - misunderstandingRate}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden p-0.5 border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - misunderstandingRate}%` }}
                  className="h-full rounded-full"
                  style={{
                    background: misunderstandingRate >= 50
                      ? "linear-gradient(90deg, #f43f5e, #fb923c)"
                      : misunderstandingRate >= 25
                      ? "linear-gradient(90deg, #fbbf24, #a3e635)"
                      : "linear-gradient(90deg, #10b981, #06b6d4)"
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 relative z-10">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center" title="이해하기 어렵다고 신호를 보낸 학생 수">
                <p className="text-rose-400 font-black text-lg leading-none mb-1">{misunderstandingCount}</p>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-tighter">미이해</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center" title="현재 학생들이 느끼는 강의 속도">
                <p className={`font-black text-lg leading-none mb-1 ${
                  lectureTempo?.value === "빠름" ? "text-rose-400" :
                  lectureTempo?.value === "느림" ? "text-amber-400" :
                  "text-emerald-400"
                }`}>
                  {lectureTempo?.value || "적당"}
                </p>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-tighter">속도</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center" title="학생들이 자막에서 클릭한 질문 횟수">
                <p className="text-indigo-400 font-black text-lg leading-none mb-1">{totalWordClicks}</p>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-tighter">질문</p>
              </div>
            </div>
          </section>

          {/* AI 스마트 인사이트 패널 */}
          <section 
            className="flex-1 bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl relative overflow-hidden border border-white/5"
            title="강의 내용과 학생 피드백을 실시간 분석하여 제안하는 맞춤형 수업 전략입니다."
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <span className="text-lg">🤖</span>
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">AI 스마트 인사이트</h3>
              {isInsightLoading && (
                <span className="ml-auto text-[9px] text-indigo-300/40 font-black animate-pulse uppercase">분석 중...</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto relative z-10 pr-1">
              <AnimatePresence mode="wait">
                {isInsightLoading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <div className="h-3 bg-white/5 rounded-full animate-pulse w-full" />
                    <div className="h-3 bg-white/5 rounded-full animate-pulse w-4/5" />
                    <div className="h-3 bg-white/5 rounded-full animate-pulse w-3/5" />
                  </motion.div>
                ) : aiInsight ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-inner">
                    <p className="text-[11px] font-bold leading-relaxed text-slate-200 whitespace-pre-line">
                      {aiInsight}
                    </p>
                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">실시간 수업 전략</span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase">
                        {new Date(lastInsightTimeRef.current).toLocaleTimeString("ko-KR", { hour12: false })} 갱신
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-10">
                    <span className="text-3xl mb-4">🧠</span>
                    <p className="text-[10px] font-medium tracking-tight uppercase leading-relaxed">
                      학생 반응 데이터가 쌓이면<br />AI가 실시간 수업 전략을 제안합니다
                    </p>
                    <p className="text-[8px] text-slate-500 font-bold mt-3 uppercase tracking-tighter">
                      (이해 어려움 2명↑ · 질문 3회↑ · 속도 빠름 시 활성화)
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
