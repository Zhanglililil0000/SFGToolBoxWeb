from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from services.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="SFG Tool Box", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import health, data_processing, calculator, database

app.include_router(health.router)
app.include_router(data_processing.router)
app.include_router(calculator.router)
app.include_router(database.router)

frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str, request: Request):
        file_path = frontend_dist / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
