# 🍎 LabelLens – AI Food Intelligence Assistant

LabelLens is an AI-powered application that helps users understand food labels, restaurant menus, and homemade recipes through nutritional analysis and AI-driven insights.

## ✨ Features

- **Food Label Analysis:** Extracts and analyzes ingredients and nutrition from packaged food labels using OCR.
- **Menu Analysis:** Analyzes restaurant menus to provide food-related insights.
- **Recipe Analysis:** Evaluates homemade recipes and their ingredients.
- **Blood Sugar Awareness:** Provides insights on blood sugar, serving size, and better alternatives.
- **AI Food Assistant:** Answers food and nutrition-related questions through an interactive chatbot.

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, Flask
- **AI:** Ollama, Qwen 2.5 (3B)
- **OCR:** Tesseract, Pytesseract
- **Image Processing:** Pillow

## 🚀 Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/vaishnavis968/LabelLens.git
cd LabelLens
```

**2. Create and activate a virtual environment**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

**3. Install dependencies**

```bash
pip install flask requests pillow pytesseract
```

**4. Set up the AI model**

```bash
ollama pull qwen2.5:3b
```

**5. Run the backend**

```bash
cd backend
python app.py
```

Open `frontend/index.html` using VS Code Live Server.

## 🎯 Objective

To make food and nutritional information easier to understand through AI-powered analysis, helping users make more informed food choices.

## 👩‍💻 Developer

**Vaishnavi S**

[GitHub Profile](https://github.com/vaishnavis968)

*Note: LabelLens is an educational prototype. Its nutritional and blood sugar insights are informational, not medical advice.*
