// generate.js

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
    if (err) return res.status(400).json({ error: 'Form parsing error' });

    const topic = fields.topic?.[0];
    const tone = fields.tone?.[0];
    const count = parseInt(fields.count?.[0] || '1');
    const imageFile = files.image?.[0];

    if (!imageFile || !topic) return res.status(400).json({ error: 'Missing image or topic' });

    const imageBuffer = fs.readFileSync(imageFile.filepath);
    const base64Image = imageBuffer.toString('base64');

    const prompt = `Write ${count} Instagram captions about "${topic}"${tone ? ` in a ${tone} tone` : ''}.`;

    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            { role: 'user', content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            ]},
          ],
          max_tokens: 500,
        }),
      });

      const data = await openaiRes.json();
      if (openaiRes.ok) {
        const output = data.choices[0].message.content.trim().split(/\n{2,}/);
        return res.status(200).json({ output });
      } else {
        console.error('OpenAI error:', data);
        return res.status(500).json({ error: 'OpenAI error' });
      }
    } catch (e) {
      console.error('Server error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}
