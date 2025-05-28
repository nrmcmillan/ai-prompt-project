export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { category, topic, tone } = req.body;

  const prompt = `Write an engaging ${category} about ${topic}${tone ? ` in a ${tone} tone` : ''}.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        n: 3
      })
    });

    const data = await response.json();

    if (response.ok) {
      const outputs = data.choices.map(choice => choice.message.content.trim());
      res.status(200).json({ outputs });
    } else {
      console.error("OpenAI API error:", data);
      res.status(response.status).json({ error: data });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
