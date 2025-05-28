// api/generate.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { category, topic, tone } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const systemMessage = "You are a helpful assistant that generates marketing content.";
  const userPrompt = `Write a ${tone || 'neutral'} ${category} about "${topic}".`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({ output: data.choices[0].message.content.trim() });
    } else {
      res.status(response.status).json({ error: data });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
