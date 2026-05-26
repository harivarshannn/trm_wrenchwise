"""Google Vision OCR service."""

from __future__ import annotations

import asyncio
import base64
import io
from typing import Iterable, Optional, Tuple

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from pdf2image import convert_from_bytes
from PIL import Image

from app.models.resume import OCRResult
from app.utils.logger import get_logger


class VisionOCRService:
    """OCR service using Google Vision API (API key authentication)."""

    def __init__(
        self,
        api_key: str,
        batch_size: int,
        max_concurrency: int,
        request_timeout: int,
        request_retries: int,
        request_backoff_factor: float,
    ) -> None:
        self._api_key = api_key
        self._batch_size = max(1, batch_size)
        self._max_concurrency = max(1, max_concurrency)
        self._endpoint = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
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

    async def ocr_images_async(self, images: Iterable[bytes]) -> OCRResult:
        """Run OCR for a list of images concurrently in batches."""
        image_bytes = list(images)
        if not image_bytes:
            return OCRResult(text="", confidence=None)

        encoded = [base64.b64encode(img).decode("ascii") for img in image_bytes]
        batches = [encoded[i : i + self._batch_size] for i in range(0, len(encoded), self._batch_size)]

        semaphore = asyncio.Semaphore(self._max_concurrency)
        responses: list[list[dict]] = [None] * len(batches)

        async def process_batch(index: int, batch: list[str]) -> None:
            async with semaphore:
                payload = [self._build_request(item) for item in batch]
                responses[index] = await asyncio.to_thread(self._post_batch, payload)

        await asyncio.gather(*(process_batch(idx, batch) for idx, batch in enumerate(batches)))

        texts: list[str] = []
        confidences: list[float] = []
        for batch_response in responses:
            for response in batch_response:
                if "error" in response:
                    message = response["error"].get("message", "OCR request failed.")
                    raise RuntimeError(message)
                full_text = response.get("fullTextAnnotation", {})
                text = full_text.get("text", "")
                if text:
                    texts.append(text)
                confidences.extend(self._extract_confidence(full_text))

        combined_text = "\n\n".join(texts).strip()
        avg_confidence = sum(confidences) / len(confidences) if confidences else None
        return OCRResult(text=combined_text, confidence=avg_confidence)

    async def ocr_pdf_async(self, pdf_bytes: bytes, dpi: int) -> OCRResult:
        """Convert a PDF to images and run OCR on each page."""
        images = await asyncio.to_thread(convert_from_bytes, pdf_bytes, dpi=dpi, fmt="png")
        try:
            image_bytes = [self._image_to_bytes(image) for image in images]
        finally:
            for image in images:
                image.close()
        return await self.ocr_images_async(image_bytes)

    def _post_batch(self, requests_payload: list[dict]) -> list[dict]:
        response = self._session.post(
            self._endpoint,
            json={"requests": requests_payload},
            timeout=self._timeout,
        )
        if response.status_code != 200:
            self._logger.error("OCR request failed: %s", response.text)
            raise RuntimeError(f"OCR request failed with status {response.status_code}.")
        data = response.json()
        if "responses" not in data:
            raise RuntimeError("OCR response missing payload.")
        return data["responses"]

    @staticmethod
    def _build_request(encoded_image: str) -> dict:
        return {
            "image": {"content": encoded_image},
            "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
        }

    @staticmethod
    def _image_to_bytes(image: Image.Image) -> bytes:
        with io.BytesIO() as buffer:
            image.save(buffer, format="PNG")
            return buffer.getvalue()

    @staticmethod
    def _extract_confidence(full_text: dict) -> list[float]:
        confidences: list[float] = []
        for page in full_text.get("pages", []):
            for block in page.get("blocks", []):
                for paragraph in block.get("paragraphs", []):
                    for word in paragraph.get("words", []):
                        confidence = word.get("confidence")
                        if confidence is not None:
                            confidences.append(confidence)
        return confidences
