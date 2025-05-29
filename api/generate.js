<script>
  const slider = document.getElementById("lengthSlider");
  const label = document.getElementById("lengthLabel");

  const lengthMap = {
    1: "very short",
    2: "shorter",
    3: "default",
    4: "longer",
    5: "very long"
  };

  const labelMap = {
    1: "Very Short",
    2: "Short",
    3: "Default",
    4: "Long",
    5: "Very Long"
  };

  slider.addEventListener("input", () => {
    label.textContent = labelMap[slider.value];
  });

  async function generate() {
    const category = document.getElementById("category").value.trim();
    const topic = document.getElementById("topic").value.trim();
    const tone = document.getElementById("tone").value.trim();
    const count = parseInt(document.getElementById("count").value);
    const addHashtags = document.getElementById("addHashtags").checked;
    const addEmojis = document.getElementById("addEmojis").checked;
    const length = lengthMap[slider.value];

    const output = document.getElementById("output");
    output.innerHTML = '<div class="spinner"></div>';

    // Validate inputs
    if (!category || !topic) {
      output.innerHTML = `<div class="prompt-box">❌ Please enter both a category and a topic.</div>`;
      return;
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category,
          topic,
          tone,
          count,
          addHashtags,
          addEmojis,
          length,
          mode: "generate" // critical: ensure the backend uses the right logic
        })
      });

      const data = await response.json();
      output.innerHTML = "";

      if (!response.ok || !data.output) {
        output.innerHTML = `<div class="prompt-box">❌ ${data?.error?.message || 'Generation failed. Check console.'}</div>`;
        console.error("API error:", data);
        return;
      }

      const results = Array.isArray(data.output) ? data.output : [data.output];

      results.forEach((text) => {
        const box = document.createElement("div");
        box.className = "prompt-box";
        box.textContent = text;
        output.appendChild(box);
      });
    } catch (err) {
      console.error("Fetch error:", err);
      output.innerHTML = `<div class="prompt-box">❌ Network error. Check console for details.</div>`;
    }
  }
</script>
