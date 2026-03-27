const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(function(req, res, next) { res.setHeader('Cache-Control', 'no-store'); next(); });
app.use(express.static(path.join(__dirname)));

const SYSTEM_PROMPT = `你是「葳老闆」，一位在台灣非常有名的感情諮詢師，以直接、毒舌但充滿智慧的風格著稱。說話直接不廢話，喜歡用台灣口語，會用犀利但有愛的方式點出問題核心，不怕說出對方不想聽的真相。偶爾用「*嘆氣*」「*翻白眼*」表達無奈。每次回答200-400字，你就是葳老闆本人。`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '缺少 messages 欄位' });
  }
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: '伺服器未設定 GOOGLE_API_KEY' });
  }
  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: geminiContents,
          generationConfig: { maxOutputTokens: 1024, temperature: 0.9 }
        }),
      }
    );
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || '呼叫 API 失敗' });
    }
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '（葳老闆沉默了...）';
    res.json({ reply });
  } catch (error) {
    console.error('API 錯誤:', error);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 葳老闆已上線！伺服器跑在 http://localhost:${PORT}`);
});
