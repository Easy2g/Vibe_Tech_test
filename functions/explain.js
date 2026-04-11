/**
 * Cloudflare Pages Function: 실시간 문맥 사전 AI (Gemini)
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { word, topic } = await request.json();
    const API_KEY = env.GEMINI_API_KEY;

    if (!API_KEY) {
      return new Response(JSON.stringify({ 
        explanation: `${word}는 현재 문맥에서 중요한 개념입니다. (AI 키가 설정되지 않아 기본 설명을 제공합니다.)` 
      }), { headers: { "Content-Type": "application/json" } });
    }

    const prompt = `
      강의 보조 AI로서 다음 단어를 학생이 이해하기 쉽게 설명하세요.
      반드시 현재 강의 주제인 "${topic || '일반 교육'}"의 문맥을 반영하여 설명해야 합니다.
      
      단어: ${word}
      
      [지침]
      1. 전문 용어를 사용하되 초보자도 이해할 수 있게 풀어서 설명하세요.
      2. 2~3문장 내외로 간결하게 답변하세요.
      3. JSON 형식으로 응답하세요: { "explanation": "설명 내용" }
    `;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await apiResponse.json();
    let aiResult = data.candidates[0].content.parts[0].text;
    const cleanJson = aiResult.replace(/```json|```/g, "").trim();
    
    return new Response(cleanJson, { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ 
      explanation: "AI 분석 중 일시적인 오류가 발생했습니다. 교수님께 직접 질문해보는 것은 어떨까요?" 
    }), { headers: { "Content-Type": "application/json" } });
  }
}
