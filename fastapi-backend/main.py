import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from gpt4all import GPT4All
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time

app = FastAPI(title="Ultramaxo AI Local Backend (GPT4All)")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_NAME = os.getenv("LOCAL_MODEL_NAME", "Meta-Llama-3-8B-Instruct.Q4_0.gguf")
# Suggestion for faster CPU performance: Llama-3.2-3B-Instruct-Q4_K_M.gguf
MODEL_PATH = os.getenv("LOCAL_MODEL_PATH", "./models")
N_THREADS = int(os.getenv("N_THREADS", "4")) # Adjust based on VPS CPU cores
CONTEXT_WINDOW = int(os.getenv("CONTEXT_WINDOW", "2048"))
TOKEN_MARGIN = int(os.getenv("TOKEN_MARGIN", "64"))

# Global model instance
model = None

@app.on_event("startup")
async def startup_event():
    global model
    print(f"Loading model: {MODEL_NAME} with {N_THREADS} threads...")
    if not os.path.exists(MODEL_PATH):
        os.makedirs(MODEL_PATH)
    # This will download the model if it doesn't exist
    model = GPT4All(MODEL_NAME, model_path=MODEL_PATH, n_threads=N_THREADS)
    print("Model loaded successfully!")

# OpenAI-compatible Schemas
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024
    stream: Optional[bool] = False

class ChatCompletionResponseChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: str

class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatCompletionResponseChoice]
    usage: Optional[Usage] = None

from fastapi.responses import StreamingResponse
import json
import threading
import queue

@app.post("/v1/chat/completions")
@app.post("/v1/responses")  # Compatibility for newer AI SDKs
async def chat_completions(request: ChatCompletionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    print(f"--- Incoming Request ---")
    print(f"Model Requested: {request.model}")
    print(f"Stream Enabled: {request.stream}")
    print(f"Message Count: {len(request.messages)}")
    if request.messages:
        print(f"Last Message: {request.messages[-1].content[:100]}...")
    print(f"------------------------")

    try:
        # Format history for GPT4All
        system_prompt = ""
        prompt_messages = []
        
        for msg in request.messages:
            if msg.role == "system":
                system_prompt = msg.content
            else:
                prompt_messages.append({"role": msg.role, "content": msg.content})

        # Helper: approximate token count (simple whitespace split)
        def approx_tokens(text: str) -> int:
            if not text:
                return 0
            return len(text.split())

        # Build full prompt text and truncate if it exceeds the model context window.
        def build_truncated_prompt(system_prompt: str, messages: list, max_new_tokens: Optional[int]):
            max_new_tokens = max_new_tokens or 0
            full = ""
            if system_prompt:
                full += system_prompt + "\n"
            for m in messages:
                full += f"{m['role']}: {m['content']}\n"

            prompt_tokens = approx_tokens(full)
            allowed = CONTEXT_WINDOW - max_new_tokens - TOKEN_MARGIN
            if allowed < 0:
                allowed = 0

            if prompt_tokens > allowed:
                tokens = full.split()
                truncated = " ".join(tokens[-allowed:]) if allowed > 0 else ""
                print(f"[WARN] Prompt too long: {prompt_tokens} tokens, allowed {allowed}. Truncating to {approx_tokens(truncated)} tokens.")
                return truncated
            return full
        if request.stream:
            token_queue = queue.Queue()
            chat_id = f"chatcmpl-{int(time.time())}"
            created = int(time.time())

            def callback(token_id, token):
                token_queue.put(token)
                return True

            def generate_inference():
                try:
                    with model.chat_session(system_prompt if system_prompt else None):
                            # Build a truncated prompt to avoid LLaMA context overflow
                            truncated_prompt = build_truncated_prompt(system_prompt, prompt_messages, request.max_tokens)
                            model.generate(
                                truncated_prompt,
                                max_tokens=request.max_tokens,
                                temp=request.temperature,
                                callback=callback,
                                streaming=True
                            )
                except Exception as e:
                    print(f"Error during generation: {e}")
                    token_queue.put({"error": str(e)})
                finally:
                    token_queue.put(None) # Sentinel to end stream

            # Run inference in a separate thread
            thread = threading.Thread(target=generate_inference)
            thread.start()

            def generate_stream():
                try:
                    while True:
                        token = token_queue.get()
                        if token is None:
                            break
                        
                        # Check for errors
                        if isinstance(token, dict) and "error" in token:
                            error_chunk = {
                                "id": chat_id,
                                "object": "chat.completion.chunk",
                                "created": created,
                                "model": request.model,
                                "choices": [{
                                    "index": 0,
                                    "delta": {"content": f"[Error: {token['error']}]"},
                                    "finish_reason": "error"
                                }]
                            }
                            yield f"data: {json.dumps(error_chunk)}\n\n"
                            break
                        
                        chunk = {
                            "id": chat_id,
                            "object": "chat.completion.chunk",
                            "created": created,
                            "model": request.model,
                            "choices": [{
                                "index": 0,
                                "delta": {"content": token},
                                "finish_reason": None
                            }]
                        }
                        yield f"data: {json.dumps(chunk)}\n\n"
                    
                    # Final chunk
                    final_chunk = {
                        "id": chat_id,
                        "object": "chat.completion.chunk",
                        "created": created,
                        "model": request.model,
                        "choices": [{
                            "index": 0,
                            "delta": {},
                            "finish_reason": "stop"
                        }]
                    }
                    yield f"data: {json.dumps(final_chunk)}\n\n"
                    yield "data: [DONE]\n\n"
                except Exception as e:
                    print(f"Streaming error: {e}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"

            return StreamingResponse(
                generate_stream(), 
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"  # Disable nginx buffering
                }
            )

        # Non-streaming
        with model.chat_session(system_prompt if system_prompt else None):
            truncated_prompt = build_truncated_prompt(system_prompt, prompt_messages, request.max_tokens)
            output = model.generate(
                truncated_prompt,
                max_tokens=request.max_tokens,
                temp=request.temperature
            )

        # Estimate token counts (rough approximation)
        prompt_text = " ".join([msg.content for msg in request.messages])
        prompt_tokens = len(prompt_text.split())
        completion_tokens = len(output.split())

        response = ChatCompletionResponse(
            id=f"chatcmpl-{int(time.time())}",
            created=int(time.time()),
            model=request.model,
            choices=[
                ChatCompletionResponseChoice(
                    index=0,
                    message=ChatMessage(role="assistant", content=output),
                    finish_reason="stop"
                )
            ],
            usage=Usage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens
            )
        )
        
        print(f"✓ Response generated: {len(output)} chars")
        return response
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    import datetime
    return {
        "status": "ok", 
        "model": MODEL_NAME,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
    }

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 Ultramaxo AI Local Backend Starting...")
    print(f"📦 Model: {MODEL_NAME}")
    print(f"🧵 Threads: {N_THREADS}")
    print(f"📁 Model Path: {MODEL_PATH}")
    print(f"🌐 Server will run on: http://0.0.0.0:8000")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
