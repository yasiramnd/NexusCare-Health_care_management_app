import os
import requests
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Configuration
LLM_BACKEND = os.getenv("LLM_BACKEND", "gemini").lower()

# Gemini Config
api_key = os.getenv("GOOGLE_API_KEY")
gemini_client = genai.Client(api_key=api_key) if api_key else None

# Ollama Config
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:4b")

def generate_chat_response(system_prompt: str, user_prompt: str) -> str:
    if LLM_BACKEND == "ollama":
        return _generate_ollama_response(system_prompt, user_prompt)
    else:
        return _generate_gemini_response(system_prompt, user_prompt)

def _generate_gemini_response(system_prompt: str, user_prompt: str) -> str:
    if not gemini_client:
        return "Error: GOOGLE_API_KEY not configured in .env file."
    
    try:
        combined_prompt = f"{system_prompt}\n\nUser: {user_prompt}"
        response = gemini_client.models.generate_content(
            model="gemini-flash-latest",
            contents=combined_prompt
        )
        return response.text.strip()
    except Exception as e:
        return f"Error generating Gemini response: {str(e)}"

def _generate_ollama_response(system_prompt: str, user_prompt: str) -> str:
    url = f"{OLLAMA_BASE_URL}/api/chat"
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False
    }
    
    try:
        response = requests.post(url, json=payload, timeout=90)
        response.raise_for_status()
        data = response.json()
        return data.get("message", {}).get("content", "").strip()
    except Exception as e:
        return f"Error generating Ollama response: {str(e)}"