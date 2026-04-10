/**
 * Cloudflare Pages Function: Gemini AI 분석 중계 서버
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { textContent } = await request.json();
    const API_KEY = env.GEMINI_API_KEY;

    if (!API_KEY) {
      return new Response(JSON.stringify({ 
        error: "Cloudflare 설정에 GEMINI_API_KEY가 없습니다. 대시보드의 환경 변수 설정을 확인하세요." 
      }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const prompt = `
      강의 전문가로서 다음 텍스트를 요약하세요. 
      반드시 JSON 형식으로 응답하세요: { "topic": "주제", "keyPoints": ["핵심1", "핵심2", "핵심3", "핵심4"] }
      내용: ${textContent.substring(0, 7000)}
    `;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return new Response(JSON.stringify({ error: "Gemini API 호출 실패", detail: errorData }), { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    const aiResult = data.candidates[0].content.parts[0].text;
    const cleanJson = aiResult.replace(/```json|```/g, "").trim();
    
    return new Response(cleanJson, { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: "서버 내부 오류", message: error.message }), { status: 500 });
  }
}
