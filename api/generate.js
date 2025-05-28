export const config = {
  api: {
    bodyParser: false,
  },
};

import { IncomingForm } from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new IncomingForm({ keepExtensions: true });
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Form parsing error' });
    }

    const { topic, tone, variants } = fields;
    const file = files.image?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const imageBuffer = fs.readFileSync(file.filepath);
    const base64Image = imageBuffer.toString('base64');

    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Write ${variants} different Instagram captions about "${topic}"${tone ? ` in a ${tone} tone` : ''}.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }],
          max_tokens: 500
        })
      });

      const data = await openaiRes.json();

      if (openaiRes.ok) {
        const responseText = data.choices[0].message.content.trim();
        res.status(200).json({ output: responseText.split('\n\n') });
      } else {
        console.error('OpenAI error:', data);
        res.status(500).json({ error: data });
      }

    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}
