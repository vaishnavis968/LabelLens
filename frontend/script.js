
const tabs = document.querySelectorAll(".tab");
const sections = document.querySelectorAll(".mode-section");

let currentMode = "packaged";

// Switch between analysis modes
tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        currentMode = tab.dataset.mode;

        tabs.forEach((item) => item.classList.remove("active"));
        tab.classList.add("active");

        sections.forEach((section) => section.classList.add("hidden"));

        document
            .getElementById(`${currentMode}-section`)
            .classList.remove("hidden");

        document.getElementById("empty-state").classList.remove("hidden");
        document.getElementById("results-content").classList.add("hidden");

        document.getElementById("analysis-status").textContent =
            "Awaiting input";
    });
});

// Display selected image filenames
function setupFileInput(inputId, nameId) {
    const input = document.getElementById(inputId);
    const name = document.getElementById(nameId);

    input.addEventListener("change", () => {
        name.textContent = input.files[0]
            ? input.files[0].name
            : "PNG, JPG or JPEG";
    });
}

setupFileInput("packaged-file", "packaged-name");
setupFileInput("restaurant-file", "restaurant-name");

// Clean AI response formatting
function cleanText(text) {
    return text
        .replace(/\*\*/g, "")
        .replace(/^[-*•]\s*/, "")
        .trim();
}

// Split AI response into sections
function parseAIResponse(response) {
    const result = {
        overview: [],
        ingredients: [],
        nutrition: [],
        bloodSugar: [],
        notices: [],
        takeaway: []
    };

    let currentSection = "";

    response.split("\n").forEach((line) => {
        const heading = line
            .replace(/^#+\s*/, "")
            .replace(/:$/, "")
            .trim()
            .toLowerCase();

        if (heading.includes("food overview") ||
            heading.includes("understanding this food")) {
            currentSection = "overview";
            return;
        }

        if (heading === "ingredients" ||
            heading.includes("understanding the ingredients")) {
            currentSection = "ingredients";
            return;
        }

        if (heading === "nutrition" ||
            heading.includes("nutrition breakdown") ||
            heading.includes("understanding the nutrition")) {
            currentSection = "nutrition";
            return;
        }

        if (heading.includes("blood sugar awareness") ||
            heading.includes("blood sugar insights")) {
            currentSection = "bloodSugar";
            return;
        }

        if (heading.includes("things to notice")) {
            currentSection = "notices";
            return;
        }

        if (heading.includes("quick takeaway") ||
            heading.includes("final takeaway")) {
            currentSection = "takeaway";
            return;
        }

        const cleaned = cleanText(line);

        if (cleaned && currentSection) {
            result[currentSection].push(cleaned);
        }
    });

    return result;
}

// Create a safe text element
function createElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

// Display food overview
function displayOverview(items) {
    const overview = document.getElementById("result-description");

    overview.textContent = items.length
        ? items.join(" ")
        : "Your food analysis is ready.";
}

// Display ingredients as separate items
function displayIngredients(items) {
    const container = document.getElementById("ingredient-results");
    container.replaceChildren();

    if (!items.length) {
        container.appendChild(
            createElement("p", "ingredient-description",
                "No ingredient information was returned.")
        );
        return;
    }

    items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "ingredient-item";

        const separator = item.indexOf(":");
        const name = separator > -1
            ? item.slice(0, separator).trim()
            : "Ingredient";

        const description = separator > -1
            ? item.slice(separator + 1).trim()
            : item;

        card.appendChild(
            createElement("h5", "ingredient-name", name)
        );

        card.appendChild(
            createElement("p", "ingredient-description", description)
        );

        container.appendChild(card);
    });
}

// Display nutrition information
function displayNutrition(items) {
    const container = document.getElementById("nutrition-results");
    container.replaceChildren();

    if (!items.length) {
        container.appendChild(
            createElement("p", "nutrition-note",
                "No nutrition information was returned.")
        );
        return;
    }

    items.forEach((item) => {
        const separator = item.indexOf(":");

        const label = separator > -1
            ? item.slice(0, separator).trim()
            : "Information";

        const value = separator > -1
            ? item.slice(separator + 1).trim()
            : item;

        const row = document.createElement("div");
        row.className = "nutrition-row";

        row.appendChild(
            createElement("span", "nutrition-label", label)
        );

        row.appendChild(
            createElement("span", "nutrition-value", value)
        );

        container.appendChild(row);
    });
}

// Display nutrition highlights
function displayNutritionHighlights(items) {
    const container = document.getElementById("nutrition-highlights");
    container.replaceChildren();

    const keywords = ["energy", "calories", "total sugars", "added sugars"];

    const highlights = items.filter((item) =>
        keywords.some((keyword) =>
            item.toLowerCase().startsWith(keyword + ":")
        )
    );

    highlights.slice(0, 3).forEach((item) => {
        const separator = item.indexOf(":");

        const label = item.slice(0, separator).trim();
        const value = item.slice(separator + 1).trim();

        const card = document.createElement("div");
        card.className = "highlight-card";

        card.appendChild(
            createElement("span", "highlight-label", label)
        );

        card.appendChild(
            createElement("strong", "highlight-value", value)
        );

        container.appendChild(card);
    });
}

// Display things to notice
function displayNotices(items) {
    const container = document.getElementById("notice-results");
    container.replaceChildren();

    if (!items.length) {
        container.appendChild(
            createElement("p", "notice-description",
                "No additional points to highlight.")
        );
        return;
    }

    items.slice(0, 3).forEach((item) => {
        const notice = document.createElement("div");
        notice.className = "notice-item";

        notice.appendChild(
            createElement("span", "notice-icon", "•")
        );

        notice.appendChild(
            createElement("p", "notice-description", item)
        );

        container.appendChild(notice);
    });
}

// Display blood sugar insights
function displayBloodSugar(items) {
    const container = document.getElementById("blood-sugar-results");
    container.replaceChildren();

    if (!items.length) {
        container.appendChild(
            createElement(
                "p",
                "notice-description",
                "Blood sugar insights are unavailable for this label."
            )
        );
        return;
    }

    items.slice(0, 5).forEach((item) => {
        const row = document.createElement("div");
        row.className = "blood-sugar-item";
        row.textContent = item;
        container.appendChild(row);
    });
}

// Display quick takeaway
function displayTakeaway(items) {
    document.getElementById("takeaway-result").textContent =
        items.length
            ? items.join(" ")
            : "Your food analysis is complete.";
}

// Display all result cards
function displayAnalysis(response) {
    const parsed = parseAIResponse(response);

    document.getElementById("empty-state").classList.add("hidden");
    document.getElementById("results-content").classList.remove("hidden");

    document.getElementById("result-text").textContent = response;

    displayOverview(parsed.overview);
    displayIngredients(parsed.ingredients);
    displayNutrition(parsed.nutrition);
    displayBloodSugar(parsed.bloodSugar);
    displayNotices(parsed.notices);
    displayTakeaway(parsed.takeaway);
}

// Analyse button
document.getElementById("analyse-btn").addEventListener("click", async () => {
    const button = document.getElementById("analyse-btn");
    const status = document.getElementById("analysis-status");

    const formData = new FormData();
    formData.append("mode", currentMode);

    if (currentMode === "packaged") {
        const image = document.getElementById("packaged-file").files[0];
        const pastedText = document.getElementById("packaged-text").value.trim();

        if (image) {
            formData.append("image", image);
        } else if (pastedText) {
            formData.append("label_text", pastedText);
        } else {
            alert("Please upload a food label image or paste label text first.");
            return;
        }
    }

    if (currentMode === "restaurant") {
        const image = document.getElementById("restaurant-file").files[0];

        if (!image) {
            alert("Please upload a restaurant menu image first.");
            return;
        }

        formData.append("image", image);
    }

    if (currentMode === "homemade") {
        const recipe = document.getElementById("recipe-name").value.trim();
        const ingredients = document.getElementById("ingredients").value.trim();

        if (!recipe || !ingredients) {
            alert("Please enter your recipe name and ingredients.");
            return;
        }

        formData.append("recipe", recipe);
        formData.append("ingredients", ingredients);
    }

    button.disabled = true;
    button.textContent = "Processing...";
    status.textContent = "Analysing...";

    try {
        const response = await fetch(
            "http://127.0.0.1:5000/api/analyze",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Analysis failed");
        }

        const aiResponse =
            data.ai_analysis ||
            data.extracted_text ||
            data.label_text ||
            data.ingredients ||
            "";

        if (!aiResponse.trim()) {
            throw new Error("No analysis information was returned.");
        }

        document.getElementById("result-title").textContent =
            data.recipe ||
            (currentMode === "restaurant"
                ? "Restaurant Menu Analysis"
                : currentMode === "homemade"
                    ? "Homemade Food Analysis"
                    : "Packaged Food Analysis");

        displayAnalysis(aiResponse);

        status.textContent = "Analysis completed";

    } catch (error) {
        console.error("Analysis error:", error);
        status.textContent = "Analysis failed";
        alert(error.message);

    } finally {
        button.disabled = false;
        button.textContent = "✨ Analyse with AI";
    }
});

// Chat interface connected to the Flask + Ollama backend
async function sendMessage() {
    const input = document.getElementById("chat-input");
    const messages = document.getElementById("chat-messages");
    const sendButton = document.getElementById("send-btn");

    const message = input.value.trim();
    if (!message) return;

    // Show the user's message immediately.
    const userMessage = document.createElement("div");
    userMessage.className = "user-message";
    userMessage.textContent = message;
    messages.appendChild(userMessage);

    input.value = "";
    input.disabled = true;
    sendButton.disabled = true;

    // Temporary loading bubble.
    const botMessage = document.createElement("div");
    botMessage.className = "bot-message";
    botMessage.textContent = "Thinking...";
    messages.appendChild(botMessage);
    messages.scrollTop = messages.scrollHeight;

    try {
        const response = await fetch("http://127.0.0.1:5000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: message })
        });

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error("The server returned an invalid response.");
        }

        if (!response.ok) {
            throw new Error(data.error || "The chatbot request failed.");
        }

        const reply =
            data.reply ||
            data.response ||
            data.answer ||
            "";

        if (!reply.trim()) {
            throw new Error("The AI returned an empty response.");
        }

        botMessage.textContent = reply;

    } catch (error) {
        console.error("Chatbot error:", error);
        botMessage.textContent =
            "Sorry, I couldn't connect to the AI right now. Make sure the Flask server and Ollama are running, then try again.";
    } finally {
        input.disabled = false;
        sendButton.disabled = false;
        input.focus();
        messages.scrollTop = messages.scrollHeight;
    }
}

document.getElementById("send-btn").addEventListener("click", sendMessage);

document.getElementById("chat-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});
