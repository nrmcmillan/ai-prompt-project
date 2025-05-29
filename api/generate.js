export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    category,
    topic,
    tone,
    count = 1,
    addHashtags,
    addEmojis,
    length
  } = req.body;

  const extra = `${addHashtags ? ' Include relevant hashtags.' : ''}${addEmojis ? ' Add emojis where appropriate.' : ''}`;
  const lengthNote = length && length !== 'default' ? ` Make it ${length}.` : '';
  const toneNote = tone ? ` in a ${tone} tone` : '';

  const prompt = `Write ${count} different ${category}s about "${topic}"${toneNote}.${lengthNote}${extra}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant who writes great social media and marketing content." },
          { role: "user", content: prompt }
        ],
        temperature: 0.75
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({ error: data });
    }

    const content = data.choices?.[0]?.message?.content?.trim();

    const results = content
      .split(/\n{2,}/)
      .map(p => p.replace(/^\d+\.\s*/, '').trim())
      .filter(p => p);

    return res.status(200).json({ output: results.length ? results : [content] });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
