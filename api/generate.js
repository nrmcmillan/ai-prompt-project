export const config = {
  api: {
    bodyParser: false,
  },
};

import { IncomingForm } from 'formidable';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Form parsing error' });
    }

    const { category, topic, tone, variants } = fields;
    const image = files.image?.[0];

    if (!topic || !category) {
      return res.status(400).json({ error: 'Missing topic or category' });
    }

    const prompt = `Write ${variants} different ${category} prompts about "${topic}"${tone ? ` in a ${tone} tone` : ""}.`;

    try {
      const messages = [
        { role: "system", content: "You are a creative assistant that writes content." },
        { role: "user", content: [{ type: "text", text: prompt }] }
      ];

      if (image) {
        const imageBuffer = fs.readFileSync(image.filepath);
        const base64Image = imageBuffer.toString('base64');
        messages[1].content.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-vision-preview",
          messages,
          max_tokens: 600,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const variantsList = data.choices[0].message.content.trim().split(/\n{2,}/);
        res.status(200).json({ output: variantsList });
      } else {
        console.error("OpenAI API error:", data);
        res.status(response.status).json({ error: data });
      }
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
}
