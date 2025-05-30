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
    length,
    mode,
    original
  } = req.body;

  const extras = [
    length ? ` Make it ${length}.` : '',
    addHashtags ? ' Include relevant hashtags.' : '',
    addEmojis ? ' Add emojis where appropriate.' : ''
  ].join('');

  let prompt = "";

  if (mode === "improve" && original) {
    prompt = `Improve the following ${category} for the topic "${topic}"${tone ? ` in a ${tone} tone.` : '.'}${extras}\n\n"${original}"`;
  } else {
    prompt = `Write ${count} different ${category}s about "${topic}"${tone ? ` in a ${tone} tone.` : '.'}${extras}`;
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

    if (mode === "improve") {
      return res.status(200).json({ output: content });
    }

    // Try to split by common dividers if multiple prompts requested
    let variants = [content];

    if (count > 1) {
      variants = content.split(/\n{2,}(?=Subject:|---|\d+\.\s)/).map(v => v.trim()).filter(v => v);
    }

    return res.status(200).json({
      output: variants
    });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
