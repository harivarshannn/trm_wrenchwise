"""Groq LLM-based resume parser service."""

from __future__ import annotations

import json
from typing import Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app.models.resume import ParsedResume, ExperienceItem, EducationItem
from app.utils.logger import get_logger


class GroqResumeParser:
    """Parses raw resume text into structured fields using Groq LLM."""

    def __init__(
        self,
        api_key: str,
        model: str = "llama-3.3-70b-versatile",
        timeout: int = 30,
        request_retries: int = 3,
        request_backoff_factor: float = 0.5,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._endpoint = "https://api.groq.com/openai/v1/chat/completions"
        self._timeout = timeout
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

    def parse(self, text: str) -> ParsedResume:
        """Call Groq to parse resume text into a structured ParsedResume object."""
        if not text or not text.strip():
            self._logger.warning("Received empty text for Groq resume parsing.")
            return ParsedResume()

        prompt = f"""
You are an expert AI resume parsing system. Your task is to extract high-fidelity structured data from the following raw resume text and return a JSON object that adheres precisely to the schema below.

Target JSON Schema:
{{
  "name": "Full name of the candidate (string or null)",
  "email": "Email address (string or null)",
  "phone": "Phone number (string or null)",
  "skills": ["List of technical skills (array of strings)"],
  "education": [
    {{
      "degree": "Degree name, e.g. Bachelor of Science in Computer Science (string or null)",
      "level": "UG (Undergraduate) or PG (Postgraduate) or null. Map Bachelor/B.Tech/B.Sc to UG, and Master/M.Tech/M.Sc/Ph.D to PG"
    }}
  ],
  "experience": [
    {{
      "company": "Company name (string or null)",
      "role": "Job title / role (string or null)",
      "years": "Duration of employment or number of years (string or null)",
      "start_date": "Start date or year (string or null)",
      "end_date": "End date, year or 'Present'/'Current' (string or null)"
    }}
  ],
  "certifications": ["List of professional certifications (array of strings)"],
  "projects": ["List of major projects (array of strings)"],
  "linkedin_url": "LinkedIn profile link (string or null)",
  "github_url": "GitHub profile link (string or null)",
  "location": "City, state or country of residence (string or null)",
  "engagement_mode": "Work preferences e.g. 'Remote', 'Hybrid', 'On-site' (string or null)"
}}

Return ONLY a valid JSON object. Do not include any markdown wrappers, triple backticks, explanations, or leading/trailing text.

Raw Resume Text:
{text}
"""

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }

        try:
            self._logger.info(f"Sending Groq resume parsing request using model: {self._model}")
            response = self._session.post(
                self._endpoint,
                headers=headers,
                json=payload,
                timeout=self._timeout,
            )
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]

            data = json.loads(content)

            # Map JSON data to ParsedResume dataclass
            edu_items = []
            for edu in data.get("education", []):
                edu_items.append(
                    EducationItem(
                        degree=edu.get("degree"),
                        level=edu.get("level"),
                    )
                )

            exp_items = []
            for exp in data.get("experience", []):
                exp_items.append(
                    ExperienceItem(
                        company=exp.get("company"),
                        role=exp.get("role"),
                        years=exp.get("years"),
                        start_date=exp.get("start_date"),
                        end_date=exp.get("end_date"),
                    )
                )

            return ParsedResume(
                name=data.get("name"),
                email=data.get("email"),
                phone=data.get("phone"),
                skills=data.get("skills") or [],
                education=edu_items,
                experience=exp_items,
                certifications=data.get("certifications") or [],
                projects=data.get("projects") or [],
                linkedin_url=data.get("linkedin_url"),
                github_url=data.get("github_url"),
                location=data.get("location"),
                engagement_mode=data.get("engagement_mode"),
            )
        except Exception as e:
            self._logger.error(f"Groq resume parsing API call failed: {e}")
            raise e
