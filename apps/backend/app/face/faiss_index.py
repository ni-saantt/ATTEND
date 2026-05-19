"""
FAISS index for fast embedding search per college.
"""
import json
import numpy as np
import faiss
from typing import List, Tuple, Optional, Union
import threading

# college_id -> (faiss_index, id_mapping)
_index_cache: dict = {}
_lock = threading.Lock()


def _parse_embedding(emb: Union[str, list]) -> List[float]:
    """Parse embedding from Supabase (string or list) to list of floats."""
    if isinstance(emb, list):
        return [float(x) for x in emb]
    if isinstance(emb, str):
        try:
            return json.loads(emb)
        except json.JSONDecodeError:
            pass
        # Fallback: strip brackets and split
        s = emb.strip("[]").replace(" ", "")
        return [float(x) for x in s.split(",") if x]
    raise ValueError(f"Invalid embedding type: {type(emb)}")


def build_index(embeddings: List[Tuple[str, Union[str, List[float]]]]) -> Tuple[Optional[faiss.Index], List[str]]:
    """
    Build FAISS index from (student_id, embedding) pairs.
    Returns (index, id_list) where id_list[i] is student_id for index row i.
    """
    if not embeddings:
        return None, []

    ids = [e[0] for e in embeddings]
    vecs = np.array([_parse_embedding(e[1]) for e in embeddings], dtype=np.float32)
    # L2 normalize for cosine similarity via inner product
    faiss.normalize_L2(vecs)
    dim = vecs.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(vecs)
    return index, ids


def search_index(index: faiss.Index, id_list: List[str], query_embedding: List[float], k: int = 5, threshold: float = 0.5) -> List[Tuple[str, float]]:
    """
    Search for top-k matches. Returns [(student_id, score), ...].
    Deduplicates by student_id, keeping best score per student (multi-embedding).
    """
    if index is None or not id_list:
        return []

    vec = np.array([query_embedding], dtype=np.float32)
    faiss.normalize_L2(vec)
    # Request more candidates to allow dedup (multiple embeddings per student)
    k_search = min(k * 3, len(id_list))
    scores, indices = index.search(vec, k_search)
    best_per_student: dict[str, float] = {}
    for i, idx in enumerate(indices[0]):
        if idx >= 0 and scores[0][i] >= threshold:
            sid = id_list[idx]
            score = float(scores[0][i])
            if sid not in best_per_student or score > best_per_student[sid]:
                best_per_student[sid] = score
    return sorted(best_per_student.items(), key=lambda x: -x[1])[:k]


def get_or_build_college_index(supabase, college_id: str) -> Tuple[Optional[faiss.Index], List[str]]:
    """Get FAISS index for college, building if needed."""
    with _lock:
        if college_id in _index_cache:
            return _index_cache[college_id]

        # Load students for this college, then their embeddings
        students_result = supabase.table("students").select("id").eq("college_id", college_id).execute()
        if not students_result.data:
            _index_cache[college_id] = (None, [])
            return None, []

        student_ids = [s["id"] for s in students_result.data]
        emb_result = supabase.table("face_embeddings").select("student_id, embedding").in_("student_id", student_ids).execute()
        if not emb_result.data:
            _index_cache[college_id] = (None, [])
            return None, []

        pairs = [(str(r["student_id"]), r["embedding"]) for r in emb_result.data]
        # Filter out invalid embeddings
        valid_pairs = []
        for sid, emb in pairs:
            try:
                _parse_embedding(emb)
                valid_pairs.append((sid, emb))
            except (ValueError, TypeError):
                continue
        if not valid_pairs:
            _index_cache[college_id] = (None, [])
            return None, []
        pairs = valid_pairs

        index, ids = build_index(pairs)
        _index_cache[college_id] = (index, ids)
        return index, ids


def invalidate_college_index(college_id: str):
    """Call after enrollment to force rebuild."""
    with _lock:
        if college_id in _index_cache:
            del _index_cache[college_id]
