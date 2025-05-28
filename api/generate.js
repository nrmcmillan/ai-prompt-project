export default async function handler(req, res) {
  const { category, topic, tone } = req.body;

  const promptMap = {
    email: `Write a ${tone || 'professional'} cold email introducing ${topic}. Include a soft CTA.`,
    instagram: `Write an ${tone || 'engaging'} Instagram caption about ${topic}. Include a trending hashtag.`,
    blog: `Create a blog post outline on ${topic}. Use a ${tone || 'helpful'} tone.`,
    seo: `Write a ${tone || 'concise'} meta description for a page about ${topic}. Keep it under 160 characters.`,
    job: `Write a ${tone || 'formal'} cover letter tailored to a job related to ${topic}. Include enthusiasm and relevant experience.`
  };

  const finalPrompt = promptMap[category] || `Write something about ${topic} in a ${tone} tone.`;

  const apiKey = process.env.OPENAI_API_KEY;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful writing assistant." },
        { role: "user", content: finalPrompt }
      ],
      max_tokens: 300
    })
  });

  const json = await response.json();
  res.status(200).json({ output: json.choices?.[0]?.message?.content });
}
