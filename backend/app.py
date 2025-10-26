
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

# Local model support (transformers only)
# Default to a very fast, instruction-tuned seq2seq model for quick paragraph answers
USE_LOCAL_MODEL = os.environ.get("USE_LOCAL_MODEL", "1").lower() in ("1", "true", "yes")
LOCAL_MODEL_NAME = os.environ.get("LOCAL_MODEL_NAME", "google/flan-t5-large")
_local_generator = None
_local_lock = None
try:
    import threading
    _local_lock = threading.Lock()
except Exception:
    _local_lock = None

def get_local_generator():
    """Lazily load a transformers text-generation pipeline for a small local model.
    Requires `transformers` and `torch` installed. Model is downloaded on first use.
    """
    global _local_generator
    if _local_generator is not None:
        return _local_generator
    if _local_lock:
        _local_lock.acquire()
    try:
        if _local_generator is None:
            # Import here so transformers is optional until the feature is used
            from transformers import pipeline
            task = "text2text-generation" if ("t5" in LOCAL_MODEL_NAME.lower()) else "text-generation"
            _local_generator = pipeline(task, model=LOCAL_MODEL_NAME, device=-1)
    finally:
        if _local_lock:
            _local_lock.release()
    return _local_generator

app = Flask(__name__)
CORS(app)  # allows frontend (React) to talk to backend

# Attempt to load a local .env file if python-dotenv is available. This makes
# local development easier: copy `.env.example` to `.env` and put your key there.
try:
    # python-dotenv is optional; we don't make it a hard dependency at runtime.
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
    app.logger.debug("Loaded .env file (if present)")
except Exception:
    # ignore if python-dotenv isn't installed
    pass

app.logger.info(f"Local model: {LOCAL_MODEL_NAME} (enabled={USE_LOCAL_MODEL})")


@app.route("/", methods=["GET"])
def home():
    return "Welcome to the AI Chatbot backend! Use the /chat endpoint for POST requests."

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "")
    # Local-only generation
    reply = None
    if USE_LOCAL_MODEL:
        try:
            gen = get_local_generator()
            if gen:
                text = str(user_message).strip()
                if "t5" in LOCAL_MODEL_NAME.lower():
                    # Simple, concise answers without repetition
                    prompt = f"Answer this question briefly and clearly in 2-3 sentences:\n\nQuestion: {text}\n\nAnswer:"
                    out = gen(
                        prompt,
                        max_new_tokens=80,
                        min_new_tokens=20,
                        do_sample=True,
                        temperature=0.7,
                        top_p=0.9,
                        repetition_penalty=2.0,
                        no_repeat_ngram_size=3,
                        num_return_sequences=1
                    )
                else:
                    # causal LM chat-style prompt - simple and concise
                    prompt = f"Question: {text}\nAnswer briefly in 2-3 sentences:\n\nAnswer:"
                    out = gen(
                        prompt,
                        max_new_tokens=100,
                        do_sample=True,
                        temperature=0.7,
                        top_p=0.9,
                        repetition_penalty=2.0,
                        no_repeat_ngram_size=3,
                        num_return_sequences=1
                    )
                candidate = None
                if isinstance(out, list) and len(out) > 0:
                    first = out[0]
                    if isinstance(first, dict):
                        candidate = first.get("generated_text") or first.get("generated_texts") or first.get("text")
                    elif isinstance(first, str):
                        candidate = first
                elif isinstance(out, str):
                    candidate = out

                if candidate:
                    reply = candidate if isinstance(candidate, str) else str(candidate)
                # Clean causal-LM prompt prefix if present
                if reply and "Assistant:" in reply:
                    try:
                        reply = reply.split("Assistant:", 1)[1].strip()
                    except Exception:
                        pass
                # Enforce a minimum reasonable length when possible, but avoid second passes for speed
        except Exception:
            app.logger.exception("Local transformers model failed")

    if reply is None:
        # Always return something to the UI
        user_snippet = (user_message[:200] + '...') if len(user_message) > 200 else user_message
        fallback = (
            "(Offline) I received your message: '" + user_snippet + "'. "
            "I'm currently unable to generate a detailed answer. Please try again shortly."
        )
        return jsonify({"reply": fallback})

    return jsonify({"reply": reply})

if __name__ == "__main__":
    # Allow configuring host/port/debug via environment so we can bind to
    # 0.0.0.0 when running on a machine that should accept remote requests.
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "").lower() in ("1", "true", "yes")
    app.logger.info(f"Starting server on {host}:{port} (debug={debug})")
    app.run(host=host, port=port, debug=debug)
