import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, ref, set, get, onValue } from '../firebase';

// 간단 해시 (대회용)
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
};

// 4자리 교수코드 생성 (대문자+숫자)
const generateTeacherCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

// ==========================================
// 공통 컴포넌트: 역할 선택 (Role Selection)
// ==========================================
export function RoleSelection({ onSelect, lectureCode }) {
  const [showTeacherAuth, setShowTeacherAuth] = useState(false);
  const [showStudentEntry, setShowStudentEntry] = useState(false);

  const handleRoleClick = (role) => {
    if (role === 'teacher') setShowTeacherAuth(true);
    else if (role === 'student') setShowStudentEntry(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full space-y-8 border border-slate-100 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Vibe<span className="text-indigo-500">-Tech</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">데이터로 소통하는 인공지능 교육 중재 솔루션</p>
        </div>
        <div className="space-y-4 pt-4">
          <button onClick={() => handleRoleClick('student')} className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm">👨‍🎓 학생으로 참여하기</button>
          <button onClick={() => handleRoleClick('teacher')} className="w-full py-4 bg-indigo-600 rounded-2xl font-bold text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">👨‍🏫 교수 대시보드 열기</button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showTeacherAuth && <TeacherAuthModal onClose={() => setShowTeacherAuth(false)} onSuccess={(data) => onSelect('teacher', data)} />}
        {showStudentEntry && <StudentEntryModal onClose={() => setShowStudentEntry(false)} onEnter={(code) => onSelect('student', { code })} />}
      </AnimatePresence>
    </div>
  );
}

export function TeacherAuthModal({ onSuccess, onClose }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [teacherId, setTeacherId] = useState(""); // 고유 아이디
  const [name, setName] = useState("");           // 표시 이름
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!teacherId.trim() || !name.trim() || !password) {
      setError("아이디, 이름, 비밀번호를 모두 입력해주세요.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(teacherId.trim())) {
      setError("아이디는 영문/숫자/언더바 3~20자로 입력해주세요.");
      return;
    }
    if (password.length < 4) {
      setError("비밀번호는 4자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 아이디 중복 확인
      const existing = await get(ref(db, `teachers/${teacherId.trim()}`));
      if (existing.exists()) {
        setError("이미 사용 중인 아이디입니다.");
        setLoading(false);
        return;
      }

      // 교수코드 중복 없이 생성
      let teacherCode = "";
      let codeUnique = false;
      while (!codeUnique) {
        teacherCode = generateTeacherCode();
        const allTeachers = await get(ref(db, "teachers"));
        const allData = allTeachers.val() || {};
        codeUnique = !Object.values(allData).some(t => t.teacherCode === teacherCode);
      }

      await set(ref(db, `teachers/${teacherId.trim()}`), {
        name: name.trim(),
        passwordHash: simpleHash(password),
        teacherCode,
        createdAt: Date.now(),
      });

      localStorage.setItem("teacherSession", JSON.stringify({
        teacherId: teacherId.trim(),
        teacherName: name.trim(),
        teacherCode,
      }));

      onSuccess({
        teacherId: teacherId.trim(),
        teacherName: name.trim(),
        teacherCode,
      });

    } catch (err) {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!teacherId.trim() || !password) {
      setError("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const snapshot = await get(ref(db, `teachers/${teacherId.trim()}`));
      if (!snapshot.exists()) {
        setError("존재하지 않는 아이디입니다.");
        setLoading(false);
        return;
      }

      const data = snapshot.val();
      if (data.passwordHash !== simpleHash(password)) {
        setError("비밀번호가 올바르지 않습니다.");
        setLoading(false);
        return;
      }

      localStorage.setItem("teacherSession", JSON.stringify({
        teacherId: teacherId.trim(),
        teacherName: data.name,
        teacherCode: data.teacherCode,
      }));

      onSuccess({
        teacherId: teacherId.trim(),
        teacherName: data.name,
        teacherCode: data.teacherCode,
      });

    } catch (err) {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative"
      >
        <button type="button" onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-indigo-600 transition-all duration-300 hover:rotate-90" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-slate-800">교수 포털</h2>
          <p className="text-xs text-slate-400 mt-1">Vibe-Tech 강의 관리 시스템</p>
        </div>

        {/* 탭 */}
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-5">
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                mode === m ? "bg-white shadow text-slate-800" : "text-slate-400"
              }`}
            >
              {m === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="아이디 (영문/숫자/언더바)"
            value={teacherId}
            onChange={e => setTeacherId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none"
          />
          {mode === "signup" && (
            <input
              type="text"
              placeholder="이름 (학생에게 표시됨)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none"
            />
          )}
          <input
            type="password"
            placeholder="비밀번호 (4자 이상)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignup())}
            className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none"
          />
        </div>

        {error && <p className="text-red-500 text-xs mt-3 text-center">{error}</p>}

        <button
          onClick={mode === "login" ? handleLogin : handleSignup}
          disabled={loading}
          className="w-full mt-5 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
        </button>
      </motion.div>
    </motion.div>
  );
}

export function StudentEntryModal({ onEnter, onClose }) {
  const [subscribedTeachers, setSubscribedTeachers] = useState(() => {
    try { return JSON.parse(localStorage.getItem("subscribedTeachers") || "[]"); }
    catch { return []; }
  });

  const [step, setStep] = useState(
    subscribedTeachers.length > 0 ? "lectures" : "subscribe"
  );

  const [inputCode, setInputCode] = useState("");   // 교수코드 입력
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [activeLectures, setActiveLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");

  // 구독 교수의 활성 강의 실시간 로드
  useEffect(() => {
    if (subscribedTeachers.length === 0 || step !== "lectures") return;
    setLecturesLoading(true);

    const subscribedIds = subscribedTeachers.map(t => t.teacherId);
    const sessionsRef = ref(db, "sessions");
    const unsub = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const lectures = Object.entries(data)
        .filter(([code, session]) =>
          session?.info?.isActive === true &&
          subscribedIds.includes(session?.info?.teacherId)
        )
        .map(([code, session]) => ({
          code,
          topic: session?.info?.topic || "강의 진행 중",
          teacherName: session?.info?.teacherName || "교수",
          startedAt: session?.info?.startedAt,
        }))
        .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
      setActiveLectures(lectures);
      setLecturesLoading(false);
    });
    return () => unsub();
  }, [subscribedTeachers, step]);

  // 교수코드로 구독
  const handleSubscribeByCode = async () => {
    const code = inputCode.trim().toUpperCase();
    if (code.length !== 4) {
      setCodeError("4자리 교수코드를 입력해주세요.");
      return;
    }
    setCodeLoading(true);
    setCodeError("");

    try {
      const snapshot = await get(ref(db, "teachers"));
      const teachers = snapshot.val() || {};
      const matched = Object.entries(teachers).find(
        ([id, t]) => t.teacherCode === code
      );

      if (!matched) {
        setCodeError("유효하지 않은 교수코드입니다.");
        setCodeLoading(false);
        return;
      }

      const [teacherId, teacherData] = matched;

      if (subscribedTeachers.some(t => t.teacherId === teacherId)) {
        setCodeError("이미 등록된 교수님입니다.");
        setCodeLoading(false);
        return;
      }

      const newTeacher = {
        teacherId,
        teacherName: teacherData.name,
        teacherCode: code,
      };
      const updated = [...subscribedTeachers, newTeacher];
      setSubscribedTeachers(updated);
      localStorage.setItem("subscribedTeachers", JSON.stringify(updated));
      setInputCode("");
      setStep("lectures");

    } catch (err) {
      setCodeError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setCodeLoading(false);
    }
  };

  // 구독 취소
  const handleUnsubscribe = (teacherId) => {
    const updated = subscribedTeachers.filter(t => t.teacherId !== teacherId);
    setSubscribedTeachers(updated);
    localStorage.setItem("subscribedTeachers", JSON.stringify(updated));
  };

  const handleSelectLecture = (lecture) => {
    setSelectedLecture(lecture);
    setStep("confirm");
  };

  const handleConfirm = () => {
    const code = selectedLecture?.code || manualCode.trim().toUpperCase();
    if (!code || code.length !== 6) return;
    onEnter(code);
  };

  return (
    <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative"
      >
        <button type="button" onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-indigo-600 transition-all duration-300 hover:rotate-90" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* STEP: 교수 등록 */}
        {step === "subscribe" && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-lg font-black text-slate-800">교수 등록</h2>
              <p className="text-xs text-slate-400 mt-1">교수님께 받은 4자리 코드를 입력하세요</p>
            </div>

            <input
              type="text"
              placeholder="교수코드 4자리 (예: AB12)"
              maxLength={4}
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleSubscribeByCode()}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-center text-lg font-black font-mono tracking-widest border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none mb-3"
            />

            {codeError && <p className="text-red-500 text-xs text-center mb-3">{codeError}</p>}

            <button
              onClick={handleSubscribeByCode}
              disabled={codeLoading || inputCode.length !== 4}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 active:scale-[0.98]"
            >
              {codeLoading ? "확인 중..." : "교수 등록하기"}
            </button>

            {/* 등록된 교수 목록 */}
            {subscribedTeachers.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400 mb-2">등록된 교수님</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {subscribedTeachers.map(({ teacherId, teacherName, teacherCode }) => (
                    <div key={teacherId} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-sm font-bold text-slate-700">{teacherName} 교수</p>
                        <p className="text-xs text-slate-400 font-mono">{teacherCode}</p>
                      </div>
                      <button
                        onClick={() => handleUnsubscribe(teacherId)}
                        className="text-xs text-red-400 hover:text-red-600 font-bold"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep("lectures")}
                  className="w-full mt-3 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all"
                >
                  강의 목록 보기 →
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP: 강의 목록 */}
        {step === "lectures" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-slate-800">강의 참여</h2>
                <p className="text-xs text-slate-400 truncate">
                  {subscribedTeachers.map(t => t.teacherName).join(", ")} 교수님
                </p>
              </div>
              <button
                onClick={() => setStep("subscribe")}
                className="text-xs text-indigo-500 font-bold hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 flex-shrink-0 ml-2"
              >
                + 교수 추가
              </button>
            </div>

            {lecturesLoading ? (
              <div className="text-center py-8 text-slate-400 text-sm animate-pulse">불러오는 중...</div>
            ) : activeLectures.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-slate-400 text-sm">현재 진행 중인 강의가 없습니다</p>
                <p className="text-slate-300 text-xs mt-1">강의 시작 시 자동으로 표시됩니다</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto mb-4 pr-1">
                {activeLectures.map((lecture) => (
                  <button
                    key={lecture.code}
                    onClick={() => handleSelectLecture(lecture)}
                    className="w-full text-left p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl transition-all group"
                  >
                    <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 truncate">
                      {lecture.topic}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-slate-400">{lecture.teacherName} 교수</p>
                      <p className="text-xs font-mono text-indigo-400">{lecture.code}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 코드 직접 입력 */}
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-400 mb-2 text-center">코드를 직접 알고 있다면</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="6자리 강의코드"
                  maxLength={6}
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none font-mono text-center tracking-widest"
                />
                <button
                  onClick={() => manualCode.length === 6 && handleSelectLecture({ code: manualCode, topic: "직접 입력", teacherName: "" })}
                  disabled={manualCode.length !== 6}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl disabled:opacity-30 hover:bg-indigo-700 transition-all"
                >
                  입장
                </button>
              </div>
            </div>
          </>
        )}

        {/* STEP: 입장 확인 */}
        {step === "confirm" && selectedLecture && (
          <>
            <h2 className="text-lg font-black text-slate-800 mb-4 text-center">강의에 참여하시겠어요?</h2>
            <div className="bg-indigo-50 rounded-2xl p-5 mb-5 text-center">
              <p className="text-3xl font-black font-mono text-indigo-600 tracking-widest mb-2">
                {selectedLecture.code}
              </p>
              <p className="text-sm font-bold text-slate-700">{selectedLecture.topic}</p>
              {selectedLecture.teacherName && (
                <p className="text-xs text-slate-400 mt-1">{selectedLecture.teacherName} 교수</p>
              )}
            </div>
            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98]"
            >
              입장하기
            </button>
            <button
              onClick={() => setStep("lectures")}
              className="w-full mt-2 py-2 text-slate-400 text-sm"
            >
              목록으로 돌아가기
            </button>
          </>
        )}

      </motion.div>
    </motion.div>
  );
}

export function WordExplanationModal({ word, onClose, lectureContext }) {
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExplanation = async () => {
      setIsLoading(true);
      try {
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        if (!API_KEY) throw new Error('API 키 없음');

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`;

        const prompt = `당신은 대학 강의 중 학생을 돕는 AI 튜터입니다.
현재 강의 주제: "${lectureContext?.topic || '일반 학술 강의'}"
학생이 "${word}"라는 단어를 클릭했습니다.
이 단어를 현재 강의 주제와 연결하여 쉽고 명확하게 설명해주세요.
규칙:
- 3~4문장으로 간결하게
- 전문 용어는 쉬운 말로 풀어서
- 현재 강의 맥락과 연결해서 설명
- 인사말 없이 바로 설명 시작`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'API 오류');

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!resultText) throw new Error('응답 없음');
        setExplanation(resultText);
      } catch (err) {
        setExplanation(`"${word}"에 대한 설명을 불러오는 중 오류가 발생했습니다.`);
      } finally {
        setIsLoading(false);
      }
    };

    if (word) fetchExplanation();
  }, [word, lectureContext]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
      >
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Contextual Dictionary</span>
            <h4 className="font-bold text-lg text-slate-800">{word}</h4>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl transition-colors">✕</button>
        </div>
        <div className="p-8 min-h-[160px] flex flex-col justify-center">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-slate-100 rounded-full animate-pulse w-full"></div>
              <div className="h-4 bg-slate-100 rounded-full animate-pulse w-5/6"></div>
              <div className="h-4 bg-slate-100 rounded-full animate-pulse w-4/6"></div>
            </div>
          ) : (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-slate-700 font-semibold leading-relaxed text-sm whitespace-pre-line"
            >
              {explanation}
            </motion.p>
          )}
        </div>
        <div className="bg-indigo-50/50 py-3 text-center border-t border-indigo-100">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest italic flex items-center justify-center gap-2">
            {isLoading ? <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></span> : "✨"} 
            AI Contextual Analysis Complete
          </span>
        </div>
      </motion.div>
    </div>
  );
}
