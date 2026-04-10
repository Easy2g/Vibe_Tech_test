/**
 * Cloudflare Pages Function: Gemini AI 분석 중계 서버
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { textContent } = await request.json();
    const API_KEY = env.GEMINI_API_KEY; // Cloudflare 관리자 화면에서 설정할 변수

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "API 키가 설정되지 않았습니다." }), { status: 500 });
    }

    const prompt = `
      당신은 교육 전문가입니다. 다음 강의 자료 내용을 분석하여 학생용 요약본을 JSON 형식으로 작성하세요.
      반드시 다음 JSON 형식을 엄격히 지켜주세요:
      { "topic": "주제", "keyPoints": ["핵심1", "핵심2", "핵심3", "핵심4"] }
      
      내용:
      ${textContent.substring(0, 10000)}
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
    
    // JSON 응답 정제
    const cleanJson = aiResult.replace(/```json|```/g, "").trim();
    
    return new Response(cleanJson, {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
