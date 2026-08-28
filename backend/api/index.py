import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

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
                "error": "Startup / Import Error on Vercel Serverless (backend/api/index.py)",
                "details": str(e),
                "traceback": err_trace,
                "sys_path": sys.path,
                "cwd": os.getcwd()
            }
        )
