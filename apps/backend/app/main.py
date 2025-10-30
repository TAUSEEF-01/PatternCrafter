import orjson
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db
from .routers import auth, templates, tasks, annotations, admin


class ORJSONResponse(FastAPI):
    pass


app = FastAPI(title="PatternCrafter API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(o) for o in settings.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await init_db()


# Routers
app.include_router(auth.router)
app.include_router(templates.router)
app.include_router(tasks.router)
app.include_router(annotations.router)
app.include_router(admin.router)


@app.get("/healthz")
async def health():
    return {"status": "ok"}
