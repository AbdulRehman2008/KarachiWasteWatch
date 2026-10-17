"""
Universal LLM Client for Generative RAG in Karachi WasteWatch AI
Supports:
1. Google Gemini (GEMINI_API_KEY / GOOGLE_API_KEY) via REST API
2. Groq Cloud (GROQ_API_KEY) via REST API (Llama-3.3-70b / Llama-3.1-8b)
3. OpenAI (OPENAI_API_KEY) via REST API (gpt-4o-mini)
Falls back smoothly if no API key is configured.
"""

import os
from typing import Optional, Dict, Any
import requests


def get_configured_provider() -> Optional[str]:
    """Detect which LLM API key is present in environment."""
    if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
        return "gemini"
    if os.getenv("GROQ_API_KEY"):
        return "groq"
    if os.getenv("OPENAI_API_KEY"):
        return "openai"
    return None


def call_gemini(prompt: str, system_instruction: str, api_key: str) -> Optional[str]:
    """Call Google Gemini REST API (gemini-1.5-flash)."""
    # Candidate models in priority order
    urls = [
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={api_key}",
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={api_key}",
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={api_key}",
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}",
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}",
    ]

    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 600,
        }
    }

    for url in urls:
        try:
            resp = requests.post(url, json=payload, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        except Exception:
            continue
    return None


def call_groq(prompt: str, system_instruction: str, api_key: str) -> Optional[str]:
    """Call Groq REST API (llama-3.3-70b-versatile)."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 600,
    }

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "").strip()
    except Exception:
        pass
    return None


def call_openai(prompt: str, system_instruction: str, api_key: str) -> Optional[str]:
    """Call OpenAI REST API (gpt-4o-mini)."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 600,
    }

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "").strip()
    except Exception:
        pass
    return None


def generate_rag_llm_response(prompt: str, system_instruction: str) -> Optional[Dict[str, Any]]:
    """
    Attempt to generate response using any configured LLM provider.
    Returns dict with generated answer and provider name, or None if unavailable.
    """
    provider = get_configured_provider()
    if not provider:
        return None

    answer = None
    if provider == "gemini":
        key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        answer = call_gemini(prompt, system_instruction, key)
    elif provider == "groq":
        key = os.getenv("GROQ_API_KEY")
        answer = call_groq(prompt, system_instruction, key)
    elif provider == "openai":
        key = os.getenv("OPENAI_API_KEY")
        answer = call_openai(prompt, system_instruction, key)

    if answer:
        return {
            "answer": answer,
            "provider": provider,
            "is_generative": True,
        }
    return None
