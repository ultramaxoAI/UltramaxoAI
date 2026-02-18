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

class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatCompletionResponseChoice]

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
    print(f"Last Message: {request.messages[-1].content}")
    print(f"------------------------")

    # Format history for GPT4All
    system_prompt = ""
    prompt_messages = []
    
    for msg in request.messages:
        if msg.role == "system":
            system_prompt = msg.content
        else:
            prompt_messages.append({"role": msg.role, "content": msg.content})

    if request.stream:
        token_queue = queue.Queue()
        chat_id = f"chatcmpl-{int(time.time())}"
        created = int(time.time())

        def callback(token_id, token):
            token_queue.put(token)
            return True

        def generate_inference():
            with model.chat_session(system_prompt):
                model.generate(
                    prompt_messages[-1]["content"],
                    max_tokens=request.max_tokens,
                    temp=request.temperature,
                    callback=callback,
                    streaming=True
                )
            token_queue.put(None) # Sentinel to end stream

        # Run inference in a separate thread
        thread = threading.Thread(target=generate_inference)
        thread.start()

        def generate_stream():
            while True:
                token = token_queue.get()
                if token is None:
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

        return StreamingResponse(generate_stream(), media_type="text/event-stream")

    # Non-streaming
    with model.chat_session(system_prompt):
        output = model.generate(
            prompt_messages[-1]["content"], 
            max_tokens=request.max_tokens,
            temp=request.temperature
        )

    return ChatCompletionResponse(
        id=f"chatcmpl-{int(time.time())}",
        created=int(time.time()),
        model=request.model,
        choices=[
            ChatCompletionResponseChoice(
                index=0,
                message=ChatMessage(role="assistant", content=output),
                finish_reason="stop"
            )
        ]
    )

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_NAME}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
