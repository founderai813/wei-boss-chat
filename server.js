const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(require('cors')());
app.use(express.static(require('path').join(__dirname)));

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'no messages' });
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'no api key' });
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: `你是葳老闆，台灣最直白的感情諮詢師。說話直接、毒舌但有愛，喜歡用台灣口語。每次回答200-400字。` }] },
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 1024, temperature: 0.9 }
      })
    });
    const d = await r.json();
    const reply = d.candidates?.[0]?.content?.parts?.[0]?.text || '出了點問題';
    res.json({ reply });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log('葳老闆上線 port ' + PORT));
