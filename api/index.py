import os
import sys
from pathlib import Path

current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent

for p in [
    current_dir,
    parent_dir,
    parent_dir / "backend",
    Path("/var/task"),
    Path("/var/task/backend"),
    Path(os.getcwd()),
    Path(os.getcwd()) / "backend"
]:
    p_str = str(p)
    if p_str not in sys.path:
        sys.path.insert(0, p_str)

try:
    from app.main import app
except Exception as e:
    import traceback
    err_trace = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    
    app = FastAPI(title="Error Handler Fallback")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
    def catch_all(path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Startup / Import Error on Vercel Serverless",
                "details": str(e),
                "traceback": err_trace,
                "sys_path": sys.path,
                "cwd": os.getcwd()
            }
        )
