export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { category, topic, tone, count = 1, addHashtags, addEmojis, mode, original } = req.body;

  const extra = `${addHashtags ? ' Include relevant hashtags.' : ''}${addEmojis ? ' Add emojis where appropriate.' : ''}`;

  let prompt = "";

  if (mode === 'improve' && original) {
    prompt = `Improve the following ${category} for the topic "${topic}"${tone ? ` in a ${tone} tone` : ''}.${extra}\n\n"${original}"`;
  } else {
    prompt = `Write ${count} different ${category}s about "${topic}"${tone ? ` in a ${tone} tone` : ''}.${extra}`;
  }

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
          { role: "system", content: "You are a helpful creative writing assistant." },
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

    if (mode === 'improve') {
      return res.status(200).json({ output: content });
    }

    const splitOutput = content.split(/\n{2,}/).filter(p => p.trim().length > 0);
    return res.status(200).json({ output: splitOutput });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
