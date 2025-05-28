export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { category, topic, tone, count } = req.body;
  const safeCount = Math.max(1, Math.min(5, parseInt(count)));

  const prompt = `Write ${safeCount} different engaging ${category}s about "${topic}"${tone ? ` in a ${tone} tone` : ''}. Number each one clearly.`;

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
          { role: "system", content: "You are a helpful content assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (response.ok) {
      const outputs = data.choices[0].message.content
        .split(/\n(?=\d+\.)/)
        .map(str => str.trim())
        .filter(Boolean);

      res.status(200).json({ output: outputs });
    } else {
      console.error("OpenAI API error:", data);
      res.status(response.status).json({ error: data });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
