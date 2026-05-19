"""
InsightFace face detection and embedding extraction.
Uses RetinaFace for detection and ArcFace for recognition.
Execution provider: auto (CUDA on Linux, CoreML on Mac, else CPU), cuda, coreml, or cpu.
"""
import numpy as np
import sys
from typing import List, Optional
import cv2

_pipeline = None


def _detect_providers() -> List[str]:
    """Choose ONNX execution providers by platform and FACE_EXECUTION_PROVIDER env."""
    from app.config import get_settings
    settings = get_settings()
    mode = (settings.face_execution_provider or "auto").lower()

    if mode == "cpu":
        return ["CPUExecutionProvider"]

    if mode == "cuda":
        return ["CUDAExecutionProvider", "CPUExecutionProvider"]

    if mode == "coreml":
        return ["CoreMLExecutionProvider", "CPUExecutionProvider"]

    # auto: detect platform
    if sys.platform == "darwin":
        return ["CoreMLExecutionProvider", "CPUExecutionProvider"]
    if sys.platform == "linux":
        return ["CUDAExecutionProvider", "CPUExecutionProvider"]
    return ["CPUExecutionProvider"]


def get_pipeline():
    global _pipeline
    if _pipeline is None:
        from insightface.app import FaceAnalysis
        providers = _detect_providers()
        try:
            _pipeline = FaceAnalysis(name="buffalo_l", providers=providers)
            _pipeline.prepare(ctx_id=0, det_size=(640, 640))
        except Exception:
            _pipeline = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
            _pipeline.prepare(ctx_id=0, det_size=(640, 640))
    return _pipeline


def detect_and_embed(image: np.ndarray) -> List[dict]:
    """
    Detect faces and extract embeddings.
    Returns list of dicts with keys: bbox, embedding, det_score
    """
    app = get_pipeline()
    faces = app.get(image)
    results = []
    for f in faces:
        if f.embedding is not None and f.det_score > 0.5:
            results.append({
                "bbox": f.bbox.tolist(),
                "embedding": f.embedding.tolist(),
                "det_score": float(f.det_score),
            })
    return results


def crop_face(image: np.ndarray, bbox: List[float], padding: float = 0.1) -> np.ndarray:
    """Crop face from image with padding."""
    h, w = image.shape[:2]
    x1, y1, x2, y2 = bbox
    bw, bh = x2 - x1, y2 - y1
    pad_w, pad_h = bw * padding, bh * padding
    x1 = max(0, int(x1 - pad_w))
    y1 = max(0, int(y1 - pad_h))
    x2 = min(w, int(x2 + pad_w))
    y2 = min(h, int(y2 + pad_h))
    return image[y1:y2, x1:x2]


def decode_image(image_bytes: bytes) -> np.ndarray:
    """Decode image bytes to numpy BGR."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image")
    return img
