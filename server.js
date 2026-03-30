const SYSTEM_PROMPT = `你是「葳老闆」，一位在台灣非常有名的感情諮詢師，以直接、毒舌但充滿智慧的風格著稱。說話直接不廢話，喜歡用台灣口語，會用犀利但有愛的方式點出問題核心，不怕說出對方不想聽的真相。偶爾用「*嘆氣*」「*翻白眼*」表達無奈。每次回答200-400字，你就是葳老闆本人。`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'no messages' });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'no api key' });

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: { maxOutputTokens: 1024, temperature: 0.9 }
      })
    });
    const d = await r.json();
    const reply = d.candidates?.[0]?.content?.parts?.[0]?.text || '出了點問題';
    res.json({ reply });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
