export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { category, topic, tone } = req.body;
  const prompt = `Write 3 different engaging ${category}s about "${topic}"${tone ? ` in a ${tone} tone` : ''}. Each one should be distinct and useful.`;

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
      // Split multiple prompts if returned as one string
      const outputs = data.choices[0].message.content
        .split(/\n(?=\d+\.)/) // split on "1. ", "2. ", etc
        .map(str => str.trim())
        .filter(str => str);

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
