// ==== BACKEND: generate.js ====

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let {
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

  // Normalize boolean values
  addHashtags = addHashtags === true || addHashtags === 'true';
  addEmojis = addEmojis === true || addEmojis === 'true';

  const extras = [
    length ? ` Make it ${length}.` : '',
    addHashtags ? ' Include relevant hashtags.' : '',
    addEmojis ? ' Add emojis where appropriate.' : ''
  ].join('');

  let prompt = "";

  if (mode === "improve" && original) {
    prompt = `Improve the following ${category} for the topic \"${topic}\"${tone ? ` in a ${tone} tone.` : '.'}${extras}\n\n\"${original}\"`;
  } else {
    prompt = `Write ${count} different ${category}s about \"${topic}\"${tone ? ` in a ${tone} tone.` : '.'}${extras}`;
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

    const variants = content
      .split(/\n(?=\d+\.\s)/) // split by numbered list (e.g., 1. , 2. )
      .map(v => v.trim())
      .filter(v => v.length > 0);

    return res.status(200).json({
      output: count === 1 ? [content] : variants
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


// ==== FRONTEND: section that sends request ====

const addHashtags = document.getElementById("addHashtags").checked;
const addEmojis = document.getElementById("addEmojis").checked;

const body = {
  category,
  topic,
  tone,
  count,
  addHashtags,
  addEmojis,
  length
};

const response = await fetch("/api/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});
