import sys
import os
from pathlib import Path

# Add backend directory to Python sys.path so 'app.*' imports resolve seamlessly on Vercel
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

# Export for Vercel Serverless
app = app
