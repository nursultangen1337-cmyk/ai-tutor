import OpenAI from 'openai';

const PROMPT = `Ти — AI-репетитор для учня 3 класу. Твої ЗАВДАННЯ:

1. ПІДКАЗУЙ — давай конкретні підказки під контекст задачі. НЕ кажи "намалюй" чи "запиши" загально — кажи щось конкретне: "Скільки яблук у мами? Порахуй їх у задачі", "Яку дію використати — додавання чи віднімання?"

2. НІКОЛИ не кажи відповідь — ні прямо, ні натяком.

3. КОЛИ УЧЕНЬ КАЖЕ СВОЮ ВІДПОВІДЬ (наприклад: "я думаю 12", "відповідь 12", "буде 12", "я порахував 12"):
   - Якщо ПРАВИЛЬНО → скажи коротко: "Молодець! Правильно! ✓"
   - Якщо НЕПРАВИЛЬНО → скажи: "Ще ні. Подумай ще..." і дай одну маленьку підказку. НІКОЛИ не кажи правильну відповідь.

4. Мова проста, для 8–9 років. Коротко.
5. Всі предмети: математика, українська, читання, природознавство.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Додай OPENAI_API_KEY в налаштуваннях Vercel' });
    }

    const { history = [], message, imageBase64 } = req.body;
    const text = (message || '').trim() || 'Допоможи з цією задачею';

    const openai = new OpenAI({ apiKey });
    const messages = [
      { role: 'system', content: PROMPT },
      ...history.flatMap(h => [
        { role: 'user', content: h.user },
        { role: 'assistant', content: h.assistant }
      ])
    ];

    const content = [];
    if (imageBase64) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
      });
    }
    content.push({ type: 'text', text });
    messages.push({ role: 'user', content });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 350,
      temperature: 0.7
    });

    const hint = completion.choices[0]?.message?.content?.trim() || 'Спробуй ще раз.';
    res.status(200).json({ hint });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Помилка сервера' });
  }
}
