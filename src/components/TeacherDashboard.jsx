import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 교수 대시보드: [단어 히트맵] : [맥락 미이해] : [AI 가이드] = 3:3:4 레이아웃
 * 브라우저 스크롤 없이 한 화면(Single-view)에 모든 정보를 배치합니다.
 */
export default function TeacherDashboard({ wordClicks, lectureTempo, isStarted, onStart, misunderstandingCount }) {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');

  // 시뮬레이션을 위한 가상의 전체 학생 수 및 미이해 비율 계산
  const totalStudents = 20; 
  const misunderstandingRatio = Math.round((misunderstandingCount / totalStudents) * 100);

  // 강의 자료 업로드 시뮬레이션 핸들러
  const startAnalysis = (fileName) => {
    setUploadFileName(fileName);
    setIsUploading(true);
    setAnalysisProgress(0);
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setIsAnalyzed(true);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  // 실시간 데이터를 종합 분석하여 AI 중재 가이드 메시지 생성
  const aiInsights = useMemo(() => {
    const list = [];
    
    // 1. 맥락 이해도 기반 가이드 (심각도: Danger)
    if (misunderstandingCount >= 5) {
      list.push({ 
        type: 'danger', 
        title: '긴급: 강의 맥락 재설정 필요', 
        desc: `현재 참여 학생의 ${misunderstandingRatio}%가 핵심 흐름을 놓치고 있습니다. 전문 용어 나열보다는 실제 서비스 활용 사례를 들어 2분간 브리핑해 주세요.` 
      });
    }

    // 2. 키워드 클릭 빈도 기반 가이드 (심각도: Warning)
    const mostClickedWord = Object.entries(wordClicks).sort((a, b) => b[1] - a[1])[0];
    if (mostClickedWord && mostClickedWord[1] >= 8) {
      list.push({ 
        type: 'warning', 
        title: `키워드 집중 해설 권장: ${mostClickedWord[0]}`, 
        desc: `'${mostClickedWord[0]}' 단어에 대한 클릭이 집중되고 있습니다. 해당 개념이 뒤에 나올 실습의 핵심이므로, 다시 한번 정의를 짚고 넘어가시는 것을 추천합니다.` 
      });
    }
    
    // 3. 강의 템포 기반 가이드 (심각도: Info/Danger)
    if (lectureTempo >= 75) {
      list.push({ 
        type: 'danger', 
        title: '강의 템포 과속 알림', 
        desc: '학생들의 반응 속도가 교수님의 설명을 따라가지 못하고 있습니다. 10% 정도 느린 호흡으로 진행해 주세요.' 
      });
    }
    
    return list;
  }, [wordClicks, lectureTempo, misunderstandingCount, misunderstandingRatio]);

  const sortedWords = Object.entries(wordClicks).sort((a, b) => b[1] - a[1]);
  const maxClicks = Math.max(...Object.values(wordClicks), 1);

  // [상태 1] 강의 시작 전: 업로드 및 분석 화면
  if (!isStarted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center overflow-hidden">
        <AnimatePresence mode="wait">
          {!isUploading && !isAnalyzed ? (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md space-y-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-3xl">📄</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">강의 자료 업로드</h2>
                <p className="text-slate-500 text-sm">PDF 자료를 업로드하면 AI가 핵심 맥락을 추출합니다.</p>
              </div>
              <label className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                파일 선택하기
                <input type="file" className="hidden" onChange={(e) => startAnalysis(e.target.files[0]?.name || '강의자료.pdf')} />
              </label>
            </motion.div>
          ) : isUploading ? (
            <motion.div key="analyzing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full space-y-8">
              <h2 className="text-xl font-bold text-slate-800 text-center">AI 맥락 정밀 분석 중...</h2>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${analysisProgress}%` }} className="h-full bg-indigo-500" />
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase animate-pulse">Extracting Knowledge Graph</p>
            </motion.div>
          ) : (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md space-y-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
              <h2 className="text-2xl font-bold text-slate-800">맥락 분석 완료</h2>
              <button onClick={() => onStart({ title: '분석된 강의' })} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all">강의 시작하기</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // [상태 2] 강의 시작 후: 3대 패널 싱글 뷰 대시보드
  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      
      {/* 1. 최상단 요약 바 (고정 높이) */}
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white rounded-2xl border border-slate-100">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Session Status</span>
            <span className="text-xs font-black text-emerald-500 uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Live Monitoring
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Students</span>
            <span className="text-xs font-black text-slate-700">{totalStudents}명 연결됨</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
          <span className="text-[10px] font-black text-indigo-400 uppercase">Tempo</span>
          <span className="text-sm font-black text-indigo-600">{lectureTempo}%</span>
        </div>
      </div>

      {/* 2. 메인 콘텐츠: 3대 패널 그리드 (3:3:4 비율) */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        
        {/* 패널 1: 모르는 단어 (히트맵) - 비율 3 */}
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              용어 질문 빈도 (Heatmap)
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-5">
            {sortedWords.map(([word, count], i) => (
              <div key={word} className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>{i+1}. {word}</span>
                  <span className={count > 5 ? 'text-indigo-600' : 'text-slate-400'}>{count}회</span>
                </div>
                <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden border border-slate-100/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxClicks) * 100}%` }}
                    className="h-full bg-indigo-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 패널 2: 이해 안 되는 내용 (미이해 지수) - 비율 3 */}
        <section className="flex-[3] bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-0 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              맥락 미이해 지수 (Ratio)
            </h3>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center mb-8">
              {/* 원형 시각화 */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-50" />
                <motion.circle 
                  cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="10" fill="transparent" 
                  strokeDasharray={402}
                  animate={{ strokeDashoffset: 402 - (402 * misunderstandingRatio) / 100 }}
                  className="text-rose-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-800">{misunderstandingRatio}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Confusion</span>
              </div>
            </div>
            
            <div className="w-full bg-rose-50 rounded-2xl p-5 border border-rose-100 text-center">
              <p className="text-[10px] font-bold text-rose-400 uppercase mb-1">놓치고 있는 학생 수</p>
              <p className="text-2xl font-black text-rose-700">{misunderstandingCount} <span className="text-xs text-rose-400 font-bold">/ {totalStudents}명</span></p>
            </div>
          </div>
        </section>

        {/* 패널 3: AI 강의 도우미 (종합 분석) - 비율 4 */}
        <section className="flex-[4] bg-slate-900 rounded-3xl p-6 flex flex-col min-h-0 text-white shadow-2xl relative overflow-hidden">
          {/* 배경 데코레이션 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-sm font-black flex items-center gap-2">
              <span className="text-indigo-400 text-lg">✦</span>
              AI 중재 어시스턴트
            </h3>
            <div className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-widest">Context Analyzing</div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 relative z-10">
            <AnimatePresence mode="popLayout">
              {aiInsights.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 py-20 text-center">
                  <span className="text-4xl mb-4">🤖</span>
                  <p className="text-xs italic font-medium leading-relaxed">데이터가 충분히 수집되면<br/>AI가 맞춤형 강의 전략을 제안합니다.</p>
                </div>
              ) : (
                aiInsights.map((ins, i) => (
                  <motion.div 
                    key={ins.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-5 rounded-2xl border-l-4 shadow-lg ${
                      ins.type === 'danger' ? 'bg-rose-500/10 border-rose-500' : 
                      ins.type === 'warning' ? 'bg-amber-500/10 border-amber-500' : 'bg-indigo-500/10 border-indigo-500'
                    }`}
                  >
                    <h4 className={`text-[10px] font-black mb-2 uppercase tracking-widest ${
                      ins.type === 'danger' ? 'text-rose-400' : 
                      ins.type === 'warning' ? 'text-amber-400' : 'text-indigo-400'
                    }`}>{ins.title}</h4>
                    <p className="text-[11px] leading-relaxed text-slate-300 font-medium">{ins.desc}</p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/10 relative z-10">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
              <span className="text-lg">💡</span>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                AI 데이터 팁: 현재 이해도 저하는 강의 초반의 개념 정의 부족에서 기인할 수 있습니다. 짤막한 Q&A 시간을 가져보세요.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
