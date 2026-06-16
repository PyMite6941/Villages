from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import ai, auth, posts, users, villages
from app.api.routes.courses import router as courses_router
from app.api.routes.courses import teacher_router
from app.config import settings

app = FastAPI(
    title="Villages Platform API",
    description="AI-powered student community platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    # Match ONLY this project's Vercel production + preview deploys
    # (e.g. villages-eight.vercel.app, villages-<hash>.vercel.app) — not any *.vercel.app.
    allow_origin_regex=r"https://villages[\w-]*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(villages.router)
app.include_router(posts.router)
app.include_router(ai.router)
app.include_router(courses_router)
app.include_router(teacher_router)

@app.get("/health")
async def health():
    return {"status": "ok", "platform": "Villages"}
