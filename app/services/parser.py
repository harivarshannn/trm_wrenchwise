"""Resume parsing service."""

from __future__ import annotations

import re
from datetime import date
from typing import Callable, Iterable, Optional

from app.models.resume import ParsedResume, ExperienceItem, EducationItem
from app.utils.logger import get_logger


class ResumeParser:
    """Parse resume text into structured fields."""

    def __init__(
        self,
        skills_refiner: Optional[Callable[[list[str]], list[str]]] = None,
        certifications_refiner: Optional[Callable[[list[str]], list[str]]] = None,
    ) -> None:
        self._logger = get_logger(self.__class__.__name__)
        self._heading_lookup = self._build_heading_lookup()
        self._skills_refiner = skills_refiner
        self._certifications_refiner = certifications_refiner

    def parse(self, text: str) -> ParsedResume:
        """Parse raw resume text into structured data."""
        normalized_text = text or ""
        if not normalized_text.strip():
            self._logger.warning("Received empty resume text for parsing.")
        lines = self._clean_lines(normalized_text)

        email = self._extract_email(normalized_text)
        phone = self._extract_phone(normalized_text)
        linkedin_url = self._extract_linkedin(normalized_text)
        github_url = self._extract_github(normalized_text)
        name = self._extract_name(lines, email, phone, linkedin_url, github_url)
        location = self._extract_location(normalized_text)
        engagement_mode = self._extract_engagement_mode(normalized_text)

        sections = self._extract_sections(lines)
        raw_skills = sections.get("skills", [])
        skills = self._extract_skills(raw_skills)
        if self._skills_refiner:
            try:
                refined_skills = self._skills_refiner(raw_skills)
                if refined_skills:
                    skills = refined_skills
            except Exception:
                self._logger.exception("LLM skills refinement failed; using fallback.")
        education = self._extract_education(sections.get("education", []))
        experience = self._extract_experience(sections.get("experience", []))
        raw_certs = sections.get("certifications", [])
        certifications = self._extract_certifications(raw_certs)
        projects = self._extract_projects(sections.get("projects", []), skills)
        if self._certifications_refiner:
            try:
                refined_certs = self._certifications_refiner(raw_certs)
                if refined_certs:
                    certifications = refined_certs
            except Exception:
                self._logger.exception("LLM certifications refinement failed; using fallback.")

        return ParsedResume(
            name=name,
            email=email,
            phone=phone,
            skills=skills,
            education=education,
            experience=experience,
            certifications=certifications,
            projects=projects,
            linkedin_url=linkedin_url,
            github_url=github_url,
            location=location,
            engagement_mode=engagement_mode,
        )

    @staticmethod
    def _clean_lines(text: str) -> list[str]:
        return [line.strip() for line in text.splitlines() if line.strip()]

    @staticmethod
    def _extract_email(text: str) -> str | None:
        match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
        return match.group(0) if match else None

    @staticmethod
    def _extract_phone(text: str) -> str | None:
        # Find raw phone patterns
        match = re.search(r"(\+?\d[\d\s().-]{7,}\d)", text)
        if not match:
            return None
        raw_phone = match.group(1)
        # Strip all non-digit characters
        digits = re.sub(r"\D", "", raw_phone)
        # Handle prefixes
        if len(digits) > 10 and (digits.startswith("91") or digits.startswith("091")):
            # Strip 91 country code prefix (which is 2 characters) or 091 (3 characters)
            if digits.startswith("091"):
                digits = digits[3:]
            else:
                digits = digits[2:]
        elif len(digits) > 10:
            # Just take the last 10 digits
            digits = digits[-10:]
        
        # Ensure it has exactly 10 digits or fallback to whatever digits we have
        if len(digits) == 10:
            return digits
        return digits if len(digits) > 0 else None

    @staticmethod
    def _extract_location(text: str) -> str | None:
        # 1. Look for explicit Location labels
        label_pattern = re.compile(
            r"\b(?:location|address|lives\s+in|residence|resides\s+in|city)\s*[:\-]\s*(?P<loc>[A-Za-z0-9 ,.-]{3,50})",
            re.IGNORECASE
        )
        match = label_pattern.search(text)
        if match:
            loc = match.group("loc").strip()
            loc = re.split(r'\n|, India| India', loc)[0].strip()
            if loc and len(loc) > 2:
                return loc.title()

        # 2. Look for common cities
        cities = [
            "Bangalore", "Bengaluru", "Chennai", "Hyderabad", "Mumbai", "Pune", "Delhi", "Noida", 
            "Gurugram", "Gurgaon", "Kolkata", "Ahmedabad", "Kochi", "Cochin", "Thiruvananthapuram", 
            "Trivandrum", "Coimbatore", "Madurai", "Trichy", "Salem", "Vijayawada", "Visakhapatnam", 
            "Vizag", "Jaipur", "Indore", "Bhopal", "Lucknow", "Patna", "Chandigarh", "Bhubaneswar"
        ]
        header_city = ResumeParser._find_city_match(text[:1200], cities)
        if header_city:
            return header_city
        return ResumeParser._find_city_match(text, cities)
        return None

    @staticmethod
    def _extract_engagement_mode(text: str) -> str | None:
        lowered = text.lower()
        if "hybrid" in lowered:
            return "hybrid"
        if "remote" in lowered or "work from home" in lowered or "online" in lowered or "wfh" in lowered:
            return "online"
        if "on-site" in lowered or "onsite" in lowered or "in-office" in lowered or "offline" in lowered or "classroom" in lowered or "on site" in lowered:
            return "offline"
        return "hybrid"  # sensible default

    @staticmethod
    def _extract_linkedin(text: str) -> str | None:
        match = re.search(r"(https?://)?(www\.)?linkedin\.com/[A-Za-z0-9._\-/%]+", text, re.IGNORECASE)
        return match.group(0) if match else None

    @staticmethod
    def _extract_github(text: str) -> str | None:
        match = re.search(r"(https?://)?(www\.)?github\.com/[A-Za-z0-9._\-/%]+", text, re.IGNORECASE)
        return match.group(0) if match else None

    def _extract_name(
        self,
        lines: Iterable[str],
        email: str | None,
        phone: str | None,
        linkedin_url: str | None,
        github_url: str | None,
    ) -> str | None:
        blocked_tokens = {"resume", "curriculum", "vitae"}
        for line in list(lines)[:8]:
            lowered = line.lower()
            if email and email in line:
                continue
            if phone and phone in line:
                continue
            if linkedin_url and linkedin_url.lower() in lowered:
                continue
            if github_url and github_url.lower() in lowered:
                continue
            if any(token in lowered for token in blocked_tokens):
                continue
            if not re.match(r"^[A-Za-z][A-Za-z .'-]{2,}$", line):
                continue
            if len(line.split()) < 2:
                continue
            return line.strip()
        return None

    def _extract_sections(self, lines: list[str]) -> dict[str, list[str]]:
        positions: list[tuple[int, str]] = []
        for idx, line in enumerate(lines):
            normalized = self._normalize_heading(line)
            section = self._heading_lookup.get(normalized)
            if section:
                positions.append((idx, section))

        positions.sort(key=lambda item: item[0])
        sections: dict[str, list[str]] = {}

        for index, (start, section) in enumerate(positions):
            end = positions[index + 1][0] if index + 1 < len(positions) else len(lines)
            content_lines = lines[start + 1 : end]
            sections[section] = content_lines

        return sections

    @staticmethod
    def _normalize_heading(line: str) -> str:
        cleaned = re.sub(r"[^a-zA-Z& ]", "", line).lower()
        cleaned = cleaned.replace("&", "and")
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    @staticmethod
    def _build_heading_lookup() -> dict[str, str]:
        headings = {
            "skills": [
                "skills",
                "technical skills",
                "core skills",
                "skills and tools",
                "technologies",
                "tools",
            ],
            "education": [
                "education",
                "academics",
                "academic background",
                "qualifications",
            ],
            "experience": [
                "experience",
                "work experience",
                "professional experience",
                "employment",
                "employment history",
                "work history",
            ],
            "certifications": [
                "certifications",
                "certificates",
                "licenses",
                "certification",
            ],
            "projects": [
                "projects",
                "project experience",
            ],
            "volunteering": [
                "volunteering",
                "leadership",
                "volunteering and leadership",
                "activities",
            ],
        }

        lookup: dict[str, str] = {}
        for section, variants in headings.items():
            for variant in variants:
                lookup[ResumeParser._normalize_heading(variant)] = section
        return lookup

    @staticmethod
    def _clean_section_line(line: str) -> str:
        return re.sub(r"^[\-\u2022\*•]+", "", line).strip()

    def _extract_certifications(self, lines: list[str]) -> list[str]:
        items: list[str] = []
        for line in lines:
            cleaned = self._clean_section_line(line)
            if cleaned:
                items.append(cleaned)
        return self._unique_list(items)

    def _extract_skills(self, lines: list[str]) -> list[str]:
        items: list[str] = []
        qualifiers = re.compile(
            r"^(proficient in|experienced in|experience with|knowledge of|familiar with|hands-?on with|skilled in|expert in)\s+",
            re.IGNORECASE,
        )
        label_pattern = re.compile(
            r"^(programming languages?|libraries|frameworks|tools|platforms|databases)\s*[:\-]?\s*",
            re.IGNORECASE,
        )
        verb_pattern = re.compile(
            r"\b(handled|implemented|responsible|worked|developed|designing|designed|contributed|managed|created|built|tested|analysis|processing|mapping|batching)\b",
            re.IGNORECASE,
        )
        for line in lines:
            cleaned = self._clean_section_line(line)
            cleaned = label_pattern.sub("", cleaned)
            if ":" in cleaned:
                cleaned = cleaned.split(":", 1)[1].strip()
            if not cleaned:
                continue
            for token in re.split(r"[,;/|]", cleaned):
                token = qualifiers.sub("", token).strip()
                token = re.sub(r"\s+", " ", token)
                token = re.sub(r"[().]", "", token).strip()
                if not token:
                    continue
                word_count = len(token.split())
                if word_count > 4 or len(token) > 40:
                    continue
                if re.fullmatch(r"\d+", token):
                    continue
                if verb_pattern.search(token) and word_count > 2:
                    continue
                items.append(token)
        return self._unique_list(items)

    def _extract_projects(self, lines: list[str], skills: list[str]) -> list[str]:
        items: list[str] = []
        current_title: Optional[str] = None
        current_desc: list[str] = []

        for line in lines:
            cleaned = self._clean_section_line(line)
            if not cleaned:
                continue
            if self._is_project_date_line(cleaned):
                continue
            if self._is_project_title(cleaned):
                if current_title:
                    summary = self._summarize_project(current_title, current_desc, skills)
                    if summary:
                        items.append(summary)
                current_title = cleaned
                current_desc = []
                continue
            if current_title:
                current_desc.append(cleaned)

        if current_title:
            summary = self._summarize_project(current_title, current_desc, skills)
            if summary:
                items.append(summary)

        return self._unique_list(items)

    @staticmethod
    def _is_project_date_line(line: str) -> bool:
        if re.search(r"\b\d{1,2}/\d{4}\b", line):
            return True
        return re.search(r"\b\d{4}\b\s*(?:-|–|to)\s*(?:\d{4}|present|current)\b", line, re.IGNORECASE) is not None

    @staticmethod
    def _is_project_title(line: str) -> bool:
        normalized = re.sub(r"[–—]", "-", line).strip()
        if len(normalized) < 3 or len(normalized) > 90:
            return False
        if normalized.endswith("."):
            return False
        if ResumeParser._is_project_date_line(normalized):
            return False
        verb_starters = (
            "engineered",
            "built",
            "designed",
            "implemented",
            "preprocessed",
            "trained",
            "applied",
            "developed",
            "optimized",
            "used",
        )
        lowered = normalized.lower()
        if lowered.startswith(verb_starters):
            return False
        if len(normalized.split()) > 10:
            return False
        if normalized.isupper() or normalized == normalized.title():
            return True
        return re.match(r"^[A-Za-z0-9][A-Za-z0-9 .&/+()\\:-]+$", normalized) is not None

    def _summarize_project(self, title: str, desc_lines: list[str], skills: list[str]) -> str:
        description = " ".join(desc_lines)
        technologies = self._extract_project_technologies(f"{title} {description}", skills)
        if technologies:
            return f"{title} — {', '.join(technologies)}"
        return title

    def _extract_project_technologies(self, text: str, skills: list[str]) -> list[str]:
        patterns: list[tuple[str, str]] = [
            (r"\bcomputer vision\b", "Computer Vision"),
            (r"\bmachine learning\b", "Machine Learning"),
            (r"\bdeep learning\b", "Deep Learning"),
            (r"\bseq2seq\b", "Seq2Seq"),
            (r"\battention\b", "Attention"),
            (r"\bpytorch\b", "PyTorch"),
            (r"\btensorflow\b", "TensorFlow"),
            (r"\bkeras\b", "Keras"),
            (r"\bopen\s?cv\b", "OpenCV"),
            (r"\bllms?\b|\blarge language model\b", "LLM"),
            (r"\bnlp\b", "NLP"),
            (r"\bollama\b", "Ollama"),
            (r"\btf-?idf\b", "TF-IDF"),
            (r"\bspeech[- ]to[- ]text\b", "Speech-to-Text"),
            (r"\bgoogle(?:'s)? speech[- ]to[- ]text\b", "Google Speech-to-Text"),
            (r"\bpython\b", "Python"),
            (r"\breact\b", "React"),
            (r"\bnode\.?js\b", "Node.js"),
            (r"\bnext\.?js\b", "Next.js"),
            (r"\bfastapi\b", "FastAPI"),
            (r"\bpostgresql\b", "PostgreSQL"),
        ]

        detected: list[str] = []
        for pattern, label in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                detected.append(label)

        lowered = text.lower()
        for skill in skills:
            if not skill:
                continue
            trimmed = skill.strip()
            if not trimmed or len(trimmed) > 30:
                continue
            if re.search(r"\b" + re.escape(trimmed.lower()) + r"\b", lowered):
                detected.append(trimmed)

        return self._unique_list(detected)

    def _extract_experience(self, lines: list[str]) -> list[ExperienceItem]:
        cleaned_lines: list[str] = []
        for line in lines:
            cleaned = self._clean_section_line(line)
            if cleaned:
                cleaned_lines.append(cleaned)
        date_ranges: dict[int, tuple[date, date, str]] = {}
        for idx, line in enumerate(cleaned_lines):
            date_range = self._parse_date_range(line)
            if date_range:
                start, end = date_range
                duration = self._format_duration(start, end)
                date_ranges[idx] = (start, end, duration)

        items = []
        for idx in sorted(date_ranges):
            start_date_obj, end_date_obj, duration = date_ranges[idx]
            company, role = self._find_role_company(cleaned_lines, idx)
            if company or role:
                items.append(
                    ExperienceItem(
                        company=company,
                        role=role,
                        years=duration,
                        start_date=start_date_obj.isoformat(),
                        end_date=end_date_obj.isoformat()
                    )
                )

        if not items:
            for line in cleaned_lines:
                company, role = self._parse_role_company(line)
                years_text = self._extract_years_phrase(line)
                if (company or role) and years_text:
                    items.append(ExperienceItem(company=company, role=role, years=years_text))

        return items

    def _extract_education(self, lines: list[str]) -> list[EducationItem]:
        items = []
        fallback_level = self._infer_education_level(lines)
        for line in lines:
            cleaned = self._clean_section_line(line)
            if not cleaned:
                continue
            lowered = cleaned.lower()
            if any(token in lowered for token in ["cgpa", "gpa", "percentage", "%", "grade"]):
                continue
            degree = self._extract_degree(cleaned)
            if not degree:
                if fallback_level and self._looks_like_field_of_study(cleaned):
                    items.append(EducationItem(degree=cleaned, level=fallback_level))
                continue
            level = self._classify_degree_level(degree)
            if not level:
                level = fallback_level
            if not level:
                continue
            items.append(EducationItem(degree=degree, level=level))
        return items

    def _find_role_company(self, lines: list[str], idx: int) -> tuple[Optional[str], Optional[str]]:
        company: Optional[str] = None
        role: Optional[str] = None
        for offset in [-1, -2, 1, 2, 0]:
            target_index = idx + offset
            if target_index < 0 or target_index >= len(lines):
                continue
            company, role = self._parse_role_company(lines[target_index])
            if company or role:
                break

        if company is None or role is None:
            for offset in [-2, -1, 1, 2]:
                target_index = idx + offset
                if target_index < 0 or target_index >= len(lines):
                    continue
                line = lines[target_index]
                if company is None and self._is_company_line(line):
                    company = self._normalize_company(line)
                if role is None and self._is_role_line(line):
                    role = self._normalize_role(line)
                if company and role:
                    break

        return company, role

    @staticmethod
    def _parse_role_company(line: str) -> tuple[Optional[str], Optional[str]]:
        role_keywords = re.compile(
            r"\b(engineer|developer|designer|analyst|consultant|manager|lead|intern|specialist|architect|scientist|tester|administrator)\b",
            re.IGNORECASE,
        )
        line = re.sub(r"\s+", " ", line).strip()
        if "|" in line:
            parts = [part.strip() for part in line.split("|") if part.strip()]
            if len(parts) >= 2:
                left, right = parts[0], parts[1]
                if role_keywords.search(left) and not role_keywords.search(right):
                    return right, left
                if role_keywords.search(right) and not role_keywords.search(left):
                    return left, right
                return left, right
        if " at " in line.lower():
            pieces = re.split(r"\s+at\s+", line, flags=re.IGNORECASE)
            if len(pieces) >= 2:
                return pieces[1].strip(), pieces[0].strip()
        if "-" in line and not re.search(r"\d{4}", line):
            parts = [part.strip() for part in re.split(r"\s-\s", line) if part.strip()]
            if len(parts) >= 2:
                return parts[0], parts[1]
        if role_keywords.search(line):
            return None, line
        if line:
            return line, None
        return None, None

    @staticmethod
    def _extract_years_phrase(line: str) -> Optional[str]:
        match = re.search(r"(\d+(?:\.\d+)?)\s*(years?|yrs?)", line, re.IGNORECASE)
        if match:
            value = match.group(1)
            unit = match.group(2)
            return f"{value} {unit}"
        return None

    @staticmethod
    def _parse_date_range(line: str) -> Optional[tuple[date, date]]:
        month_map = {
            "jan": 1,
            "feb": 2,
            "mar": 3,
            "apr": 4,
            "may": 5,
            "jun": 6,
            "jul": 7,
            "aug": 8,
            "sep": 9,
            "sept": 9,
            "oct": 10,
            "nov": 11,
            "dec": 12,
        }

        pattern = re.compile(
            r"(?P<start_month>[A-Za-z]{3,9})?\s*(?P<start_year>\d{4})\s*(?:-|–|to)\s*(?P<end_month>[A-Za-z]{3,9})?\s*(?P<end_year>\d{4}|present|current)",
            re.IGNORECASE,
        )
        match = pattern.search(line)
        if match:
            start_year = int(match.group("start_year"))
            end_year_raw = match.group("end_year").lower()
            end_year = date.today().year if end_year_raw in {"present", "current"} else int(end_year_raw)

            start_month_raw = (match.group("start_month") or "jan").lower()
            end_month_raw = (match.group("end_month") or "dec").lower()
            start_month = month_map.get(start_month_raw[:3], 1)
            end_month = month_map.get(end_month_raw[:3], 12)

            start_date = date(start_year, start_month, 1)
            end_date = date(end_year, end_month, 1)
            if end_date < start_date:
                return None
            return start_date, end_date

        numeric_pattern = re.compile(
            r"(?P<start>\d{1,2}/\d{4})\s*(?:-|–|to)\s*(?P<end>\d{1,2}/\d{4}|present|current)",
            re.IGNORECASE,
        )
        numeric_match = numeric_pattern.search(line)
        if not numeric_match:
            return None

        start_date = ResumeParser._parse_month_year(numeric_match.group("start"))
        end_raw = numeric_match.group("end")
        end_date = date.today().replace(day=1) if end_raw.lower() in {"present", "current"} else ResumeParser._parse_month_year(end_raw)
        if not start_date or not end_date or end_date < start_date:
            return None
        return start_date, end_date

    @staticmethod
    def _parse_month_year(token: str) -> Optional[date]:
        match = re.match(r"(?P<month>\d{1,2})/(?P<year>\d{4})", token.strip())
        if not match:
            return None
        month = int(match.group("month"))
        year = int(match.group("year"))
        if month < 1 or month > 12:
            return None
        return date(year, month, 1)

    @staticmethod
    def _format_duration(start: date, end: date) -> str:
        total_months = (end.year - start.year) * 12 + (end.month - start.month)
        if total_months < 0:
            return ""
        years = total_months // 12
        months = total_months % 12
        parts: list[str] = []
        if years:
            parts.append(f"{years} yr" + ("s" if years != 1 else ""))
        if months:
            parts.append(f"{months} mo" + ("s" if months != 1 else ""))
        if not parts:
            return "0 mos"
        return " ".join(parts)

    @staticmethod
    def _extract_degree(line: str) -> Optional[str]:
        patterns = [
            r"(Bachelor of [A-Za-z &]+(?: in [A-Za-z &]+)?)",
            r"(Master of [A-Za-z &]+(?: in [A-Za-z &]+)?)",
            r"\b(B\.?E\.?\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(B\.?Tech\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(B\.?Sc\.?\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(B\.?A\.?\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(B\.?Com\.?\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(B\.?B\.?A\.?\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(B\.?C\.?A\.?\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(M\.?Tech\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(M\.?B\.?A\.?\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(M\.?Sc\.?\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(M\.?A\.?\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(M\.?Com\.?\s*(?:in [A-Za-z &]+)?)\b",
            r"\b(M\.?C\.?A\.?\s*(?:in [A-Za-z &]+)?)\b",
        ]
        for pattern in patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    @staticmethod
    def _infer_education_level(lines: list[str]) -> Optional[str]:
        joined = " ".join(lines).lower()
        if any(token in joined for token in ["postgraduate", "pg", "master", "m.tech", "mba", "m.sc", "m.a", "mca"]):
            return "PG"
        if any(token in joined for token in ["undergraduate", "ug", "bachelor", "b.tech", "b.e", "b.sc", "b.a", "bca", "bba"]):
            return "UG"
        if any(token in joined for token in ["college", "university", "institute", "campus", "school"]):
            return "UG"
        return None

    @staticmethod
    def _looks_like_field_of_study(text: str) -> bool:
        lowered = text.lower()
        return any(
            keyword in lowered
            for keyword in [
                "computer science",
                "information technology",
                "electronics",
                "mechanical",
                "civil",
                "math",
                "physics",
                "chemistry",
                "engineering",
                "technology",
            ]
        )

    @staticmethod
    def _is_role_line(text: str) -> bool:
        return re.search(
            r"\b(engineer|developer|designer|analyst|consultant|manager|lead|intern|specialist|architect|scientist|tester|administrator)\b",
            text,
            re.IGNORECASE,
        ) is not None

    @staticmethod
    def _is_company_line(text: str) -> bool:
        if ResumeParser._is_role_line(text):
            return False
        if re.search(r"\d{4}", text):
            return False
        return len(text.split()) <= 6

    @staticmethod
    def _normalize_company(text: str) -> str:
        if "•" in text:
            return text.split("•", 1)[0].strip()
        if "," in text:
            return text.split(",", 1)[0].strip()
        return text.strip()

    @staticmethod
    def _normalize_role(text: str) -> str:
        return text.strip()

    @staticmethod
    def _classify_degree_level(degree: str) -> Optional[str]:
        ug_tokens = ["bachelor", "b.e", "b.tech", "b.sc", "b.a", "b.com", "bba", "bca"]
        pg_tokens = ["master", "m.tech", "mba", "m.sc", "m.a", "m.com", "mca"]
        lowered = degree.lower()
        if any(token in lowered for token in ug_tokens):
            return "UG"
        if any(token in lowered for token in pg_tokens):
            return "PG"
        return None

    @staticmethod
    def _find_city_match(text: str, cities: list[str]) -> Optional[str]:
        lowered = text.lower()
        best_match: tuple[int, str] | None = None
        for city in cities:
            pattern = r"\b" + re.escape(city.lower()) + r"\b"
            match = re.search(pattern, lowered)
            if not match:
                continue
            if best_match is None or match.start() < best_match[0]:
                best_match = (match.start(), city)
        return best_match[1] if best_match else None

    @staticmethod
    def _unique_list(items: list[str]) -> list[str]:
        seen = set()
        unique_items: list[str] = []
        for item in items:
            key = item.lower()
            if key in seen:
                continue
            seen.add(key)
            unique_items.append(item)
        return unique_items
