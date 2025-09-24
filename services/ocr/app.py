import os
import time
from typing import Any, Dict, List

import fitz  # type: ignore
import numpy as np
from flask import Flask, jsonify, request
from PIL import Image
from werkzeug.utils import secure_filename

app = Flask(__name__)

MAX_PAGES = int(os.getenv("MAX_PAGES", "50"))
MAX_FILE_MB = float(os.getenv("MAX_FILE_MB", "20"))
CONF_THRESHOLD = float(os.getenv("CONF_THRESHOLD", "0.3"))
ZOOM_FACTOR = float(os.getenv("PDF_ZOOM", "2.0"))

_OCR_PREDICTOR = None


# Future ideas:
# - cv2-based pre-processing (denoise, adaptive thresholding, rotation correction)
# - Persist duration_ms/pages metrics for downstream monitoring
# - Prompt template placeholder for OCR → LLM structured extraction pipeline

def _load_predictor():
    global _OCR_PREDICTOR
    if _OCR_PREDICTOR is None:
        from doctr.models import ocr_predictor

        _OCR_PREDICTOR = ocr_predictor(
            det_arch="db_resnet50",
            reco_arch="crnn_vgg16_bn",
            pretrained=True,
        )
    return _OCR_PREDICTOR


def _error_response(message: str, status_code: int = 400, **extra: Any):
    payload = {"ok": False, "error": message}
    if extra:
        payload["details"] = extra
    response = jsonify(payload)
    response.status_code = status_code
    return response


def _pdf_to_images(pdf_bytes: bytes) -> List[Image.Image]:
    images: List[Image.Image] = []
    with fitz.open(stream=pdf_bytes, filetype="pdf") as document:
        page_count = len(document)
        if page_count > MAX_PAGES:
            raise ValueError("MAX_PAGE_LIMIT_EXCEEDED")

        matrix = fitz.Matrix(ZOOM_FACTOR, ZOOM_FACTOR)
        for page in document:
            pix = page.get_pixmap(matrix=matrix)
            mode = "RGBA" if pix.alpha else "RGB"
            image = Image.frombytes(mode, [pix.width, pix.height], pix.samples)
            if mode == "RGBA":
                image = image.convert("RGB")
            images.append(image)
    return images


def _build_normalized(export: Dict[str, Any]) -> List[Dict[str, Any]]:
    normalized_pages: List[Dict[str, Any]] = []
    pages = export.get("pages", [])
    for page_index, page in enumerate(pages):
        page_lines: List[Dict[str, Any]] = []
        text_fragments: List[str] = []
        for block in page.get("blocks", []):
            for line in block.get("lines", []):
                words = line.get("words", [])
                line_text_parts = [word.get("value", "") for word in words if word.get("value")]
                if not line_text_parts:
                    continue
                confidences = [word.get("confidence") for word in words if word.get("confidence") is not None]
                avg_conf = float(sum(confidences) / len(confidences)) if confidences else None
                if avg_conf is not None and avg_conf < CONF_THRESHOLD:
                    continue
                line_text = " ".join(line_text_parts)
                text_fragments.append(line_text)
                page_lines.append(
                    {
                        "text": line_text,
                        "confidence": round(avg_conf, 4) if avg_conf is not None else None,
                    }
                )
        normalized_pages.append(
            {
                "page_index": page_index,
                "text": "\n".join(text_fragments),
                "lines": page_lines,
            }
        )
    return normalized_pages


@app.get("/health")
def health():
    return jsonify({"ok": True})


@app.post("/ocr/pdf")
def ocr_pdf():
    if "file" not in request.files:
        return _error_response("file_missing", 400)

    uploaded = request.files["file"]
    filename = secure_filename(uploaded.filename or "document.pdf")

    pdf_bytes = uploaded.read()
    if not pdf_bytes:
        return _error_response("file_empty", 400)

    file_size_mb = len(pdf_bytes) / (1024 * 1024)
    if file_size_mb > MAX_FILE_MB:
        return _error_response("file_too_large", 400, limit_mb=MAX_FILE_MB)

    start_time = time.time()

    try:
        images = _pdf_to_images(pdf_bytes)
    except ValueError as exc:  # MAX_PAGE_LIMIT_EXCEEDED
        if str(exc) == "MAX_PAGE_LIMIT_EXCEEDED":
            return _error_response("page_limit_exceeded", 400, limit=MAX_PAGES)
        return _error_response("pdf_render_failed", 400, reason=str(exc))
    except Exception as exc:  # noqa: BLE001
        return _error_response("pdf_render_failed", 500, reason=str(exc))

    try:
        predictor = _load_predictor()
        np_images = [np.array(img.convert("RGB")) for img in images]
        result = predictor(np_images)
        exported = result.export()
    except Exception as exc:  # noqa: BLE001
        return _error_response("ocr_failed", 500, reason=str(exc))

    duration_ms = int((time.time() - start_time) * 1000)

    response_payload = {
        "ok": True,
        "file_name": filename,
        "pages": len(images),
        "duration_ms": duration_ms,
        "doctr_raw": exported,
        "normalized": _build_normalized(exported),
    }

    return jsonify(response_payload)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
