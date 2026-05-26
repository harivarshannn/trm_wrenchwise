"""LLM-based technical skills refinement using Groq."""

from __future__ import annotations

import json
import re
from typing import List

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.utils.logger import get_logger


class SkillsLLMService:
    """Refine skills list using a Groq-hosted LLM."""

    def __init__(
        self,
        api_key: str,
        model: str,
        request_timeout: int,
        request_retries: int,
        request_backoff_factor: float,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._endpoint = "https://api.groq.com/openai/v1/chat/completions"
        self._timeout = request_timeout
        self._logger = get_logger(self.__class__.__name__)

        self._session = requests.Session()
        retry = Retry(
            total=request_retries,
            read=request_retries,
            connect=request_retries,
            backoff_factor=request_backoff_factor,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=frozenset(["POST"]),
        )
        adapter = HTTPAdapter(max_retries=retry)
        self._session.mount("https://", adapter)

    def close(self) -> None:
        """Close the underlying HTTP session."""
        self._session.close()

    def refine_skills(self, raw_lines: List[str]) -> List[str]:
        """Call the LLM to return only technical skills as a JSON array."""
        if not raw_lines:
            return []

        prompt = self._build_prompt(raw_lines)
        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You extract only technical skills from resume text. "
                        "Return a JSON array of skill strings only. "
                        "Exclude project titles, sentences, responsibilities, and soft skills."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 300,
        }

        response = self._session.post(
            self._endpoint,
            headers={"Authorization": f"Bearer {self._api_key}"},
            json=payload,
            timeout=self._timeout,
        )
        if response.status_code != 200:
            self._logger.error("Groq skills request failed: %s", response.text)
            raise RuntimeError("Groq skills request failed.")

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return self._normalize_skills(self._parse_json_array(content))

    def refine_certifications(self, raw_lines: List[str]) -> List[str]:
        """Call the LLM to return certification names in the same order."""
        if not raw_lines:
            return []

        prompt = self._build_certifications_prompt(raw_lines)
        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You extract only certification/license names from resume text. "
                        "Return a JSON array of certification names in the same order as listed. "
                        "Exclude dates, issuers, scores, and sentences."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.1,
            "max_tokens": 200,
        }

        response = self._session.post(
            self._endpoint,
            headers={"Authorization": f"Bearer {self._api_key}"},
            json=payload,
            timeout=self._timeout,
        )
        if response.status_code != 200:
            self._logger.error("Groq certifications request failed: %s", response.text)
            raise RuntimeError("Groq certifications request failed.")

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return self._normalize_certifications(self._parse_json_array(content))

    @staticmethod
    def _build_prompt(raw_lines: List[str]) -> str:
        joined = "\n".join(raw_lines)
        return f"Skills section:\n{joined}\n\nReturn JSON array only."

    @staticmethod
    def _build_certifications_prompt(raw_lines: List[str]) -> str:
        joined = "\n".join(raw_lines)
        return f"Certifications section:\n{joined}\n\nReturn JSON array only."

    @staticmethod
    def _parse_json_array(content: str) -> List[str]:
        cleaned = content.strip()
        cleaned = re.sub(r"^```json", "", cleaned, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r"^```", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Invalid JSON returned by LLM.") from exc
        if not isinstance(parsed, list):
            raise RuntimeError("LLM response is not a JSON array.")
        return [str(item) for item in parsed if isinstance(item, (str, int, float))]

    @staticmethod
    def _normalize_skills(skills: List[str]) -> List[str]:
        cleaned_items: List[str] = []
        for skill in skills:
            item = re.sub(r"\s+", " ", str(skill)).strip()
            if not item:
                continue
            if len(item) > 40 or len(item.split()) > 4:
                continue
            cleaned_items.append(item)

        seen = set()
        unique: List[str] = []
        for item in cleaned_items:
            key = item.lower()
            if key in seen:
                continue
            seen.add(key)
            unique.append(item)
        return unique

    @staticmethod
    def _normalize_certifications(items: List[str]) -> List[str]:
        cleaned_items: List[str] = []
        for item in items:
            value = re.sub(r"\s+", " ", str(item)).strip()
            if not value:
                continue
            if len(value) > 80:
                continue
            cleaned_items.append(value)

        seen = set()
        unique: List[str] = []
        for value in cleaned_items:
            key = value.lower()
            if key in seen:
                continue
            seen.add(key)
            unique.append(value)
        return unique
