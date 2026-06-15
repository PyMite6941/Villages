from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import users, villages, posts, ai

app = FastAPI(
    title="Villages Platform API",
    description="AI-powered student community platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "https://villages.vercel.app",
        "https://villages.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(villages.router)
app.include_router(posts.router)
app.include_router(ai.router)

@app.get("/health")
async def health():
    return {"status": "ok", "platform": "Villages"}
