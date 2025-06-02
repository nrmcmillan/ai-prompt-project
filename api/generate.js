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
    language = "English",
    mode,
    original
  } = req.body;

  const extras = [
    length ? ` Make it ${length}.` : '',
    addHashtags ? ' Include relevant hashtags.' : '',
    addEmojis ? ' Add emojis where appropriate.' : '',
    language && language !== 'English' ? ` Write it in ${language}.` : ''
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

    // ✅ Only split into variants if category needs it
    const singleBlockCategories = ["cold email", "blog outline", "product description", "website copy"];
    let variants = [];

    const normalizedCategory = category.toLowerCase();
const singleBlockCategories = ["product description", "website copy"];
const numberedBlockCategories = ["cold email", "blog outline"];

if (count === 1) {
  variants = [content];
} else if (numberedBlockCategories.includes(normalizedCategory)) {
  // Split by numbered sections only (e.g. 1. Email, 2. Email)
  variants = content.split(/\n(?=\d+\.\s)/);
  variants = variants.map(v => v.trim()).filter(v => v.length > 0);
} else if (singleBlockCategories.includes(normalizedCategory)) {
  variants = [content]; // Don’t split
} else {
  // Default: try numbered list, then paragraphs, then bullets
  variants = content.split(/\n(?=\d+\.\s)/);
  if (variants.length < count) {
    variants = content.split(/\n\s*\n/);
  }
  if (variants.length < count) {
    variants = content.split(/\n(?=[*-]|\d+\.)/);
  }
  variants = variants.map(v => v.trim()).filter(v => v.length > 0);
}

      // Try numbered list
      variants = content.split(/\n(?=\d+\.\s)/);

      // Fallback to double line breaks
      if (variants.length < count) {
        variants = content.split(/\n\s*\n/);
      }

      // Final fallback: bullet or dashed items
      if (variants.length < count) {
        variants = content.split(/\n(?=[*-]|\d+\.)/);
      }

      // Clean up
      variants = variants.map(v => v.trim()).filter(v => v.length > 0);
    }

    return res.status(200).json({
      output: variants
    });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
