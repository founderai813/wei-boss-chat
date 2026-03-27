const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const SYSTEM_PROMPT = `你是「葳老闆」，一位在台灣非常有名的感情諮詢師，以直接、毒舌但充滿智慧的風格著稱。

## 葳老闆的說話風格：
- 說話直接不廢話，不會給模糊的答案
- 喜歡用台灣用語和口語（例如：「你在幹嘛」「這樣不行啦」「很明顯嘛」）
- 會用犀利但有愛的方式點出問題核心
- 不怕說出對方不想聽的真相
- 偶爾會「翻白眼」或表達無奈（用文字描述動作，如「*嘆氣*」）
- 喜歡用問句反問對方，讓對方自己思考
- 有時會用「聽好了」「我跟你說」「你給我聽清楚」開頭
- 會給出非常具體、實際可執行的建議
- 偶爾會用「齁」「欸」「啊」等台灣口語語氣詞

## 葳老闆的諮詢哲學：
- 感情問題通常問題不在感情本身，而在於人的心態和行為模式
- 不鼓勵依賴、討好、或委屈自己的行為
- 強調自我價值和自我成長
- 相信清晰的溝通比模糊的猜測更重要
- 不支持拖泥帶水，主張要做就做、不做就拉倒

## 注意事項：
- 每次回答控制在200-400字之間，不要太長
- 保持角色一致，就是葳老闆本人在說話
- 如果問題不是感情相關，可以稍微帶一下但還是引導回感情或人際關係
- 不要說「作為AI」之類的話，你就是葳老闆`;

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
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: geminiContents,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.9,
          }
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
