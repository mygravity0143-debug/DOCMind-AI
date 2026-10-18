import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.multi_doc import router as multi_doc_router
from app.api.study import router as study_router
from app.api.analytics import router as analytics_router
from app.api.admin import router as admin_router
from app.api.health import router as health_router

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed demo user
        demo_user = db.query(User).filter(User.email == "demo@docmind.ai").first()
        if not demo_user:
            demo = User(
                email="demo@docmind.ai",
                full_name="Research Scholar",
                hashed_password=get_password_hash("password123"),
                role="user",
                is_active=True,
                settings_json=json.dumps({"preferred_model": "gemini", "theme_preference": "dark"})
            )
            db.add(demo)

        # Seed admin user
        admin_user = db.query(User).filter(User.email == "admin@docmind.ai").first()
        if not admin_user:
            admin = User(
                email="admin@docmind.ai",
                full_name="Lead Administrator",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True,
                settings_json=json.dumps({"preferred_model": "gemini", "theme_preference": "dark"})
            )
            db.add(admin)

        db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize tables and seed default users
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack AI-Powered Document Research Assistant with verified source citations.",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(multi_doc_router, prefix="/api")
app.include_router(study_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Welcome to DocMind AI API. Visit /docs for interactive Swagger API documentation.",
        "version": settings.VERSION,
        "status": "online"
    }
