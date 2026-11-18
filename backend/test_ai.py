
import os
from dotenv import load_dotenv
from openai import OpenAI

# Read the secret key from .env
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("ERROR: API key not found. Check your .env file.")
    raise SystemExit(1)

# Connect to OpenAI
client = OpenAI(api_key=api_key)

print("Connecting to LabelLens AI...")

# Ask AI a simple question
response = client.responses.create(
    model="gpt-4.1-mini",
    input="Explain what sugar does in biscuits in simple language. Use only 2 sentences."
)

print("\nLabelLens AI says:")
print(response.output_text)
