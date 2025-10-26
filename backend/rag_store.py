import os
import json
import re
from dataclasses import dataclass, asdict
from typing import List, Tuple, Optional

import numpy as np


try:
    # Lightweight, accurate embedding model (384-dim)
    from sentence_transformers import SentenceTransformer
except Exception as e:  # pragma: no cover
    raise RuntimeError(
        "sentence-transformers is required for RAG. Please add it to requirements and install."
    ) from e

try:
    from sklearn.neighbors import NearestNeighbors
except Exception as e:  # pragma: no cover
    raise RuntimeError(
        "scikit-learn is required for RAG. Please add it to requirements and install."
    ) from e

try:
    from pypdf import PdfReader
except Exception:
    PdfReader = None  # optional

try:
    import docx2txt
except Exception:
    docx2txt = None  # optional


KB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "knowledge_base"))
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "data"))
INDEX_VEC_PATH = os.path.join(DATA_DIR, "index_vectors.npz")
INDEX_META_PATH = os.path.join(DATA_DIR, "index_meta.json")


os.makedirs(KB_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)


@dataclass
class Chunk:
    id: str
    text: str
    source: str
    start: int
    end: int


def _read_text_from_file(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext in (".txt", ".md"):  # plain text/markdown
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    if ext == ".pdf":
        if not PdfReader:
            return ""
        try:
            reader = PdfReader(path)
            pages = [p.extract_text() or "" for p in reader.pages]
            return "\n".join(pages)
        except Exception:
            return ""
    if ext in (".docx",):
        if not docx2txt:
            return ""
        try:
            return docx2txt.process(path) or ""
        except Exception:
            return ""
    return ""  # unsupported


def _clean_text(text: str) -> str:
    text = text.replace("\u0000", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[Tuple[int, int, str]]:
    """Chunk by characters with overlap. Returns list of (start, end, chunk)."""
    text = text.strip()
    if not text:
        return []
    chunks: List[Tuple[int, int, str]] = []
    i = 0
    n = len(text)
    while i < n:
        j = min(i + chunk_size, n)
        chunk = text[i:j]
        chunks.append((i, j, chunk))
        if j == n:
            break
        i = max(j - overlap, 0)
    return chunks


class RAGStore:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.embedder = SentenceTransformer(model_name)
        self.vecs: Optional[np.ndarray] = None
        self.meta: List[Chunk] = []
        self.nn: Optional[NearestNeighbors] = None

    def build(self, kb_dir: str = KB_DIR) -> None:
        chunks: List[Chunk] = []
        for root, _, files in os.walk(kb_dir):
            for name in files:
                path = os.path.join(root, name)
                text = _clean_text(_read_text_from_file(path))
                if not text:
                    continue
                for idx, (start, end, ch) in enumerate(_chunk_text(text)):
                    cid = f"{os.path.relpath(path, kb_dir)}::chunk_{idx}"
                    chunks.append(Chunk(id=cid, text=ch, source=os.path.relpath(path, kb_dir), start=start, end=end))

        if not chunks:
            # initialize empty state
            self.vecs = np.zeros((0, 384), dtype=np.float32)
            self.meta = []
            self.nn = None
            return

        texts = [c.text for c in chunks]
        embeddings = self.embedder.encode(texts, convert_to_numpy=True, show_progress_bar=False, normalize_embeddings=True)
        self.vecs = embeddings.astype(np.float32)
        self.meta = chunks
        # cosine distance via brute force works fine for small to medium corpora
        self.nn = NearestNeighbors(n_neighbors=8, metric="cosine")
        self.nn.fit(self.vecs)

    def save(self, vec_path: str = INDEX_VEC_PATH, meta_path: str = INDEX_META_PATH) -> None:
        if self.vecs is None:
            return
        np.savez_compressed(vec_path, vecs=self.vecs)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump([asdict(m) for m in self.meta], f, ensure_ascii=False)

    def load(self, vec_path: str = INDEX_VEC_PATH, meta_path: str = INDEX_META_PATH) -> bool:
        if not (os.path.exists(vec_path) and os.path.exists(meta_path)):
            return False
        data = np.load(vec_path)
        self.vecs = data["vecs"].astype(np.float32)
        with open(meta_path, "r", encoding="utf-8") as f:
            meta_json = json.load(f)
        self.meta = [Chunk(**m) for m in meta_json]
        if len(self.vecs) == 0:
            self.nn = None
        else:
            self.nn = NearestNeighbors(n_neighbors=8, metric="cosine")
            self.nn.fit(self.vecs)
        return True

    def retrieve(self, query: str, top_k: int = 5) -> List[Chunk]:
        if not query or self.vecs is None or self.nn is None or len(self.vecs) == 0:
            return []
        q_vec = self.embedder.encode([query], convert_to_numpy=True, show_progress_bar=False, normalize_embeddings=True)
        distances, indices = self.nn.kneighbors(q_vec, n_neighbors=min(top_k, len(self.vecs)))
        idxs = indices[0].tolist()
        return [self.meta[i] for i in idxs]


# Convenience API used by Flask app
_store: Optional[RAGStore] = None


def get_store() -> RAGStore:
    global _store
    if _store is None:
        _store = RAGStore()
        # try load existing index, build empty if not present
        loaded = _store.load()
        if not loaded:
            _store.build()
            _store.save()
    return _store


def rebuild_from_folder() -> Tuple[int, int]:
    """Rebuild the index from files in KB_DIR. Returns (#files, #chunks)."""
    store = get_store()
    store.build(KB_DIR)
    store.save()
    return _count_kb(KB_DIR)


def save_uploaded_files(files) -> List[str]:
    saved: List[str] = []
    for f in files:
        if not f or not getattr(f, "filename", None):
            continue
        name = os.path.basename(f.filename)
        ext = os.path.splitext(name)[1].lower()
        if ext not in (".txt", ".md", ".pdf", ".docx"):
            # skip unsupported
            continue
        dst = os.path.join(KB_DIR, name)
        f.save(dst)
        saved.append(dst)
    return saved


def _count_kb(kb_dir: str) -> Tuple[int, int]:
    file_count = 0
    chunk_count = 0
    for root, _, files in os.walk(kb_dir):
        for name in files:
            file_count += 1
            path = os.path.join(root, name)
            text = _clean_text(_read_text_from_file(path))
            chunk_count += len(_chunk_text(text))
    return file_count, chunk_count
