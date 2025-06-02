async function generate() {
  const category = document.getElementById("category").value;
  const topic = document.getElementById("topic").value;
  const tone = document.getElementById("tone").value;
  const language = document.getElementById("language").value;
  const count = parseInt(document.getElementById("count").value);
  const addHashtags = document.getElementById("addHashtags").checked;
  const addEmojis = document.getElementById("addEmojis").checked;
  const length = lengthMap[slider.value];
  const output = document.getElementById("output");

  output.innerHTML = '<div class="spinner"></div>';

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ category, topic, tone, count, addHashtags, addEmojis, length, language })
    });

    const data = await response.json();
    output.innerHTML = "";

    if (!response.ok || !data.output) {
      output.innerHTML = `<div class="prompt-box">❌ ${data?.error?.message || 'Generation failed. Check console.'}</div>`;
      console.error("API error:", data);
      return;
    }

    const results = data.output;

    results.forEach((text, index) => {
      const box = document.createElement("div");
      box.className = "prompt-box";

      // Remove GPT-generated numbers like "1. " at the start
      text = text.replace(/^\d+\.\s*/, "");

      // Custom number label
      const numberLabel = document.createElement("div");
      numberLabel.className = "variant-number";
      numberLabel.textContent = `${index + 1}.`;
      numberLabel.style.fontWeight = "bold";
      numberLabel.style.marginBottom = "0.5rem";

      // Actual variant content
      const contentDiv = document.createElement("div");
      contentDiv.className = "prompt-content";
      contentDiv.textContent = text;

      // Copy Button
      const copyBtn = document.createElement("button");
      copyBtn.textContent = "Copy";
      copyBtn.className = "generate-button";
      copyBtn.style.marginTop = "1rem";
      copyBtn.style.padding = "0.4rem 0.75rem";
      copyBtn.style.fontSize = "0.85rem";
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(contentDiv.textContent); // Only copies clean content
        copyBtn.textContent = "Copied!";
        setTimeout(() => copyBtn.textContent = "Copy", 1500);
      };

      // Improve Button
      const improveBtn = document.createElement("button");
      improveBtn.textContent = "Improve This";
      improveBtn.className = "generate-button";
      improveBtn.style.marginLeft = "0.75rem";
      improveBtn.style.padding = "0.4rem 0.75rem";
      improveBtn.style.fontSize = "0.85rem";
      improveBtn.onclick = async () => {
        improveBtn.disabled = true;
        improveBtn.textContent = "Improving...";

        try {
          const improveRes = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category,
              topic,
              tone,
              mode: "improve",
              original: text,
              addHashtags,
              addEmojis,
              length,
              language
            })
          });

          const improved = await improveRes.json();
          if (improved.output) {
            const improvedBox = document.createElement("div");
            improvedBox.className = "prompt-box";
            improvedBox.style.backgroundColor = "#e0f7fa";
            improvedBox.style.border = "1px dashed var(--primary-color)";
            improvedBox.style.marginTop = "1rem";
            improvedBox.textContent = improved.output;
            box.appendChild(improvedBox);
          } else {
            alert("Improvement failed.");
          }
        } catch (e) {
          alert("Improvement failed. Check console.");
          console.error(e);
        }

        improveBtn.disabled = false;
        improveBtn.textContent = "Improve This";
      };

      // Assemble and add to DOM
      box.appendChild(numberLabel);
      box.appendChild(contentDiv);
      box.appendChild(copyBtn);
      box.appendChild(improveBtn);
      output.appendChild(box);
    });

  } catch (err) {
    console.error("Fetch error:", err);
    output.innerHTML = `<div class="prompt-box">❌ Network error. Check console for details.</div>`;
  }
}
