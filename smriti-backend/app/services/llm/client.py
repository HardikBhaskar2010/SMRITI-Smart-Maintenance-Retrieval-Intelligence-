"""
SMRITI LLM Client — OpenRouter two-model routing strategy.

Routing:
  .extract()  → cohere/north-mini-code:free  (JSON extraction, 707ms, 89 t/s)
  .query()    → meta-llama/llama-3.3-70b-instruct:free  (RAG + Guru, Hinglish)
               ↳ auto-fallback → poolside/laguna-xs2:free  on HTTP 429
"""
import asyncio
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class RateLimitError(Exception):
    """Raised when OpenRouter returns HTTP 429 for a specific model."""


class LLMClient:
    def __init__(self):
        self.base_url = settings.OPENROUTER_BASE_URL
        self.api_key = settings.OPENROUTER_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://smriti.local",
            "X-Title": "SMRITI",
        }

    # ── Public methods ────────────────────────────────────────────────

    async def extract(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 2048,
        retries: int = 2,
    ) -> str:
        """
        Use the extraction model (Cohere North Mini Code) for tag extraction.
        Code-trained → strongest JSON-only instruction adherence.
        """
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
        Use the query model (Llama 3.3 70B) for RAG synthesis + Guru Mode.
        Automatically falls back to Laguna XS.2 on rate-limit (HTTP 429).
        """
        try:
            return await self._complete(
                model=settings.QUERY_MODEL,
                system_prompt=system_prompt,
                user_message=user_message,
                max_tokens=max_tokens,
                retries=retries,
            )
        except RateLimitError:
            logger.warning(
                "Rate limit on %s — falling back to %s",
                settings.QUERY_MODEL,
                settings.QUERY_FALLBACK_MODEL,
            )
            return await self._complete(
                model=settings.QUERY_FALLBACK_MODEL,
                system_prompt=system_prompt,
                user_message=user_message,
                max_tokens=max_tokens,
                retries=1,
            )

    # ── Core completion ───────────────────────────────────────────────

    async def _complete(
        self,
        model: str,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 2048,
        retries: int = 2,
    ) -> str:
        """
        OpenAI-compatible chat completions call via OpenRouter.
        Supports all three model tiers (Cohere, Llama 3.3, Laguna XS.2).
        """
        payload = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
        }

        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=self.headers,
                        json=payload,
                    )

                    if response.status_code == 429:
                        raise RateLimitError(f"Rate limited on model: {model}")

                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]

            except RateLimitError:
                raise  # Propagate immediately — handled by query() fallback

            except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
                if attempt == retries:
                    raise RuntimeError(
                        f"LLM API failed after {retries} retries (model={model}): {e}"
                    )
                wait = 2 ** attempt  # Exponential backoff: 1s → 2s
                logger.warning("LLM call failed (attempt %d/%d), retrying in %ds", attempt + 1, retries + 1, wait)
                await asyncio.sleep(wait)


# Alias so existing imports of ClaudeClient still work
ClaudeClient = LLMClient
