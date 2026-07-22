"""
SMRITI LLM Client — Phase 2 Upgrade.

Routing strategy:
  .extract()  → google/gemini-flash-1.5-8b:free  (JSON extraction, low latency)
  .query()    → google/gemini-2.0-flash-exp:free  (RAG + Guru, 1M ctx, multilingual)
                ↳ fallback1 → meta-llama/llama-3.3-70b-instruct:free
                ↳ fallback2 → poolside/laguna-xs2:free
  .stream()   → Gemini Flash with SSE token streaming
"""
import asyncio
import logging
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class RateLimitError(Exception):
    """Raised when OpenRouter returns HTTP 429 for a specific model."""


class LLMClient:
    def __init__(self) -> None:
        self.base_url = settings.OPENROUTER_BASE_URL
        self.api_key = settings.OPENROUTER_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://smriti.ai",
            "X-Title": "SMRITI Phase 2",
        }

    # ── Public methods ────────────────────────────────────────────────

    async def extract(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 2048,
        retries: int = 2,
    ) -> str:
        """Use extraction model (Gemini Flash 8B) for JSON-structured output."""
        return await self._complete(
            model=settings.EXTRACTION_MODEL,
            system_prompt=system_prompt,
            user_message=user_message,
            max_tokens=max_tokens,
            retries=retries,
        )

    async def query(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 4096,
        retries: int = 2,
    ) -> str:
        """
        Use Gemini 2.0 Flash for RAG synthesis + Guru Mode.
        Auto-falls back to Llama 3.3 → Laguna XS.2 on rate limits.
        """
        models = [
            settings.QUERY_MODEL,
            settings.QUERY_FALLBACK_MODEL,
            settings.QUERY_FALLBACK_2_MODEL,
        ]
        last_err: Exception | None = None
        for model in models:
            try:
                return await self._complete(
                    model=model,
                    system_prompt=system_prompt,
                    user_message=user_message,
                    max_tokens=max_tokens,
                    retries=retries if model == models[0] else 1,
                )
            except RateLimitError as e:
                logger.warning("Rate limit on %s — trying next model", model)
                last_err = e
                continue
        raise RuntimeError(f"All LLM models exhausted: {last_err}")

    async def stream(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        """
        Streaming version of query() — yields text tokens as they arrive.
        Uses Server-Sent Events (SSE) via OpenRouter streaming API.
        Falls back to non-streaming if streaming fails.
        """
        payload: dict[str, Any] = {
            "model": settings.QUERY_MODEL,
            "max_tokens": max_tokens,
            "stream": True,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
        }
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload,
                ) as response:
                    if response.status_code == 429:
                        raise RateLimitError("Rate limited on streaming model")
                    response.raise_for_status()

                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            import json
                            data = json.loads(data_str)
                            delta = data["choices"][0]["delta"]
                            token = delta.get("content", "")
                            if token:
                                yield token
                        except (KeyError, json.JSONDecodeError):
                            continue
        except (RateLimitError, httpx.HTTPStatusError):
            # Graceful degradation: fall back to non-streaming
            logger.warning("Streaming failed — falling back to non-streaming query")
            full_response = await self.query(system_prompt, user_message, max_tokens)
            # Yield in chunks to simulate streaming
            chunk_size = 8
            for i in range(0, len(full_response), chunk_size):
                yield full_response[i : i + chunk_size]
                await asyncio.sleep(0.02)

    # ── Core completion ───────────────────────────────────────────────

    async def _complete(
        self,
        model: str,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 2048,
        retries: int = 2,
    ) -> str:
        payload: dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
        }

        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(timeout=90.0) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=self.headers,
                        json=payload,
                    )
                    if response.status_code == 429:
                        raise RateLimitError(f"Rate limited: {model}")
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]

            except RateLimitError:
                raise
            except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
                if attempt == retries:
                    raise RuntimeError(
                        f"LLM API failed after {retries} retries (model={model}): {e}"
                    )
                wait = 2 ** attempt
                logger.warning(
                    "LLM call failed (attempt %d/%d), retrying in %ds",
                    attempt + 1, retries + 1, wait,
                )
                await asyncio.sleep(wait)

        raise RuntimeError("Unreachable")


# Backward-compat aliases
ClaudeClient = LLMClient
