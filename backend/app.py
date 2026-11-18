
import io
import json

import ollama
import pytesseract

from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, ImageOps


app = Flask(__name__)
CORS(app)

app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024

# Local AI model running through Ollama
AI_MODEL = "qwen2.5:3b"


def load_products():
    """Load products from the local JSON database."""

    try:
        with open("products.json", "r", encoding="utf-8") as file:
            return json.load(file)

    except (FileNotFoundError, json.JSONDecodeError) as error:
        print("Product database error:", error)
        return []


def find_alternatives(category, original_price, original_sugar):
    """Find verified products with lower added sugar and similar pricing."""

    products = load_products()
    alternatives = []

    if original_price is None or original_sugar is None:
        return alternatives

    if original_price <= 0:
        return alternatives

    for product in products:
        if not product.get("verified", False):
            continue

        if product.get("category", "").lower() != category.lower():
            continue

        price = product.get("price_inr")
        sugar = product.get("added_sugar_per_100g")

        if price is None or sugar is None:
            continue

        similar_price = (
            abs(price - original_price) / original_price <= 0.10
        )

        if similar_price and sugar < original_sugar:
            alternatives.append(product)

    return alternatives


def analyse_with_ai(mode, food_text):
    """Use Ollama to explain food information."""

    instructions = """
You are LabelLens, a simple and friendly food information assistant.

Your job is to help people understand food labels without overwhelming them.

STRICT RULES:

1. Use very simple everyday English.
2. Keep the entire answer short and easy to scan.
3. Use short bullet points, not long paragraphs.
4. Explain only information supported by the provided food details.
5. Never invent ingredient meanings, nutrition values or health claims.
6. If an ingredient is unclear, say "Information not verified."
7. Explain why identifiable ingredients are commonly used.
8. Do not call food healthy or unhealthy.
9. Do not diagnose medical conditions.
10. Do not assume natural flavouring reveals its exact ingredients.
11. Never describe zero as low or low as zero.
12. Always mention the serving size when discussing nutrition.
13. Do not repeat the same information in multiple sections.
14. Do not invent research, statistics or sources.

FORMAT YOUR ANSWER EXACTLY LIKE THIS:

## Food overview
Give only 1-2 short sentences describing the food.

## Ingredients
Explain each identifiable ingredient in one short bullet.
Mention its common purpose.
Mark uncertain ingredients as unverified.

## Nutrition
Show available nutrition values in a compact bullet list.
Always mention the stated serving size.
Briefly explain only the most relevant values.

## Things to notice
Give a maximum of 3 useful points.
Do not exaggerate health concerns.

## Blood Sugar Awareness

Give exactly 5 concise bullet points, one line each:

- Blood Sugar: Explain the sugar quantity and its potential impact on blood glucose.
- Prediabetes: Explain why the sugar and carbohydrate content may deserve attention.
- Diabetes: Explain why the carbohydrate quantity may matter when managing blood glucose.
- Serving Size: Show the actual sugar consumed per stated serving, calculating only when the label provides enough information.
- Better Alternatives: Suggest one practical option with less added sugar, if appropriate.

IMPORTANT:
- Keep each point to one short sentence.
- Use actual label values and serving sizes.
- Never invent missing nutrition values.
- Do not prescribe personal sugar limits or medical advice.
- If information is unavailable, say so briefly.

## Quick takeaway
Give a simple summary in no more than 2 sentences.

IMPORTANT:
- Maximum 250 words.
- No long paragraphs.
- No unnecessary technical terms.
- Do not repeat nutrition values unnecessarily.
- Be clear, balanced and honest.
"""

    mode_instructions = {
        "packaged": "Analyse this packaged food label.",
        "restaurant": "Explain this restaurant menu and its listed ingredients.",
        "homemade": "Analyse this homemade recipe and its ingredients."
    }

    response = ollama.chat(
        model=AI_MODEL,
        messages=[
            {
                "role": "system",
                "content": instructions
            },
            {
                "role": "user",
                "content": (
                    mode_instructions[mode]
                    + "\n\nFood information:\n"
                    + food_text
                )
            }
        ]
    )

    return response["message"]["content"]


def extract_text_from_image(image_file):
    """Read text from an uploaded image using OCR."""

    image_bytes = image_file.read()

    image = Image.open(io.BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image)
    image = image.convert("RGB")

    return pytesseract.image_to_string(
        image,
        config="--psm 3"
    ).strip()


@app.route("/")
def home():
    return jsonify({
        "project": "LabelLens",
        "status": "running",
        "ai": "Ollama"
    })


# GET ALL PRODUCTS
@app.route("/api/products", methods=["GET"])
def get_products():

    products = load_products()

    return jsonify({
        "status": "success",
        "count": len(products),
        "products": products
    })


# FIND ALTERNATIVE PRODUCTS
@app.route("/api/alternatives", methods=["POST"])
def get_alternatives():

    data = request.get_json(silent=True) or {}

    category = data.get("category")
    price = data.get("price_inr")
    sugar = data.get("added_sugar_per_100g")

    if not category or price is None or sugar is None:
        return jsonify({
            "status": "error",
            "message": "Category, price and added sugar are required."
        }), 400

    try:
        price = float(price)
        sugar = float(sugar)

        if price <= 0 or sugar < 0:
            raise ValueError("Invalid price or sugar value.")

    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Please provide valid price and sugar values."
        }), 400

    alternatives = find_alternatives(category, price, sugar)

    return jsonify({
        "status": "success",
        "count": len(alternatives),
        "alternatives": alternatives
    })


# AI CHATBOT
@app.route("/api/chat", methods=["POST"])
def chat():

    data = request.get_json(silent=True) or {}

    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({
            "error": "Please enter a message."
        }), 400

    system_prompt = """
You are LabelLens, a friendly food assistant who explains things
so simply that even a school student can understand.

YOUR STYLE:
- Keep answers between 2 and 4 short sentences.
- Use a maximum of 3 bullet points.
- Avoid repeating information.
- Give only the most important details.
- Keep answers under 60 words unless more detail is requested.
- Speak like a friendly teacher.
- Use simple everyday English.
- Explain things as if talking to a 12-year-old.
- Keep sentences short.
- Avoid difficult scientific and medical words.
- Use a simple example when it helps.
- Use 3 to 5 short bullet points when useful.
- Answer the question directly.
- Do not give long paragraphs or unnecessary information.

FOOD AND HEALTH RULES:
- Explain ingredients and nutrition in simple words.
- Never make up nutrition values.
- Do not call food completely healthy or unhealthy.
- Do not diagnose medical conditions.
- Do not give personal medical advice or personal sugar limits.
- If information is missing, say so honestly.
- For personal medical or dietary advice, suggest asking a qualified healthcare professional.

EXAMPLE:

Question: What is added sugar?

Answer:
Added sugar is extra sugar put into food when it is made.

For example:
- Sugar added to biscuits.
- Sugar added to soft drinks.
- Sugar added to some packaged snacks.

Some foods, like fruits, also have natural sugar.

Keep every answer SIMPLE, SHORT, FRIENDLY
AND EASY FOR SCHOOL STUDENTS TO UNDERSTAND.
"""

    try:
        response = ollama.chat(
            model=AI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
        )

        reply = response["message"]["content"]

        return jsonify({
            "status": "success",
            "reply": reply
        })

    except Exception as error:
        print("Chatbot error:", error)

        return jsonify({
            "error": "Chatbot could not respond. Please check that Ollama is running."
        }), 500


# AI HEALTH CHECK
@app.route("/health")
def health():

    return jsonify({
        "status": "healthy",
        "ai": "Ollama",
        "model": AI_MODEL
    })


# FOOD ANALYSIS
@app.route("/api/analyze", methods=["POST"])
def analyze():

    mode = request.form.get("mode")

    if mode not in ["packaged", "restaurant", "homemade"]:
        return jsonify({
            "error": "Invalid analysis mode."
        }), 400

    food_text = ""

    # PACKAGED FOOD
    if mode == "packaged":

        food_text = request.form.get(
            "label_text", ""
        ).strip()

        if not food_text:

            image_file = request.files.get("image")

            if not image_file:
                return jsonify({
                    "error": "Please upload a food label image or paste label text."
                }), 400

            try:
                food_text = extract_text_from_image(image_file)

            except Exception as error:
                print("Packaged food OCR error:", error)

                return jsonify({
                    "error": "Unable to read this food label image."
                }), 400

    # RESTAURANT MENU
    elif mode == "restaurant":

        image_file = request.files.get("image")

        if not image_file:
            return jsonify({
                "error": "Please upload a restaurant menu image."
            }), 400

        try:
            food_text = extract_text_from_image(image_file)

        except Exception as error:
            print("Restaurant OCR error:", error)

            return jsonify({
                "error": "Unable to read this restaurant menu."
            }), 400

    # HOMEMADE RECIPE
    elif mode == "homemade":

        recipe = request.form.get(
            "recipe", ""
        ).strip()

        ingredients = request.form.get(
            "ingredients", ""
        ).strip()

        if not recipe or not ingredients:
            return jsonify({
                "error": "Please enter the recipe name and ingredients."
            }), 400

        food_text = (
            "Recipe name: " + recipe
            + "\nIngredients: " + ingredients
        )

    if not food_text:
        return jsonify({
            "error": "No readable food information was found."
        }), 422

    # SEND INFORMATION TO LOCAL AI
    try:
        ai_analysis = analyse_with_ai(mode, food_text)

        return jsonify({
            "status": "success",
            "mode": mode,
            "extracted_text": food_text,
            "ai_analysis": ai_analysis,
            "message": "Your food information has been analysed by LabelLens AI!"
        })

    except Exception as error:
        print("AI analysis error:", error)

        return jsonify({
            "error": "Local AI analysis failed. Please check that Ollama is running."
        }), 500


# FILE SIZE ERROR HANDLER
@app.errorhandler(413)
def file_too_large(error):

    return jsonify({
        "error": "Image is too large. Maximum allowed size is 8 MB."
    }), 413


if __name__ == "__main__":
    app.run(debug=True, port=5000)
