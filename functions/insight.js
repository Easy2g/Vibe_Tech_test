/**
 * Cloudflare Pages Function: 실시간 강의 중재 AI (Gemini)
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { transcript, wordClicks, misunderstandingCount, studentCount } = await request.json();
    const API_KEY = env.GEMINI_API_KEY;

    if (!API_KEY) return new Response(JSON.stringify({ error: "API 키 누락" }), { status: 500 });

    // AI에게 상황 설명 및 조언 요청 프롬프트
    const prompt = `
      당신은 실시간 교육 중재 AI 조수입니다. 현재 강의 상황을 분석하여 교수님께 드릴 1문장의 '구체적인 행동 지침'을 생성하세요.
      
      [현재 데이터]
      - 최근 30초간 자막: "${transcript}"
      - 이해하기 어렵다는 학생: ${misunderstandingCount}명 / 전체 ${studentCount}명
      - 학생들이 많이 클릭한 단어들: ${JSON.stringify(wordClicks)}
      
      [응답 형식]
      반드시 JSON 형식으로만 짧게 응답하세요:
      { "title": "상황 요약", "desc": "교수님을 위한 1문장 조언", "type": "warning 또는 danger 또는 info" }
    `;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await apiResponse.json();
    const aiResult = data.candidates[0].content.parts[0].text;
    const cleanJson = aiResult.replace(/```json|```/g, "").trim();
    
    return new Response(cleanJson, { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
