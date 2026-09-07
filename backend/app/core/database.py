# Re-export for backward compatibility
from app.db.database import Base, SessionLocal, engine
from app.dependencies import get_db