from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine
from app.config import settings

@app.get("/api/db-check")
def db_connection_check(db: Session = Depends(get_db)):
    try:
        # Run live database query
        result = db.execute(text("SELECT 1 AS live, current_database(), current_user;")).fetchone()
        return {
            "status": "connected",
            "message": "Supabase Cloud Database is connected and responding!",
            "database": result[1],
            "connected_as": result[2],
            "engine_url_masked": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "masked"
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": "Database connection failed",
            "error": str(e),
            "trace": traceback.format_exc()[-300:]
        }
